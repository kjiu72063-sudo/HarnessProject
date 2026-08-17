import eslint from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    settings: {
      'import/extensions': ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
        },
      },
    },
    plugins: {
      import: pluginImport,
    },
    rules: {
      'import/no-cycle': ['error', { ignoreExternal: true }],
      'max-lines': ['error', { max: 300, skipComments: true, skipBlankLines: true }],
      'max-lines-per-function': ['error', { max: 50, skipComments: true, skipBlankLines: true }],
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.name='fetch'] Literal[value=/^https?/]",
        message: '❌ 禁止硬编码 URL（http/https），使用相对路径 /api/... ✅ FIX: 改为 fetch(\'/api/...\') 📖 See: docs/architecture/boundaries.md',
      }],
    },
  },
  globalIgnores([
    'dist/**',
    'dist-server/**',
    'node_modules/**',
    'scripts/**',
    '.venv/**',
    'server/**',
    '.dependency-cruiser.cjs',
    'vite.config.ts',
  ]),
]);
