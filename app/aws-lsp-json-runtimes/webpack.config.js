var path = require('path')
var webpack = require('webpack')

const baseConfig = {
    mode: 'development',
    output: {
        path: __dirname,
        filename: 'build/[name].js',
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

const nodeConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-json-standalone': path.join(__dirname, 'src/index.ts'),
    },
    target: 'node',
}

module.exports = [nodeConfig]
