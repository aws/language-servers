module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    rules: {
        // Add rules here
    },
    overrides: [
        {
            // Lint webworker bundle does not use browser-incompatible NodeJS APIs in source code and upstream dependencies
            files: ['out/hello-world-lsp-webworker.js'],
            plugins: ['import'],
            rules: {
                'import/no-nodejs-modules': 'error',
            },
        },
    ],
}
