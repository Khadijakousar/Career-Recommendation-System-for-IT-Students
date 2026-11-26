import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['src/generated/', 'coverage/'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
];
