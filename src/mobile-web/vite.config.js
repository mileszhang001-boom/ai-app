import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

function serveWidgetTemplates() {
  const templatesRoot = path.resolve(__dirname, '../widget-templates');
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };

  return {
    name: 'serve-widget-templates',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/widget-templates/')) return next();

        const relPath = decodeURIComponent(req.url.replace('/widget-templates/', '').split('?')[0]);
        const filePath = path.join(templatesRoot, relPath);
        const resolved = path.resolve(filePath);

        if (!resolved.startsWith(templatesRoot)) return next();

        if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
          const ext = path.extname(resolved);
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          fs.createReadStream(resolved).pipe(res);
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [serveWidgetTemplates()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.loca.lt', '.serveo.net', '.serveousercontent.com', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/shared': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
