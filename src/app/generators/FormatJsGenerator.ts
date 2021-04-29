import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import I18nGeneratorInterface from './i18nGeneratorInterface';

export default class FormatJsGenerator implements I18nGeneratorInterface {
  formattedMessageImportNeeded: boolean;
  hocInjectionNeeded: boolean;
  useIntlImportNeeded: boolean;
  injectIntlImportNeeded: boolean;

  constructor() {
    this.formattedMessageImportNeeded = false;
    this.hocInjectionNeeded = false;
    this.useIntlImportNeeded = false;
    this.injectIntlImportNeeded = false;
  }

  generateElementForJSXText(path: NodePath<t.JSXText>) {
    this.formattedMessageImportNeeded = !path.scope.hasBinding(
      'FormattedMessage'
    );
    return t.jsxElement(
      t.jsxOpeningElement(
        t.jsxIdentifier('FormattedMessage'),
        [
          t.jsxAttribute(
            t.jsxIdentifier('defaultMessage'),
            // TODO fix this so double quotes will be allowed
            t.stringLiteral(path.node.value.trim().split('"').join(''))
          ),
        ],
        true
      ),
      null,
      []
    );
  }

  addVariableToScopeIfNeeded(
    path: NodePath<t.StringLiteral>,
    reactContext: NodePath<t.Node>,
    parentClass: NodePath<t.ClassDeclaration> | null
  ) {
    if (!path.scope.hasBinding('intl')) {
      const init = parentClass
        ? t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier('props')),
            t.identifier('intl')
          )
        : t.callExpression(t.identifier('useIntl'), []);
      if (!parentClass) {
        this.useIntlImportNeeded = !path.scope.hasBinding('useIntl');
      } else {
        this.hocInjectionNeeded = true;
      }
      // don't use variable in constructor for now because it gets printed before
      // super which causes an error
      !(
        reactContext.isClassMethod() &&
        reactContext.node.key.type === 'Identifier' &&
        reactContext.node.key.name === 'constructor'
      ) &&
        (<NodePath<t.Node>>reactContext?.get('body')).scope.push({
          id: t.identifier('intl'),
          init,
        });
    }
  }

  generateElementForStringLiteral(path: NodePath<t.StringLiteral>) {
    const { value } = path.node;
    const args = [
      t.objectExpression([
        t.objectProperty(
          t.identifier('defaultMessage'),
          t.stringLiteral(value)
        ),
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
  }

  replaceExportVariable(
    path: NodePath<t.Identifier>,
    parentClass: NodePath<t.ClassDeclaration>
  ) {
    const alreadyWrappedWithHoc = !!path.findParent(
      (parent) =>
        parent.isCallExpression() &&
        parent.node.callee.type === 'Identifier' &&
        parent.node.callee.name === 'injectIntl'
    );
    const className = parentClass.node.id.name;
    if (
      path.node.name === className &&
      !alreadyWrappedWithHoc &&
      this.hocInjectionNeeded
    ) {
      this.injectIntlImportNeeded = !path.scope.hasBinding('injectIntl');
      path.replaceWith(
        t.callExpression(t.identifier('injectIntl'), [t.identifier(className)])
      );
      path.skip();
    }
  }

  generateImports() {
    const imports = {
      FormattedMessage: this.formattedMessageImportNeeded,
      injectIntl: this.injectIntlImportNeeded,
      useIntl: this.useIntlImportNeeded,
    };
    return Object.entries(imports)
      .filter(([key, value]) => value)
      .map(([key]) => key)
      .join(', ');
  }

  replacePropTypes(path: NodePath<t.Identifier>) {
    if (this.hocInjectionNeeded) {
      const assignmentPath = path.findParent((path) =>
        path.isAssignmentExpression()
      );
      const firstProp = (assignmentPath?.get('right') as NodePath<
        t.ObjectExpression
      >).get('properties.0') as NodePath<t.ObjectProperty>;
      firstProp.insertBefore(
        t.objectProperty(
          t.identifier('intl'),
          t.memberExpression(t.identifier('PropTypes'), t.identifier('object'))
        )
      );
    }
  }
}