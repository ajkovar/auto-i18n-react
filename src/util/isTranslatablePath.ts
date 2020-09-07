import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
const allowedContainers = [
  "JSXExpressionContainer",
  "ConditionalExpression",
  "JSXAttribute",
];
export default (path: NodePath<t.StringLiteral>) => {
  const isObjectPropertyValue =
    path.parentPath.isObjectProperty() && path.parentPath.get("value") === path;
  return (
    allowedContainers.includes(path.parentPath.node.type) ||
    isObjectPropertyValue
  );
};
