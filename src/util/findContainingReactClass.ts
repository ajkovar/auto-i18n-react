import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

function findContainingReactClass(path: NodePath): NodePath<t.ClassDeclaration> | null {
  if (
    path.node.type === "ClassDeclaration" &&
    ((path.node.superClass as t.MemberExpression)?.object as any).name ===
      "React"
  ) {
    return path as NodePath<t.ClassDeclaration>;
  }
  if (path.parentPath) {
    return findContainingReactClass(path.parentPath);
  }
  return null;
}
export default findContainingReactClass;
