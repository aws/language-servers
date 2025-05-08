var path = require('path')

const baseConfig = {
    mode: 'production',
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
    output: {
        path: __dirname,
        globalObject: 'this',
        library: {
            type: 'umd',
        },
    },
    target: 'node',
    experiments: {
        asyncWebAssembly: true,
    },
}

const nodeJsBearerTokenBundleConfig = {
    ...baseConfig,
    experiments: {
        asyncWebAssembly: true,
    },
    entry: {
        'aws-lsp-codewhisperer': path.join(__dirname, 'src/agent-standalone.ts'),
    },
    output: {
        ...baseConfig.output,
        path: __dirname,
        filename: `build/[name].js`,
        chunkFormat: false,
    },
    resolve: {
        ...baseConfig.resolve,
    },
    target: 'node',
}

module.exports = [nodeJsBearerTokenBundleConfig]
