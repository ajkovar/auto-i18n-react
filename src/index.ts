import fs = require("fs");
import * as parser from "@babel/parser";
import traverse = require("@babel/traverse");
import generate from "@babel/generator";
import * as t from "@babel/types";
import prettier from "prettier";

const file = fs.readFileSync("./sample/Cardlayout.jsx");
const ast = parser.parse(file.toString(), {
  sourceType: "module",
  plugins: ["jsx"],
});

let hasFormattedMessageImport = false;
traverse.default(ast, {
  ImportDeclaration: function (path) {
    hasFormattedMessageImport = hasFormattedMessageImport || path.node.specifiers.some(
      (node) =>
        node.type === "ImportSpecifier" && node.local.name === "FormattedMessage"
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
    }
  },
});
console.log(hasFormattedMessageImport);

let code = hasFormattedMessageImport ? '' : "import {FormattedMessage} from 'react-intl';"; 
code += generate(ast).code;


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
