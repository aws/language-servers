var path = require('path')

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

const nodeJsBearerTokenBundleConfig = {
    ...baseConfig,
    experiments: {
        asyncWebAssembly: true,
    },
    entry: {
        'aws-lsp-codewhisperer-token-binary': path.join(__dirname, 'src/token-standalone.ts'),
    },
    resolve: {
        ...baseConfig.resolve,
        alias: {
            '@aws/fully-qualified-names$': '@aws/fully-qualified-names/node/aws_fully_qualified_names.js',
        },
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
