import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
export default (path: NodePath<t.StringLiteral>) =>
  !!path.findParent(
    (parent) =>
      (parent.isJSXElement() &&
        parent.node.openingElement.name.type === "JSXIdentifier" &&
        parent.node.openingElement.name.name === "svg") ||
      (parent.isJSXAttribute() &&
        parent.node.name.type === "JSXIdentifier" &&
        parent.node.name.name === "className") ||
      (parent.isJSXOpeningElement() &&
        parent.node.name.type === "JSXIdentifier" &&
        parent.node.name.name === "FormattedMessage") ||
      (parent.isCallExpression() &&
        parent.node.callee.type === "MemberExpression" &&
        parent.node.callee.property.type === "Identifier" &&
        parent.node.callee.property.name === "formatMessage")
  );
