var path = require('path')

const baseConfig = {
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
        globalObject: 'this',
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

const nodeConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-antlr4-standalone-with-customization': path.join(__dirname, 'src/serverWithCustomization.ts'),
        'aws-lsp-antlr4-standalone': path.join(__dirname, 'src/serverWithoutCustomization.ts'),
    },
    target: 'node',
}

module.exports = [nodeConfig]
