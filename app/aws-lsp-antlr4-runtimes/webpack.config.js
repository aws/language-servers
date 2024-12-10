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

const nodeConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-antlr4-standalone-with-customization': path.join(__dirname, 'src/serverWithCustomization.ts'),
        'aws-lsp-antlr4-standalone': path.join(__dirname, 'src/serverWithoutCustomization.ts'),
    },
    target: 'node',
}

module.exports = [nodeConfig]
