/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('node:path');
const resolve = path.resolve.bind(path);
const { isDev, PROJECT_PATH } = require('../constant');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackBar = require('webpackbar');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const getCssLoaders = (importLoaders) => [
    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
    {
        loader: 'css-loader',
        options: {
            modules: false,
            sourceMap: isDev,
            importLoaders,
        },
    },
    {
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                ident: 'postcss',
                plugins: [
                    require('postcss-flexbugs-fixes'),
                    require('postcss-preset-env')({
                        autoprefixer: {
                            grid: true,
                            flexbox: 'no-2009',
                        },
                        stage: 3,
                    }),
                    require('postcss-normalize'),
                ],
            },
            sourceMap: isDev,
        },
    },
];

module.exports = {
    optimization: {
        splitChunks: {
            chunks: 'all',
            name: false,
        },
        minimize: !isDev,
        minimizer: [
            !isDev &&
                new TerserPlugin({
                    extractComments: false,
                    terserOptions: {
                        compress: { pure_funcs: ['console.log'] },
                    },
                }),
            !isDev && new CssMinimizerPlugin(),
        ].filter(Boolean),
    },
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename],
        },
    },
    entry: {
        // app: resolve(PROJECT_PATH, './src/app.js'),
        // app: resolve(PROJECT_PATH, './src/index.js'),
        app: resolve(PROJECT_PATH, './src/index.tsx'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
            Src: resolve(PROJECT_PATH, './src'),
            Components: resolve(PROJECT_PATH, './src/components'),
            Utils: resolve(PROJECT_PATH, './src/utils'),
        },
    },

    output: {
        filename: `js/[name]${isDev ? '' : '.[hash:8]'}.js`,
        path: resolve(PROJECT_PATH, './dist'),
        assetModuleFilename: 'images/[name].[contenthash:8].[ext]',
    },
    plugins: [
        !isDev &&
            new MiniCssExtractPlugin({
                filename: 'css/[name].[contenthash:8].css',
                chunkFilename: 'css/[name].[contenthash:8].css',
                ignoreOrder: false,
            }),

        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: resolve(PROJECT_PATH, './tsconfig.json'),
            },
        }),

        new WebpackBar({
            name: isDev ? 'running' : 'building',
            color: '#fa8c16',
        }),
        new CopyPlugin({
            patterns: [
                {
                    context: resolve(PROJECT_PATH, './public'),
                    from: '*',
                    to: resolve(PROJECT_PATH, './dist'),
                    toType: 'dir',
                    globOptions: {
                        dot: true,
                        gitignore: true,
                        ignore: ['**/index.html'],
                    },
                },
            ],
        }),

        new HtmlWebpackPlugin({
            template: resolve(PROJECT_PATH, './public/index.html'),
            filename: 'index.html',
            cache: false,
            minify: isDev
                ? false
                : {
                      removeAttributeQuotes: true,
                      collapseWhitespace: true,
                      removeComments: true,
                      collapseBooleanAttributes: true,
                      collapseInlineTagWhitespace: true,
                      removeRedundantAttributes: true,
                      removeScriptTypeAttributes: true,
                      removeStyleLinkTypeAttributes: true,
                      minifyCSS: true,
                      minifyJS: true,
                      minifyURLs: true,
                      useShortDoctype: true,
                  },
        }),
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: getCssLoaders(1),
            },
            {
                test: /\.less$/,
                use: [
                    ...getCssLoaders(2),
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: isDev,
                        },
                    },
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    ...getCssLoaders(2),
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: isDev,
                        },
                    },
                ],
            },
            {
                test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024,
                    },
                },
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2?)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(tsx?|js)$/,
                loader: 'babel-loader',
                options: { cacheDirectory: true },
                exclude: /node_modules/,
            },
        ],
    },
    externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
    },
};
/* eslint-enable unicorn/prefer-module */
/* eslint-enable @typescript-eslint/no-var-requires */
