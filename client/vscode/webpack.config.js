const path = require('path')

const isDevelopment = true

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'inline-source-map' : undefined,
    entry: './src/amazonq/ui/index.ts',
    target: 'web',
    output: {
        filename: 'amazonq-chat-client.js',
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
