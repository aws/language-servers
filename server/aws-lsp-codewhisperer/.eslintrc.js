module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
    },
    plugins: ['import', '@typescript-eslint'],
    rules: {
        'import/no-nodejs-modules': 'warn',
        '@typescript-eslint/no-floating-promises': 'error',
        'no-restricted-globals': [
            'error',
            {
                name: 'crypto',
                message: 'Do not use global crypto object which only exists in browsers and fails for node runtimes',
            },
        ],
    },
    ignorePatterns: ['**/*.test.ts', 'out/', 'src.gen/', 'src/client/**/*.d.ts'],
    overrides: [
        {
            // Lint webworker bundle does not use browser-incompatible NodeJS APIs in source code and upstream dependencies
            files: ['bundle/aws-lsp-codewhisperer-webworker.js'],
            rules: {
                'import/no-nodejs-modules': 'error',
            },
        },
    ],
}
