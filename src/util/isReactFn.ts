import { NodePath } from "@babel/traverse";

export default (path: NodePath) => {
  // TODO improve this
  return path.isArrowFunctionExpression();
};
