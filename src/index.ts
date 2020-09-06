import fs = require("fs");
import * as parser from "@babel/parser";
import traverse = require("@babel/traverse");
import generate from "@babel/generator";
import * as t from "@babel/types";
import prettier from "prettier";
import { NodePath } from "@babel/traverse";
import findContainingReactClass from "./util/findContainingReactClass";

const whitelistedAttributes = "subtitle text noText yesText label buttonCTAText title ctaLinkText".split(
  " "
);
const file = fs.readFileSync("./sample/CardLayout.jsx");
const ast = parser.parse(file.toString(), {
  sourceType: "module",
  plugins: ["jsx"],
});

let hasFormattedMessageImport = false;
traverse.default(ast, {
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
    const parentClass = findContainingReactClass(path as NodePath<t.Node>);
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

let code = hasFormattedMessageImport
  ? ""
  : "import {FormattedMessage} from 'react-intl';";
code += generate(ast).code;

fs.writeFileSync(
  "sample/output.jsx",
  code
  // prettier.format(code, {
  //   trailingComma: "es5",
  //   tabWidth: 2,
  //   semi: true,
  //   singleQuote: true,
  // })
);
