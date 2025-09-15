module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['import'],
    rules: {
        'import/no-nodejs-modules': 'warn',
    },
    ignorePatterns: ['**/*.test.ts', 'out/'],
    overrides: [
        {
            // Lint webworker bundle does not use browser-incompatible NodeJS APIs in source code and upstream dependencies
            files: ['bundle/hello-world-lsp-webworker.js'],
            rules: {
                'import/no-nodejs-modules': 'error',
            },
        },
    ],
}
