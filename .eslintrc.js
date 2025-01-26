const OFF = 0;
const WARN = 1;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ERROR = 2;

// eslint-disable-next-line unicorn/prefer-module
module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'airbnb',
        'airbnb-typescript',
        'airbnb/hooks',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'standard-with-typescript',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:eslint-comments/recommended',
        'plugin:unicorn/recommended',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: ['react', '@typescript-eslint', 'unicorn', 'promise', 'jsdoc'],
    rules: {
        '@typescript-eslint/no-unused-vars': WARN,
        'import/extensions': 'off',
        'no-param-reassign': 'off',
        'no-console': 'off',
        'no-multi-assign': 'off',
        'no-restricted-syntax': 'off',
        'no-shadow': 'off',
        'react/jsx-props-no-spreading': 'off',
        'jsdoc/check-alignment': 1,
        // 'jsdoc/check-examples': 1,
        'jsdoc/check-indentation': 1,
        'jsdoc/check-param-names': 1,
        'jsdoc/check-syntax': 1,
        'jsdoc/check-tag-names': 1,
        'jsdoc/check-types': 1,
        'jsdoc/require-description': 1,
        'jsdoc/require-jsdoc': 1,
        'jsdoc/require-param': 1,
        'jsdoc/require-param-description': 1,
        'jsdoc/require-param-name': 1,
        'jsdoc/require-param-type': 1,
        'jsdoc/require-returns': 1,
        'jsdoc/require-returns-check': 1,
        'jsdoc/require-returns-description': 1,
        'jsdoc/require-returns-type': 1,
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.tsx', '.ts', '.js', '.json'],
            },
            typescript: {},
        },
    },

    overrides: [
        {
            files: ['**/*.d.ts'],
            rules: {
                'import/no-duplicates': OFF,
            },
        },
        {
            files: ['scripts/**/*.ts'],
            rules: {
                'import/no-extraneous-dependencies': OFF,
            },
        },
        {
            files: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
            rules: {
                'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
            },
        },
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    ignorePatterns: ['deploy.js', 'jest.config.js', 'LICENSE'],
};
