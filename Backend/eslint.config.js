import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules', 'uploads', 'coverage'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-useless-escape': 'off',
      'no-undef': 'error',
    },
  },
];
