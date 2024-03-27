const { SERVER_HOST, SERVER_PORT } = require('../constant');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const proxySetting = require('../../src/set-proxy.js');
module.exports = merge(common, {
    mode: 'development',
    stats: 'errors-only',
    devtool: 'eval-source-map',
    devServer: {
        host: SERVER_HOST, // localhost if not specified
        port: SERVER_PORT, // 8080 if not specified
        client: {
            logging: 'info', // level of messages log to the console
        },
        compress: true, // enable gzip compression
        open: true, // open the default browser
        hot: true, // enable hot module replacement
        proxy: proxySetting,
    },
    plugins: [new webpack.HotModuleReplacementPlugin()],
});
