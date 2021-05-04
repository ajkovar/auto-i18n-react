import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import I18nGeneratorInterface from './i18nGeneratorInterface';

export default class FormatJsGenerator implements I18nGeneratorInterface {
  formattedMessageImportNeeded: boolean;
  hocInjectionNeeded: boolean;
  useIntlImportNeeded: boolean;
  hocImportNeeded: boolean;

  constructor() {
    this.formattedMessageImportNeeded = false;
    this.hocInjectionNeeded = false;
    this.useIntlImportNeeded = false;
    this.hocImportNeeded = false;
  }

  generateElementForJSXText(path: NodePath<t.JSXText>) {
    this.formattedMessageImportNeeded = !path.scope.hasBinding(
      'FormattedMessage'
    );
    return t.jsxExpressionContainer(
      t.callExpression(t.identifier('t'), [
        t.stringLiteral(path.node.value.trim().split('"').join('')),
      ])
    );
  }

  addVariableToScopeIfNeeded(
    path: NodePath<t.StringLiteral>,
    reactContext: NodePath<t.Node>,
    parentClass: NodePath<t.ClassDeclaration> | null
  ) {
    if (!path.scope.hasBinding('t')) {
      const init = parentClass
        ? t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier('props')),
            t.identifier('t')
          )
        : t.callExpression(t.identifier('useTranslation'), []);
      if (!parentClass) {
        this.useIntlImportNeeded = !path.scope.hasBinding('useTranslation');
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
          id: t.identifier('t'),
          init,
        });
    }
  }

  generateElementForStringLiteral(path: NodePath<t.StringLiteral>) {
    const { value } = path.node;
    const args = [t.stringLiteral(value)];
    const intlCallExpression = t.callExpression(t.identifier('t'), args);

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
            t.memberExpression(t.thisExpression(), t.identifier('props')),
            t.identifier('t')
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
        parent.node.callee.type == 'CallExpression' &&
        parent.node.callee.callee.type === 'Identifier' &&
        parent.node.callee.callee.name === 'withTranslation'
    );
    const className = parentClass.node.id.name;
    if (
      path.node.name === className &&
      !alreadyWrappedWithHoc &&
      this.hocInjectionNeeded
    ) {
      this.hocImportNeeded = !path.scope.hasBinding('withTranslation');
      path.replaceWith(
        t.callExpression(
          t.callExpression(t.identifier('withTranslation'), []),
          [t.identifier(className)]
        )
      );
      path.skip();
    }
  }

  generateImports() {
    const imports = {
      FormattedMessage: this.formattedMessageImportNeeded,
      withTranslation: this.hocImportNeeded,
      useIntl: this.useIntlImportNeeded,
    };
    const importsString = Object.entries(imports)
      .filter(([key, value]) => value)
      .map(([key]) => key)
      .join(', ');
    return importsString.length === 0
      ? ''
      : `import {${importsString}} from 'react-i18next';`;
  }

  replacePropTypes(path: NodePath<t.Identifier>) {
    if (this.hocInjectionNeeded) {
      const assignmentPath = path.findParent((path) =>
        path.isAssignmentExpression()
      );
      const propsObject = assignmentPath?.get('right') as NodePath<
        t.ObjectExpression
      >;
      const firstProp = propsObject.get('properties.0') as NodePath<
        t.ObjectProperty
      >;
      firstProp.insertBefore(
        t.objectProperty(
          t.identifier('t'),
          t.memberExpression(t.identifier('PropTypes'), t.identifier('object'))
        )
      );
    }
  }
}
