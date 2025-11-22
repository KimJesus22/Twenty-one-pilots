const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  console.log('🔧 SetupProxy loaded! Configuring proxy for /api -> http://127.0.0.1:5000');
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.path} -> http://127.0.0.1:5000${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
      }
    })
  );
};