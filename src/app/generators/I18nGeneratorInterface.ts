import { NodePath } from '@babel/core';
import * as t from '@babel/types';

export default interface I18nGeneratorInterface {
  generateElementForJSXText(path: NodePath<t.JSXText>): t.Node;
  addVariableToScopeIfNeeded(
    path: NodePath<t.Node>,
    reactContext: NodePath<t.Node>,
    parentClass: NodePath<t.ClassDeclaration> | null
  ): void;
  generateElementForStringLiteral(
    path: NodePath<t.StringLiteral>
  ): t.CallExpression | t.JSXExpressionContainer;
  replaceExportVariable(
    path: NodePath<t.Identifier>,
    parentClass: NodePath<t.ClassDeclaration>
  ): void;
  generateImports(): string;
  replacePropTypes(path: NodePath<t.Identifier>): void;
}
