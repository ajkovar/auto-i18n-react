import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export default (path: NodePath<t.StringLiteral>) => {
  const { value } = path.node;
  const args = [
    t.objectExpression([
      t.objectProperty(t.identifier('defaultMessage'), t.stringLiteral(value)),
    ]),
  ];
  const intlCallExpression = t.callExpression(
    t.memberExpression(t.identifier('intl'), t.identifier('formatMessage')),
    args
  );

  const classMethod = path.findParent((parent) =>
    parent.isClassMethod()
  ) as NodePath<t.ClassMethod>;
  const isInsideConstructor =
    classMethod &&
    classMethod.node.key.type === 'Identifier' &&
    classMethod.node.key.name === 'constructor';

  return path.parentPath.isJSXAttribute()
    ? t.jsxExpressionContainer(intlCallExpression)
    : // a bit of a hack but for now just prepend 'this.' to the call if inside a constructor
    // since creating a var is a bit more difficult due to the super() needing to be first
    isInsideConstructor
    ? t.callExpression(
        t.memberExpression(
          t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier('props')),
            t.identifier('intl')
          ),
          t.identifier('formatMessage')
        ),
        args
      )
    : intlCallExpression;
};
