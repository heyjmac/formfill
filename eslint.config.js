import pluginJs from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import optimizeRegex from 'eslint-plugin-optimize-regex';
import preferArrow from 'eslint-plugin-prefer-arrow';
import prettier from 'eslint-plugin-prettier';
import promise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPerf from 'eslint-plugin-react-perf';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';
import globals from 'globals';

export default [
  pluginJs.configs.recommended,

  {
    ignores: ['dist', 'build'],
  },

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
      'func-style': ['error', 'expression'],
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

  {
    files: ['./client/src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-perf': reactPerf,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      tailwindcss,
      import: pluginImport,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs['recommended'].rules,
      'func-style': ['error', 'expression'],

      'import/no-duplicates': 'error',
      'react/display-name': 'off',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/jsx-no-constructed-context-values': 'warn',
      'react-perf/jsx-no-new-function-as-prop': 'warn',
      'react-perf/jsx-no-new-object-as-prop': 'warn',
      'react-perf/jsx-no-new-array-as-prop': 'warn',

      'jsx-a11y/alt-text': 'warn',

      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': ['warn', { whitelist: ['custom\\-.*'] }],
      'tailwindcss/enforces-shorthand': 'warn',

      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
];
