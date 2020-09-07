import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import isTranslatablePath from "./isTranslatablePath";
import isForbiddenPath from "./isForbiddenPath";
import isTranslatablePattern from "./isTranslatablePattern";

export default (path: NodePath<t.StringLiteral>) => {
  const { value } = path.node;
  if (
    !isForbiddenPath(path) &&
    isTranslatablePath(path) &&
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
