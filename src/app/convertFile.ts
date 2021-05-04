import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import prettier from 'prettier';
import findTopLevelReactFn from './util/findTopLevelReactFn';
import isTranslatablePattern from './util/isTranslatablePattern';
import FormatJsGenerator from './generators/FormatJsGenerator';
import isForbiddenPath from './util/isForbiddenPath';
import isTranslatablePath from './util/isTranslatablePath';
import I18nGeneratorInterface from './generators/i18nGeneratorInterface';

export default function (
  file: string,
  generator: I18nGeneratorInterface = new FormatJsGenerator()
): [string, number] {
  const ast = parser.parse(file, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
  let parentClass: NodePath<t.ClassDeclaration> | null;
  let modifications = 0;
  const replacePath = (path: any, replacement: t.Node) => {
    path.replaceWith(replacement);
    modifications++;
  };
  const getReactContext = (path: NodePath<t.Node>) =>
    parentClass
      ? path.findParent((parent) => parent.isClassMethod())
      : findTopLevelReactFn(<NodePath<t.Node>>path);
  traverse(ast, {
    JSXText: function (path) {
      const reactContext = getReactContext(path);
      if (reactContext && isTranslatablePattern(path.node.value.trim(), true)) {
        generator.addVariableToScopeIfNeeded(path, reactContext, parentClass);
        replacePath(path, generator.generateElementForJSXText(path));
        path.skip();
      }
    },
    ClassDeclaration: function (path) {
      const superClass = path.node.superClass;
      if (
        (superClass &&
          superClass.type === 'Identifier' &&
          superClass.name === 'Component') ||
        (t.isMemberExpression(superClass) &&
          t.isIdentifier(superClass.object) &&
          superClass.object.name === 'React')
      ) {
        parentClass = path;
      }
    },
    StringLiteral: function (path) {
      const reactContext = getReactContext(path);
      const { value } = path.node;
      if (
        !isForbiddenPath(path) &&
        isTranslatablePath(path) &&
        isTranslatablePattern(value) &&
        reactContext
      ) {
        generator.addVariableToScopeIfNeeded(path, reactContext, parentClass);
        replacePath(path, generator.generateElementForStringLiteral(path));
        path.skip();
      }
    },
    Identifier(path) {
      if (path.node.name === 'propTypes') {
        generator.replacePropTypes(path);
      }
    },
    ExportDefaultDeclaration(path) {
      traverse(
        path.node,
        {
          Identifier(path) {
            if (!parentClass) {
              return;
            }
            generator.replaceExportVariable(path, parentClass);
          },
        },
        path.scope,
        null,
        path.parentPath
      );
      path.skip();
    },
  });

  const code =
    generator.generateImports() +
    generate(ast, {
      jsescOption: {
        minimal: true,
      },
    }).code;

  return [
    modifications === 0
      ? file
      : prettier.format(code, {
          trailingComma: 'es5',
          tabWidth: 2,
          semi: true,
          singleQuote: true,
          jsxSingleQuote: true,
          parser: 'babel',
        }),
    modifications,
  ];
}
