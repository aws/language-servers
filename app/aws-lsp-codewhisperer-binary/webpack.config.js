var path = require('path')
// var webpack = require('webpack')

const baseConfig = {
    mode: 'development',
    output: {
        path: __dirname,
        filename: 'out/[name].js',
        globalObject: 'this',
        library: {
            type: 'umd',
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
}

const nodeJsBundleConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-codewhisperer-binary': path.join(__dirname, 'src/index.ts'),
    },
    target: 'node',
}

module.exports = [nodeJsBundleConfig]
