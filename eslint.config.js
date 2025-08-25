import pluginJs from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import optimizeRegex from 'eslint-plugin-optimize-regex';
import preferArrow from 'eslint-plugin-prefer-arrow';
import prettier from 'eslint-plugin-prettier';
import promise from 'eslint-plugin-promise';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import pluginReactMemo from 'eslint-plugin-react-memo';
import reactPerf from 'eslint-plugin-react-perf';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';
import globals from 'globals';

export default [
  pluginJs.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
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
      // Prettier
      'prettier/prettier': 'error',

      // Import rules
      'import/no-default-export': 'error',
      'import/default': 'error',
      'import/export': 'error',
      'import/named': 'error',
      'import/namespace': 'error',
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/no-unresolved': 'error',

      // Sorting imports
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^prismjs(/.*|$)'],
            ['^react$', '^react-dom$', '^react-router'],
            ['^antd', '^@mui', '^@chakra-ui', '^@?\\w'],
            ['^lodash', '^@?\\w'],
            ['^@/'],
            ['^\\./(?!.*\\.(css|scss)$)', '^\\.\\.(?!.*\\.(css|scss)$)'],
            ['^.+\\.s?css$'],
            ['^.+\\.(png|jpg|jpeg|gif|svg|webp|avif|ico|bmp|tiff|json)$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Code style
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

      // Formatting
      'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true }],
      'padded-blocks': ['error', 'never'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-parens': ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  {
    files: ['client/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': reactHooks,
      'react-memo': pluginReactMemo,
      'react-perf': reactPerf,
      'jsx-a11y': jsxA11y,
      tailwindcss,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      'react-memo/require-memo': 'warn',
      'react-memo/require-usememo': 'warn',

      'react-perf/jsx-no-new-object-as-prop': 'warn',
      'react-perf/jsx-no-new-array-as-prop': 'warn',
      'react-perf/jsx-no-new-function-as-prop': 'warn',

      'react/no-danger': 'warn',
      'react/style-prop-object': 'warn',
      'react/display-name': 'off',
      'react/require-optimization': 'warn',
      'react/jsx-no-bind': 'warn',
      'react/jsx-no-constructed-context-values': 'warn',
      'react/no-object-type-as-default-prop': 'warn',
      'react/no-unstable-nested-components': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      'jsx-a11y/alt-text': 'warn',

      'tailwindcss/classnames-order': [
        'warn',
        {
          order: [
            'layout',
            'positioning',
            'box-model',
            'typography',
            'background',
            'border',
            'effects',
            'interactivity',
            'animations',
          ],
          groupByResponsive: true,
          breakClassNamesByScreen: true,
        },
      ],
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          whitelist: ['custom\\-.*'],
        },
      ],
      'tailwindcss/enforces-shorthand': 'warn',
    },
  },
];
