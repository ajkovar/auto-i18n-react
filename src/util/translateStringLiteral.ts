import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import isTranslatablePattern from "./isTranslatablePattern";

export default (path: NodePath<t.StringLiteral>) => {
  const allowedContainers = [
    "JSXExpressionContainer",
    "ConditionalExpression",
    "JSXAttribute",
  ];
  const isObjectPropertyValue =
    path.parentPath.isObjectProperty() && path.parentPath.get("value") === path;
  const containerIsWhitelisted =
    allowedContainers.includes(path.parentPath.node.type) ||
    isObjectPropertyValue;
  const isChildOfFormattedMessage = path.findParent(
    (parent) =>
      parent.isJSXOpeningElement() &&
      parent.node.name.type === "JSXIdentifier" &&
      parent.node.name.name === "FormattedMessage"
  );
  const { value } = path.node;
  if (
    !isChildOfFormattedMessage &&
    containerIsWhitelisted &&
    isTranslatablePattern(value)
  ) {
    const intlCallExpression = t.callExpression(
      t.memberExpression(t.identifier("intl"), t.identifier("formatMessage")),
      [
        t.objectExpression([
          t.objectProperty(
            t.identifier("defaultMessage"),
            t.stringLiteral(value)
          ),
        ]),
      ]
    );
    return path.parentPath.isJSXAttribute()
      ? t.jsxExpressionContainer(intlCallExpression)
      : intlCallExpression;
  }
  return null;
};
