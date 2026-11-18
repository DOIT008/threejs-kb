import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 轻量静态服务器：托管 vitepress build 出的 dist/
 * 关键：VitePress 用 cleanUrls，导航链接形如 /00-学习路径/01 · 7 天学习路线图（不带 .html）
 * 这里把这类路径补上 .html 找到真实文件；找不到再尝试 /路径/index.html；最后回退 404.html。
 */
const ROOT = path.resolve('docs/.vitepress/dist');
const PORT = Number(process.env.PORT || 5182);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function send(res, file, status = 200) {
  const ext = path.extname(file).toLowerCase();
  res.writeHead(status, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { urlPath = new URL(req.url, 'http://x').pathname; }

  if (urlPath === '/') urlPath = '/index.html';

  // 归一化，防目录穿越
  const rel = urlPath.replace(/^\/+/, '');
  let file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT)) { send(res, path.join(ROOT, '404.html'), 404); return; }

  // 1) 直接命中文件
  if (fs.existsSync(file) && fs.statSync(file).isFile()) { send(res, file); return; }

  // 2) cleanUrls：补 .html（无条件尝试——文件名里可能含 .js/.Pass 等被误判成扩展名）
  if (fs.existsSync(file + '.html')) { send(res, file + '.html'); return; }

  // 3) 目录 index
  const idx = path.join(file, 'index.html');
  if (fs.existsSync(idx)) { send(res, idx); return; }

  // 4) 回退 404 页
  send(res, path.join(ROOT, '404.html'), 404);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`dist 静态服务器: http://127.0.0.1:${PORT}/`);
});
