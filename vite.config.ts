import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {build, defineConfig, type Plugin} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
              codeSplitting: false,
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
      // /_aistudio-iframe.js no existe en Cloudflare: el _redirects devolvía el index.html completo como JS.
      html = html.replace(/<script[^>]*_aistudio-iframe\.js[^>]*><\/script>\s*/gi, '');

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
          // Elimina la referencia externa del <head> e inserta el módulo al final de <body>
          // para garantizar que #root ya exista en el DOM en cualquier navegador o hosting (Cloudflare Pages).
          if (scriptRe.test(html)) {
            html = html.replace(scriptRe, () => '');
          }
          if (/<\/body>/i.test(html)) {
            html = html.replace(/<\/body>/i, () => `<script type="module">${js}</script>\n  </body>`);
          } else {
            html += `<script type="module">${js}</script>`;
          }
          delete bundle[fileName];
        }
      }

      htmlAsset.source = html;
    },
  };
}

function createStandaloneDevEndpoint(): Plugin {
  let buildingPromise: Promise<string> | null = null;

  return {
    name: 'aluminero-standalone-dev-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__aluminero_single.html', async (_req, res, next) => {
        try {
          if (!buildingPromise) {
            buildingPromise = (async () => {
              const outDir = path.resolve(__dirname, '.singlefile-cache');
              // El servidor de desarrollo corre con NODE_ENV=development; sin esto el archivo único
              // se compilaba con React en modo desarrollo (jsxDEV, ~3.3 MB y más lento).
              const prevNodeEnv = process.env.NODE_ENV;
              process.env.NODE_ENV = 'production';
              try {
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
              } finally {
                if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
                else process.env.NODE_ENV = prevNodeEnv;
              }
              const builtFile = path.join(outDir, 'index.html');
              return fs.readFileSync(builtFile, 'utf-8');
            })();
          }
          const builtHtml = await buildingPromise;
          buildingPromise = null;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-Aluminero-Single', '1');
          res.setHeader('Cache-Control', 'no-store');
          res.end(builtHtml);
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
      ...(process.env.SINGLE_FILE === '0' ? [] : [createSingleFilePlugin()]),
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
