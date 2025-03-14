var path = require('path')

const baseConfig = {
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
        globalObject: 'this',
        chunkFormat: false,
        library: {
            type: 'umd',
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.node'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
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

const webworkerIamBundleConfig = {
    target: 'webworker',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
    entry: {
        worker: './src/iam-webworker.ts',
    },
    resolve: {
        fallback: {
            path: 'path-browserify',
            os: 'os-browserify',
            https: 'https-browserify',
            http: 'stream-http',
            process: false,
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
        parser: {
            javascript: {
                importMeta: false,
            },
        },
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
}

module.exports = [nodeJsBearerTokenBundleConfig, nodeJsIamBundleConfig, webworkerIamBundleConfig]
