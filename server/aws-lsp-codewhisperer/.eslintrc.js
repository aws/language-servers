module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['import'],
    rules: {
        'import/no-nodejs-modules': 'warn',
    },
    ignorePatterns: ['**/*.test.ts', 'src.gen/', 'src/client/**/*.d.ts'],
}
