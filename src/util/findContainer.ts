import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

function findContainer(path: NodePath, type: String): NodePath | null {
  if (path.node.type === type) {
    return path;
  }
  if (path.parentPath) {
    return findContainer(path.parentPath, type);
  }
  return null;
}
export default findContainer;
