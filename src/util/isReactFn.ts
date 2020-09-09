import traverse, { NodePath } from "@babel/traverse";

export default (path: NodePath) => {
  if (!path.isArrowFunctionExpression() && !path.isFunctionDeclaration()) {
    return false;
  }
  let containsJsx = false;
  traverse(
    path.node,
    {
      JSXElement: function () {
        containsJsx = true;
      },
    },
    path.scope,
    null,
    path
  );

  return containsJsx;
};
