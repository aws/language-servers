const babelJestModule = require('babel-jest')
const babelJest = babelJestModule.default

module.exports = babelJest.createTransformer({
    plugins: [
        require.resolve('@babel/plugin-transform-modules-commonjs'),
        require.resolve('babel-plugin-transform-import-meta'),
    ],
})
