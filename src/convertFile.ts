import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import prettier from "prettier";
import translateStringLiteral from "./util/translateStringLiteral";
import findTopLevelReactFn from "./util/findTopLevelReactFn";
import isTranslatablePattern from "./util/isTranslatablePattern";

export default function (file: string): [string, number] {
  const ast = parser.parse(file, {
    sourceType: "module",
    plugins: ["jsx"],
  });
  let formattedMessageImportNeeded = false;
  let injectIntlImportNeeded = false;
  let useIntlImportNeeded = false;
  let parentClass: NodePath<t.ClassDeclaration> | null;
  let modifications = 0;
  const replacePath = (path: any, replacement: t.Node) => {
    path.replaceWith(replacement);
    modifications++;
  };
  traverse(ast, {
    JSXText: function (path) {
      if (isTranslatablePattern(path.node.value.trim())) {
        formattedMessageImportNeeded = !path.scope.hasBinding(
          "FormattedMessage"
        );
        replacePath(
          path,
          t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier("FormattedMessage"),
              [
                t.jsxAttribute(
                  t.jsxIdentifier("defaultMessage"),
                  // TODO fix this so double quotes will be allowed
                  t.stringLiteral(path.node.value.trim().split('"').join(""))
                ),
              ],
              true
            ),
            null,
            []
          )
        );
        path.skip();
      }
    },
    ClassDeclaration: function (path) {
      const superClass = path.node.superClass;
      if (
        (superClass &&
          superClass.type === "Identifier" &&
          superClass.name === "Component") ||
        (t.isMemberExpression(superClass) &&
          t.isIdentifier(superClass.object) &&
          superClass.object.name === "React")
      ) {
        parentClass = path;
      }
    },
    StringLiteral: function (path) {
      const translatedVersion = translateStringLiteral(path);
      const reactContext = parentClass
        ? path.findParent((parent) => parent.isClassMethod())
        : findTopLevelReactFn(path as NodePath<t.Node>);
      if (translatedVersion && reactContext) {
        if (!path.scope.hasBinding("intl")) {
          const init = parentClass
            ? t.memberExpression(
                t.memberExpression(t.thisExpression(), t.identifier("props")),
                t.identifier("intl")
              )
            : t.callExpression(t.identifier("useIntl"), []);
          if (!parentClass) {
            useIntlImportNeeded = !path.scope.hasBinding("useIntl");
          }
          // don't use variable in constructor for now because it gets printed before
          // super which causes an error
          !(
            reactContext.isClassMethod() &&
            reactContext.node.key.type === "Identifier" &&
            reactContext.node.key.name === "constructor"
          ) &&
            (reactContext?.get("body") as NodePath<t.Node>).scope.push({
              id: t.identifier("intl"),
              init,
            });
        }
        replacePath(path, translatedVersion);
        path.skip();
      }
    },
    ExportDefaultDeclaration(path) {
      traverse(
        path.node,
        {
          Identifier(path) {
            if (!parentClass) {
              return;
            }
            const alreadyWrappedWithHoc = !!path.findParent(
              (parent) =>
                parent.isCallExpression() &&
                parent.node.callee.type === "Identifier" &&
                parent.node.callee.name === "injectIntl"
            );
            const className = parentClass.node.id.name;
            if (path.node.name === className && !alreadyWrappedWithHoc) {
              injectIntlImportNeeded = !path.scope.hasBinding("injectIntl");
              replacePath(
                path,
                t.callExpression(t.identifier("injectIntl"), [
                  t.identifier(className),
                ])
              );
              path.skip();
            }
          },
        },
        path.scope,
        null,
        path.parentPath
      );
      path.skip();
    },
  });

  const imports = {
    FormattedMessage: formattedMessageImportNeeded,
    injectIntl: injectIntlImportNeeded,
    useIntl: useIntlImportNeeded,
  };

  const importsString = Object.entries(imports)
    .filter(([key, value]) => value)
    .map(([key]) => key)
    .join(", ");

  const code =
    (importsString.length === 0
      ? ""
      : `import {${importsString}} from 'react-intl';`) + generate(ast).code;

  return [
    modifications === 0
      ? file
      : prettier.format(code, {
          trailingComma: "none",
          tabWidth: 2,
          semi: true,
          singleQuote: true,
          jsxSingleQuote: true,
          parser: "babel",
        }),
    modifications,
  ];
}
