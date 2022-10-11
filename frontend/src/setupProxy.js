// This file runs in Node.js, not the client!
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use('/api', createProxyMiddleware({
        target: 'http://localhost:4080/',
        changeOrigin: true,
        // Unfortunately, websocket proxying doesn't work,
        // so we'll fall back on socket.io's long polling
        ws: false,
    }));
}
