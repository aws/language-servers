var path = require('path')

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

const nodeJsBearerTokenBundleConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-codewhisperer-token-binary': path.join(__dirname, 'src/token-standalone.ts'),
    },
    target: 'node',
}

const nodeJsIamBundleConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-codewhisperer-iam-binary': path.join(__dirname, 'src/iam-standalone.ts'),
    },
    target: 'node',
}

module.exports = [nodeJsBearerTokenBundleConfig, nodeJsIamBundleConfig]
