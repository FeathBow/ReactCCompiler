const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
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
