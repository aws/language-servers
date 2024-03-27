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
            stream: require.resolve('stream-browserify'),
            os: require.resolve('os-browserify/browser'),
            path: require.resolve('path-browserify'),
            assert: require.resolve('assert'),
            fs: false,
            crypto: require.resolve('crypto-browserify'),
            'fs-extra': false,
            perf_hooks: false, // should be using globalThis.performance instead

            // *** If one of these modules actually gets used an error will be raised ***
            // You may see something like: "TypeError: path_ignored_0.join is not a function"

            // We don't need these yet, but as we start enabling functionality in the web
            // we may need to polyfill.
            http: false, // http: require.resolve('stream-http'),
            https: false, // https: require.resolve('https-browserify'),
            zlib: false, // zlib: require.resolve('browserify-zlib'),
            constants: false, //constants: require.resolve('constants-browserify'),
            // These do not have a straight forward replacement
            child_process: false, // Reason for error: 'TypeError: The "original" argument must be of type Function'
            async_hooks: false,
        },
        // fallback: {
        //   'path': require.resolve('path-browserify') ,
        //   "process/browser": require.resolve("process/browser") },
        // alias: {
        //   path: 'path-browserify',
        // },
    },
    node: {
        global: true,
        __filename: true,
        __dirname: true,
    },
    plugins: [
        // new webpack.ProvidePlugin({
        //   Buffer: ['buffer', 'Buffer'],
        // }),
        // new webpack.DefinePlugin({
        //   global: "window" // Placeholder for global used in any node_modules
        // }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1, // disable chunks by default since web extensions must be a single bundle
        }),
        // some modules are provided globally and dont require an explicit import,
        // so we need to polyfill them using this method
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
        yamlJsonWebWorkerRuntimeServer: path.join(__dirname, 'src/yamlJsonWebWorkerRuntimeServer.ts'),
    },
    target: 'web',
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
