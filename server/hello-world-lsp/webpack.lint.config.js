var path = require('path')

const baseConfig = {
    mode: 'development',
    output: {
        path: __dirname,
        filename: 'bundle/[name].js',
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
    experiments: {
        asyncWebAssembly: true,
    },
    entry: {
        'hello-world-lsp-nodejs': path.join(__dirname, 'src/index.ts'),
    },
    target: 'node',
}

const webBundleConfig = {
    ...baseConfig,
    entry: {
        'hello-world-lsp-webworker': path.join(__dirname, 'src/index.ts'),
    },
    target: 'webworker',
}

module.exports = [nodeJsBundleConfig, webBundleConfig]
