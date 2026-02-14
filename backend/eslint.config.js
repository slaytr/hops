import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import checkFile from 'eslint-plugin-check-file';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['node_modules/**', 'dist/**', 'test/**'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'check-file': checkFile,
    },
    rules: {
      // TypeScript recommended rules with adjustments
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // File naming conventions - enforce kebab-case for all .ts files
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.ts': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],

      // Folder naming conventions - enforce kebab-case for folders
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/**/': 'KEBAB_CASE',
        },
      ],
    },
  },
];
