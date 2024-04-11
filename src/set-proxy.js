const proxySettings = [
    {
        context: '/api/',
        target: 'http://198.168.111.111:3001',
        changeOrigin: true,
    },
    {
        context: '/api-2/',
        target: 'http://198.168.111.111:3002',
        changeOrigin: true,
        pathRewrite: {
            '^/api-2': '',
        },
    },
    // .....
];

// eslint-disable-next-line unicorn/prefer-module
module.exports = proxySettings;
