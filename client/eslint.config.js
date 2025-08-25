import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactMemo from 'eslint-plugin-react-memo';
import reactPerf from 'eslint-plugin-react-perf';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tailwindcss from 'eslint-plugin-tailwindcss';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'build']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
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
      'react-memo': reactMemo,
      'react-perf': reactPerf,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      tailwindcss,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs['recommended'].rules,

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-memo/require-memo': 'warn',
      'react-memo/require-usememo': 'warn',
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
]);
