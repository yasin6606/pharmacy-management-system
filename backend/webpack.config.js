// webpack.config.js — Node target; keep node_modules external to avoid TypeORM critical-dependency noise
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'production',
    target: 'node',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'server.js',
        clean: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    // Externalize node_modules so TypeORM/pg dynamic requires resolve at runtime
    externals: [nodeExternals()],
    devtool: false,
};
