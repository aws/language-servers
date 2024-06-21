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
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [/node_modules/],
            },
        ],
    },
}

const nodeJsBundleConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-partiql-binary': path.join(__dirname, 'src/index.ts'),
    },
    target: 'node',
}

module.exports = [nodeJsBundleConfig]
