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
            {
                test: /node_modules[\\|/](vscode-json-languageservice)/,
                use: { loader: 'umd-compat-loader' },
            },
        ],
    },
}

const nodeConfig = {
    ...baseConfig,
    entry: {
        'aws-lsp-yaml-standalone-with-customization': path.join(__dirname, 'src/serverWithCustomization.ts'),
        'aws-lsp-yaml-standalone': path.join(__dirname, 'src/serverWithoutCustomization.ts'),
    },
    target: 'node',
}

module.exports = [nodeConfig]
