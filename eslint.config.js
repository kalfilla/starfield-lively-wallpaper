const eslint = require('@eslint/js');
const globals = require('globals');
const rules = {
  ...eslint.configs.recommended.rules,
  'arrow-body-style': ['error', 'always'],
  'brace-style': ['error', '1tbs', { allowSingleLine: false }],
  curly: ['error', 'all'],
  'max-statements-per-line': ['error', { max: 1 }],
};

module.exports = [
  {
    ignores: ['node_modules/**', 'WallpaperEngineExport/**'],
  },
  {
    files: ['files/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: globals.browser,
    },
    rules,
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules,
  },
];
