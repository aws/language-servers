var path = require('path')
var webpack = require('webpack')

const isDevelopment = true

const baseConfig = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'inline-source-map' : undefined,
    output: {
        path: __dirname,
        filename: 'build/bundle/[name].js',
        globalObject: 'this',
        library: {
            type: 'umd',
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        fallback: {
            path: require.resolve('path-browserify'),
        },
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: require.resolve('process/browser'),
        }),
        new webpack.EnvironmentPlugin({
            NODE_DEBUG: 'development',
            READABLE_STREAM: 'disable',
        }),
    ],

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /node_modules[\\|/](vscode-json-languageservice)/,
                use: { loader: 'umd-compat-loader' },
            },
        ],
    },
}

const webConfig = {
    ...baseConfig,
    entry: {
        jsonWebWorkerRuntimeServer: path.join(__dirname, 'src/jsonWebWorkerRuntimeServer.ts'),
        yamlWebWorkerRuntimeServer: path.join(__dirname, 'src/yamlWebWorkerRuntimeServer.ts'),
    },
    target: 'webworker',
    devServer: {
        host: '127.0.0.1',
        webSocketServer: 'ws',
        port: 5001,
        allowedHosts: 'all',
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        static: '../build/bundle',
        client: isDevelopment
            ? {
                  overlay: {
                      warnings: false,
                  },
              }
            : false,
        liveReload: isDevelopment,
        hot: isDevelopment,
        devMiddleware: {
            writeToDisk: true,
        },
    },
}

module.exports = [webConfig]
