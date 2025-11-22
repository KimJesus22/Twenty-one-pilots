const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  console.log('[SetupProxy] Loading proxy configuration for /api -> http://127.0.0.1:5000');

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy Request]', req.method, req.path, '->', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err.message);
      }
    })
  );

  console.log('[SetupProxy] Proxy middleware registered successfully');
};