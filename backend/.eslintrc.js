module.exports = {
  env: {
    browser: false,
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [],
  rules: {
    // Reglas generales
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',

    // Reglas específicas de Node.js
    'no-process-exit': 'warn',
    'handle-callback-err': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error',

    // Reglas de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // Reglas de mejores prácticas
    'eqeqeq': ['error', 'always'],
    'no-duplicate-imports': 'error',
    'no-template-curly-in-string': 'error',
    'require-await': 'error',
    'no-return-await': 'error',

    // Reglas de seguridad
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js', '**/__tests__/**'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['models/**/*.js'],
      rules: {
        'no-console': 'off', // Permitir console en modelos para debugging
      },
    },
    {
      files: ['controllers/**/*.js'],
      rules: {
        'no-console': 'off', // Permitir console en controladores para logging
      },
    },
    {
      files: ['routes/**/*.js'],
      rules: {
        'no-console': 'off', // Permitir console en rutas para debugging
      },
    },
  ],
};