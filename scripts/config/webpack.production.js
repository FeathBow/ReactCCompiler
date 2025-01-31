/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const path = require('node:path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    devtool: false,
    output: {
        publicPath: '/ReactCCompiler/',
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.BannerPlugin({
            raw: true,
            banner: '/* @preserve */',
        }),
    ],
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /[/\\]node_modules[/\\]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
});

/* eslint-enable @typescript-eslint/no-var-requires */
/* eslint-enable unicorn/prefer-module */
/* eslint-enable @typescript-eslint/no-unsafe-call */
