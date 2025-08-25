import pluginJs from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import optimizeRegex from 'eslint-plugin-optimize-regex';
import preferArrow from 'eslint-plugin-prefer-arrow';
import prettier from 'eslint-plugin-prettier';
import promise from 'eslint-plugin-promise';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  pluginJs.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs}'],
    ignores: ['client/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    plugins: {
      'prefer-arrow': preferArrow,
      import: pluginImport,
      'simple-import-sort': simpleImportSort,
      prettier,
      promise,
      'optimize-regex': optimizeRegex,
    },
    rules: {
      'prettier/prettier': 'error',

      'import/no-default-export': 'error',
      'import/default': 'error',
      'import/export': 'error',
      'import/named': 'error',
      'import/namespace': 'error',
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/no-unresolved': 'error',

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      quotes: ['error', 'single', { avoidEscape: true }],
      camelcase: ['warn', { properties: 'always' }],
      'sort-keys': ['off', 'asc', { caseSensitive: false, natural: true, minKeys: 2 }],
      'prefer-arrow/prefer-arrow-functions': [
        'warn',
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],
      'promise/prefer-await-to-then': 'warn',
      'require-await': 'warn',

      'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true }],
      'padded-blocks': ['error', 'never'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-parens': ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
