// frontend/.eslintrc.cjs

module.exports = {
  root: true,
  // O ambiente padrão é o navegador
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  // Ignora a pasta de build e a si mesmo
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  // AQUI ESTÁ A MÁGICA:
  overrides: [
    {
      // Para qualquer arquivo .cjs na raiz do projeto...
      files: ['*.cjs'],
      // ...defina o ambiente como Node.js.
      env: {
        node: true,
      },
    },
  ],
};
