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
                exclude: /node_modules/,
                use: {
                    loader: 'builtin:swc-loader',
                    options: {
                        sourceMap: true,
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                            },
                        },
                    },
                },
                type: 'javascript/auto',
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
