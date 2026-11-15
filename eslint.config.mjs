// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off', // Prisma generates complex types
      '@typescript-eslint/no-unsafe-member-access': 'off', // Prisma generates complex types
      '@typescript-eslint/no-unsafe-call': 'off', // Prisma generates complex types
      '@typescript-eslint/no-unsafe-assignment': 'off', // Prisma generates complex types
      '@typescript-eslint/no-unsafe-return': 'off', // Prisma generates complex types
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // The Apollo driver gives only 400, 401, 403 and 422 their own codes. A
      // Nest 404 or 409 reaches the gateway as INTERNAL_SERVER_ERROR, which it
      // hides from the caller and counts toward the error alert. Throw the
      // GraphQL errors in src/common/exceptions instead (NotFoundError...).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              importNames: [
                'NotFoundException',
                'ConflictException',
                'GoneException',
                'NotAcceptableException',
                'PayloadTooLargeException',
                'PreconditionFailedException',
                'UnsupportedMediaTypeException',
              ],
              message:
                'Becomes INTERNAL_SERVER_ERROR at the gateway; use the errors in src/common/exceptions.',
            },
          ],
        },
      ],
    },
  },
);
