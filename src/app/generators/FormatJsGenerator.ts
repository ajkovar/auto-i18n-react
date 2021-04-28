import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import translateStringLiteral from '../util/translateStringLiteral';

export default class FormatJsGenerator {
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
  translateStringLiteral(
    path: NodePath<t.StringLiteral>,
    reactContext: NodePath<t.Node>,
    parentClass: NodePath<t.ClassDeclaration> | null
  ) {
    const { value } = path.node;
    const translatedVersion = translateStringLiteral(path);
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
    return translatedVersion;
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
