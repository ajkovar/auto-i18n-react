import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

const urlRegex = /^[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;

const fileUrlRegex = /^(\/?[A-Za-z0-9-]+)(\/[A-Za-z0-9-]+)+\.([a-zA-Z0-9-])+$/;

// Assume things with capital letters or certain punctuation are translatable.
// This may need to be adjusted
const naturalLanguageRegex = /[A-Z\.\,\!\:]/;

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
  const valueIsAcceptablePattern =
    !urlRegex.test(value) &&
    !fileUrlRegex.test(value) &&
    naturalLanguageRegex.test(value);
  if (
    !isChildOfFormattedMessage &&
    containerIsWhitelisted &&
    valueIsAcceptablePattern
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
