const path = require('path')

const isDevelopment = true

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'inline-source-map' : undefined,
    entry: './src/index.ts',
    output: {
        filename: 'amazonq-ui.js',
        path: path.resolve(__dirname, 'build'),
        library: 'amazonQChat',
    },
    resolve: {
        extensions: ['.ts', '.js'],
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
