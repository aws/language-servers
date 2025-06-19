var path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const baseConfig = {
    mode: 'production',
    devtool: 'source-map', // Added source maps for debugging
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
    devtool: 'source-map', // Added source maps for debugging
}

const nodeJsIamBundleConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-codewhisperer-iam-binary': path.join(__dirname, 'src/iam-standalone.ts'),
    },
    target: 'node',
    devtool: 'source-map', // Added source maps for debugging
}

const isDevelopment = false

// bundles webworker
const webworkerConfig = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'inline-source-map' : 'source-map', // Always generate source maps
    optimization: {
        minimize: !isDevelopment,
        realContentHash: false,
    },
    entry: {
        worker: './src/iam-webworker.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    resolve: {
        fallback: {
            path: 'path-browserify',
            os: 'os-browserify',
            https: 'https-browserify',
            http: 'stream-http',
            crypto: 'crypto-browserify',
            stream: 'stream-browserify',
            fs: path.resolve(__dirname, 'src/mock-fs.js'),
            child_process: false,
            vm: false,
            dns: false,
            zlib: false,
            net: false,
            tls: false,
            http2: false,
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
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
}

// bundles main web page (running webworker) and serves it on localhost
const mainWebpageConfig = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'inline-source-map' : 'source-map', // Always generate source maps
    optimization: {
        minimize: !isDevelopment,
        realContentHash: false,
    },
    entry: {
        main: './src/main.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    resolve: {
        ...baseConfig.resolve,
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
            {
                test: /\.html$/i,
                loader: 'html-loader',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'public', 'index.html'),
            filename: 'index.html',
        }),
    ],
    devServer: {
        allowedHosts: 'all',
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        host: '127.0.0.1',
        port: 8080,
        webSocketServer: 'ws',
        server: 'http',
        client: {
            overlay: false, // Disables the red error overlay
        },
    },
}

module.exports = [nodeJsBearerTokenBundleConfig, nodeJsIamBundleConfig, webworkerConfig, mainWebpageConfig]
