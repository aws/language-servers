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

const completionsWithDeviceSsoConfig = {
    ...baseConfig,
    experiments: {
        asyncWebAssembly: true,
    },
    entry: {
        'amazon-q-completions-and-sso': path.join(__dirname, 'src/completions-with-device-sso.ts'),
    },
    resolve: {
        ...baseConfig.resolve,
    },
    target: 'node',
}

module.exports = [completionsWithDeviceSsoConfig]
