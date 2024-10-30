/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const common = require('./webpack.common.js');

// 引入 path 模块
const path = require('path');

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
});
