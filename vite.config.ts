import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {build, defineConfig, type Plugin} from 'vite';

function createSingleFilePlugin(): Plugin {
  return {
    name: 'aluminero-singlefile',
    apply: 'build',
    enforce: 'post',
    config() {
      return {
        build: {
          assetsInlineLimit: 100_000_000,
          cssCodeSplit: false,
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },
      };
    },
    generateBundle(_opts, bundle) {
      const htmlKey = Object.keys(bundle).find((k) => k.endsWith('.html'));
      if (!htmlKey) return;
      const htmlAsset = bundle[htmlKey];
      if (!htmlAsset || htmlAsset.type !== 'asset') return;

      let html = String(htmlAsset.source);

      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'asset' && fileName.endsWith('.css')) {
          const css = String(item.source).replace(/<\/style/gi, '<\\/style');
          const linkRe = new RegExp(`<link[^>]+href=["'][^"']*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
          if (linkRe.test(html)) {
            html = html.replace(linkRe, () => `<style>${css}</style>`);
          } else {
            html = html.replace('</head>', () => `<style>${css}</style></head>`);
          }
          delete bundle[fileName];
        }
      }

      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'chunk' && item.isEntry) {
          const js = item.code.replace(/<\/script/gi, '<\\/script');
          const scriptRe = new RegExp(`<script[^>]+src=["'][^"']*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*><\\/script>`, 'i');
          if (scriptRe.test(html)) {
            html = html.replace(scriptRe, () => `<script type="module">${js}</script>`);
          } else {
            html = html.replace('</body>', () => `<script type="module">${js}</script></body>`);
          }
          delete bundle[fileName];
        }
      }

      htmlAsset.source = html;
    },
  };
}

function createStandaloneDevEndpoint(): Plugin {
  let cachedHtml = '';
  let buildingPromise: Promise<string> | null = null;

  return {
    name: 'aluminero-standalone-dev-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__aluminero_single.html', async (_req, res, next) => {
        try {
          if (!cachedHtml) {
            if (!buildingPromise) {
              buildingPromise = (async () => {
                const outDir = path.resolve(__dirname, '.singlefile-cache');
                await build({
                  configFile: false,
                  root: __dirname,
                  mode: 'production',
                  logLevel: 'silent',
                  plugins: [react(), tailwindcss(), createSingleFilePlugin()],
                  resolve: {
                    alias: {
                      '@': path.resolve(__dirname, '.'),
                    },
                  },
                  build: {
                    outDir,
                    emptyOutDir: true,
                    write: true,
                  },
                });
                const builtFile = path.join(outDir, 'index.html');
                return fs.readFileSync(builtFile, 'utf-8');
              })();
            }
            cachedHtml = await buildingPromise;
            buildingPromise = null;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-Aluminero-Single', '1');
          res.setHeader('Cache-Control', 'no-store');
          res.end(cachedHtml);
        } catch (err) {
          buildingPromise = null;
          next(err);
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      createSingleFilePlugin(),
      createStandaloneDevEndpoint(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
