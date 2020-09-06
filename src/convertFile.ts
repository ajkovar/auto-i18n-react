import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import prettier from "prettier";
import translateStringLiteral from "./util/translateStringLiteral";
import isReactFn from "./util/isReactFn";

const whitelistedAttributes = "subtitle text noText yesText label buttonCTAText title ctaLinkText".split(
  " "
);
export default function (file: string) {
  const ast = parser.parse(file, {
    sourceType: "module",
    plugins: ["jsx"],
  });
  let formattedMessageImportNeeded = false;
  let injectIntlImportNeeded = false;
  let useIntlImportNeeded = false;
  let parentClass: NodePath<t.ClassDeclaration> | null;
  traverse(ast, {
    JSXText: function (path) {
      if (path.node.value.trim() !== "") {
        formattedMessageImportNeeded = !path.scope.hasBinding(
          "FormattedMessage"
        );
        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier("FormattedMessage"),
              [
                t.jsxAttribute(
                  t.jsxIdentifier("defaultMessage"),
                  t.stringLiteral(path.node.value.trim())
                ),
              ],
              false
            ),
            t.jsxClosingElement(t.jsxIdentifier("FormattedMessage")),
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
        : path.findParent((parent) => isReactFn(parent));
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
          (reactContext?.get("body") as NodePath<t.Node>).scope.push({
            id: t.identifier("intl"),
            init,
          });
        }
        path.replaceWith(translatedVersion);
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
            const className = parentClass.node.id.name;
            if (path.node.name === className) {
              injectIntlImportNeeded = !path.scope.hasBinding("injectIntl");
              path.replaceWith(
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

  return prettier.format(code, {
    trailingComma: "none",
    tabWidth: 2,
    semi: true,
    singleQuote: true,
    jsxSingleQuote: true
  });
}
