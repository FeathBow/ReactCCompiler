/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    devtool: false,
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.BannerPlugin({
            raw: true,
            banner: '/* @preserve */',
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'server', // static | disabled | server
            analyzerHost: '127.0.0.1', // host of analyzer in server mode
            analyzerPort: 8888, // port of analyzer in server mode
        }),
    ],
});
/* eslint-enable unicorn/prefer-module */
/* eslint-enable @typescript-eslint/no-var-requires */
/* eslint-enable @typescript-eslint/no-unsafe-call */
