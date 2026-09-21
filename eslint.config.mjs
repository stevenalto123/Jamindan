import reactPlugin from 'eslint-plugin-react';
export default [
  {
    plugins: { react: reactPlugin },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    rules: { 'react/jsx-uses-vars': 'error', 'react/jsx-no-undef': 'error' }
  }
];
