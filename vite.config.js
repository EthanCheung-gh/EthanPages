import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * base 说明
 * - 本地 dev / 预览: '/'
 * - GitHub Pages 项目站点: '/<repo>/'  → CI 里用 VITE_BASE 注入
 * - 用户站点 (<user>.github.io) 或自定义域名: '/'
 */
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  build: { target: 'es2020', assetsInlineLimit: 0 },
  plugins: [
    {
      // GitHub Pages 对未知路径返回 404.html，这里生成一个把深链接转交给 SPA 的页面
      name: 'spa-404-fallback',
      closeBundle() {
        const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ethan</title><meta name="robots" content="noindex">
<script>
(function(){
  var base = ${JSON.stringify(base)};
  var path = location.pathname;
  var rel = path.indexOf(base) === 0 ? path.slice(base.length - 1) : path;
  try { sessionStorage.setItem('ethan-spa-route', rel + location.search + location.hash); } catch (e) {}
  location.replace(base + 'index.html');
})();
</script></head><body></body></html>`;
        const out = path.resolve(__dirname, 'dist/404.html');
        fs.writeFileSync(out, html, 'utf8');
        console.log(`✓ 404.html generated (base: ${base})`);
      },
    },
  ],
});
