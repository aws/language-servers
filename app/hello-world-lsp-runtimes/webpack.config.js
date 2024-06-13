var path = require('path')
var webpack = require('webpack')

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

const nodeConfig = {
    ...baseConfig,
    entry: {
        'hello-world-lsp-standalone': path.join(__dirname, 'src/standalone.ts'),
    },
    target: 'node',
}

const webConfig = {
    ...baseConfig,
    entry: {
        'hello-world-lsp-webworker': path.join(__dirname, 'src/webworker.ts'),
    },
    target: 'web',
    plugins: [
        new webpack.ProvidePlugin({
            process: require.resolve('process/browser'),
        }),
        new webpack.EnvironmentPlugin({
            NODE_DEBUG: 'development',
            READABLE_STREAM: 'disable',
        }),
    ],
}

module.exports = [nodeConfig, webConfig]
