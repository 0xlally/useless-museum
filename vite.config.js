import { defineConfig } from 'vite';

// The API only accepts same-origin browser writes. In development the page is served
// from 5173 and proxies to 8787, so normalize the Origin before the proxy forwards it.
const apiTarget = 'http://127.0.0.1:8787';
function devApiOrigin() {
  return {
    name: 'dev-api-origin',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/api') || req.url?.startsWith('/models')) req.headers.origin = apiTarget;
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [devApiOrigin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: { ignored: ['**/.*.tmpdir/**'] },
    proxy: { '/api': apiTarget, '/models': apiTarget },
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
  },
});
