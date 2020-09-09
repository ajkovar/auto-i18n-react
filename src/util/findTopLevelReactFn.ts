import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import isReactFn from "./isReactFn";

function findTopLevelReactFn(
  path: NodePath | null
): NodePath<t.ArrowFunctionExpression> | NodePath<t.FunctionDeclaration> | null {
  if (!path) {
    return null;
  }
  const parent = path.findParent((parent) => isReactFn(parent));
  return findTopLevelReactFn(parent) || parent as NodePath<t.ArrowFunctionExpression>;
}

export default findTopLevelReactFn;
