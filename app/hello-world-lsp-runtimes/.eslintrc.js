module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['import'],
    rules: {
        'import/no-nodejs-modules': 'warn',
    },
    ignorePatterns: ['**/*.test.ts'],
}
