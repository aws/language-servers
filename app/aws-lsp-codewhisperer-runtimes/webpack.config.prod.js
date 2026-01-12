const path = require('node:path')

// This script is used to produce the distributable webpacked version of the agentic chat server.

const baseConfig = {
    mode: 'production',
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

const serverConfig = config => {
    return {
        ...baseConfig,
        output: {
            ...baseConfig.output,
            path: path.resolve(__dirname, 'build', 'private', 'bundle', config),
            filename: `[name].js`,
            chunkFormat: false,
        },
        entry: {
            'aws-lsp-codewhisperer': `./src/${config}.ts`,
        },
    }
}

module.exports = [serverConfig('agent-standalone')]
