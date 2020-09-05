import acorn = require("acorn");
import fs = require("fs");
import jsx = require("acorn-jsx");
const file = fs.readFileSync("./sample/Cardlayout.jsx");
var JSXParser = acorn.Parser.extend(jsx());
const ast: acorn.Node = JSXParser.parse(file.toString(), {
	ecmaVersion: 2020,
	sourceType: "module",
});
console.log(ast);
