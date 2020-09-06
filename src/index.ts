import fs = require("fs");
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import prettier from "prettier";
import findContainingReactClass from "./util/findContainingReactClass";
import findContainer from "./util/findContainer";
import template from "@babel/template";

const whitelistedAttributes = "subtitle text noText yesText label buttonCTAText title ctaLinkText".split(
  " "
);
const file = fs.readFileSync("./sample/CardLayout.jsx");
const ast = parser.parse(file.toString(), {
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
  StringLiteral: function (path) {
    parentClass = findContainingReactClass(path as NodePath<t.Node>);
    const allowedContainers = [
      "JSXExpressionContainer",
      "ConditionalExpression",
      "JSXAttribute",
      "ObjectProperty",
    ];
    // Assume things with capital letters or certain punctuation are translatable.
    // This may need to be adjusted
    const textRegexp = /[A-Z\.\,\!\:]/;
    if (
      allowedContainers.includes(path.parentPath.node.type) &&
      textRegexp.exec(path.node.value) &&
      parentClass
    ) {
      const classMethod = findContainer(
        path as NodePath<t.Node>,
        "ClassMethod"
      ) as NodePath<t.ClassMethod>;
      //   const topLevelBlock = (classMethod?.node as t.ClassMethod).body;
      //   topLevelBlock.body.some(
      //     (statement) =>
      //       statement.type === "VariableDeclaration" &&
      //       statement.declarations.some(
      //         (declarator) =>
      //           declarator.id.type === "ObjectPattern" &&
      //           declarator.id.properties.some(
      //             (property) => property.key.name == "intl"
      //           )
      //       )
      //   );
      if (!path.scope.hasBinding("intl")) {
        // classMethod
        //   ?.get("body")
        //   .unshiftContainer("body", template.ast("const {intl} = this.props;"));
        classMethod?.get("body").scope.push({
          id: t.identifier("intl"),
          init: t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier("props")),
            t.identifier("intl")
          ),
          //   template.ast("const {intl} = this.props;")
        });
      }
      const intlCallExpression = t.callExpression(
        t.memberExpression(t.identifier("intl"), t.identifier("formatMessage")),
        [t.stringLiteral(path.node.value)]
      );
      path.replaceWith(
        path.parentPath.node.type === "JSXAttribute"
          ? t.jsxExpressionContainer(intlCallExpression)
          : intlCallExpression
      );
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
  //   JSXAttribute: function (path) {
  //     // TODO move this to StringLiteral selector
  //     const whitelistedAttributes = "subtitle text noText yesText label buttonCTAText title ctaLinkText".split(
  //       " "
  //     );
  //     const node = path.node as t.JSXAttribute;
  //     const attrName = node.name.name.toString();
  //     if (whitelistedAttributes.includes(attrName)) {
  //       const parentClass = findContainingReactClass(path as NodePath<t.Node>);
  //       //   console.log(attrName);
  //       //   const conditional =
  //       //     node.value?.type === "JSXExpressionContainer" &&
  //       //     (node.value as t.JSXExpressionContainer).expression.type ===
  //       //       "ConditionalExpression" &&
  //       //     (((node.value as t.JSXExpressionContainer)
  //       //       .expression as t.ConditionalExpression).alternate.type ===
  //       //       "StringLiteral" ||
  //       //       ((node.value as t.JSXExpressionContainer)
  //       //         .expression as t.ConditionalExpression).consequent.type ===
  //       //         "StringLiteral");
  //       //   const literal =
  //       //     node.value?.type === "JSXExpressionContainer" &&
  //       //     (node.value as t.JSXExpressionContainer).expression.type ===
  //       //       "StringLiteral";
  //       if (parentClass) {
  //         path.replaceWith(
  //           t.jsxAttribute(
  //             t.jsxIdentifier(attrName),
  //             t.jsxExpressionContainer(
  //               t.callExpression(
  //                 // t.memberExpression(
  //                 //   t.identifier("this"),
  //                 t.memberExpression(
  //                   t.identifier("intl"),
  //                   t.identifier("formatMessage")
  //                 ),
  //                 // ),
  //                 // [t.stringLiteral(node.value?.value)]
  //                 [t.stringLiteral("test")]
  //               )
  //             )
  //           )
  //         );
  //       }
  //       path.skip();
  //     }
  //   },
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

fs.writeFileSync(
  "sample/output.jsx",
//   code
  prettier.format(code, {
    trailingComma: "es5",
    tabWidth: 2,
    semi: true,
    singleQuote: true,
  })
);
