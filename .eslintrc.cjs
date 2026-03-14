module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'script',
    project: './tsconfig.json',  // 修改这里，启用项目类型检查
    tsconfigRootDir: __dirname,
    warnOnUnsupportedTypeScriptVersion: false,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/base',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-console': 'off',
    'no-extra-semi': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    'semi': ['error', 'always'],
    // 更严格地处理未使用的变量，包括导入
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_', 
      varsIgnorePattern: '^_', 
      caughtErrorsIgnorePattern: '^_' 
    }],
  },
  globals: {
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly',
    wx: 'readonly',
    WechatMiniprogram: 'readonly',
    IAppOption: 'readonly',
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script',
        project: './tsconfig.json',  // 为 TypeScript 文件启用项目类型检查
      },
    },
  ],
};