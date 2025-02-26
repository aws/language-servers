var path = require('path')

const baseConfig = {
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
        globalObject: 'this',
        library: {
            type: 'umd',
        },
    },
    resolve: {
        extensions: ['.ts', '.js', '.node'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [/node_modules/],
            },
            {
                test: /\.node$/,
                loader: 'node-loader',
                options: {
                    name: '[name].[ext]', // Preserves original path and filename
                },
            },
        ],
    },
}

const nodeJsBundleConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-partiql-binary': path.join(__dirname, 'src/index.ts'),
    },
    target: 'node',
}

module.exports = [nodeJsBundleConfig]
