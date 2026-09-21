// Next's and Payload's shipped ESLint setups, unmodified (build-conventions.md).
//
// The only departure from Payload's template file is that it wraps Next's config in
// `FlatCompat`; eslint-config-next 16 ships flat config natively, and the compat shim
// crashes on it. Next's rule sets and Payload's rule softening below are untouched.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    ignores: [
      '.next/',
      'coverage/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      // The `prototype` skill's throwaway scratch space, also gitignored.
      'prototype/',
    ],
  },
]

export default eslintConfig
