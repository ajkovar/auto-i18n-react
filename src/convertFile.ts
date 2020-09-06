import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import prettier from "prettier";
import findContainingReactClass from "./util/findContainingReactClass";
import findContainer from "./util/findContainer";
import translateStringLiteral from "./util/translateStringLiteral";

const whitelistedAttributes = "subtitle text noText yesText label buttonCTAText title ctaLinkText".split(
  " "
);
export default function (file: string) {
  const ast = parser.parse(file, {
    sourceType: "module",
    plugins: ["jsx"],
  });
  let hasFormattedMessageImport = false;
  let injectIntlImportNeeded = false;
  let parentClass: NodePath<t.ClassDeclaration> | null;
  traverse(ast, {
    ImportDeclaration: function (path) {
      hasFormattedMessageImport =
        hasFormattedMessageImport ||
        path.node.specifiers.some(
          (node) =>
            node.type === "ImportSpecifier" &&
            node.local.name === "FormattedMessage"
        );
    },
    JSXText: function (path) {
      if (path.node.value.trim() !== "") {
        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier("FormattedMessage"),
              [
                t.jsxAttribute(
                  t.jsxIdentifier("description"),
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
      const translatedVersion = translateStringLiteral(path)
      if (
        translatedVersion && 
        parentClass
      ) {
        const classMethod = findContainer(
          path as NodePath<t.Node>,
          "ClassMethod"
        ) as NodePath<t.ClassMethod>;
        if (!path.scope.hasBinding("intl")) {
          classMethod?.get("body").scope.push({
            id: t.identifier("intl"),
            init: t.memberExpression(
              t.memberExpression(t.thisExpression(), t.identifier("props")),
              t.identifier("intl")
            ),
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
    FormattedMessage: !hasFormattedMessageImport,
    injectIntl: injectIntlImportNeeded,
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
    trailingComma: "es5",
    tabWidth: 2,
    semi: true,
    singleQuote: true,
  });
}
