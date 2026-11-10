import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules',
      'playwright-report',
      'test-results',
      'allure-results',
      'allure-report',
      'reports',
      '.auth',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    rules: {
      'no-restricted-properties': ['error', { property: 'waitForTimeout', message: 'Wait for a condition instead.' }],
      'no-restricted-syntax': [
        'error',
        { selector: "Literal[value='networkidle']", message: 'Wait for a condition instead.' },
      ],
    },
  },
  {
    files: ['src/fixtures/**'],
    rules: { 'no-empty-pattern': 'off' },
  },
);
