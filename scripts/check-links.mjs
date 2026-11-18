import fs from 'node:fs';
import path from 'node:path';

/** 检查 md 内部链接是否指向存在的页面（VitePress cleanUrls：/目录/文件名 不带 .md） */
const ROOT = 'docs';

// 建立「路由路径 -> 是否存在」映射
const validRoutes = new Set(['/']);
const fileList = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.vitepress' || e.name === 'node_modules' || e.name === 'dist') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) {
      fileList.push(p);
      const rel = path.relative(ROOT, p).replace(/\\/g, '/').replace(/\.md$/, '');
      validRoutes.add('/' + rel);
      // README 也算一个路由
    }
  }
}
walk(ROOT);

let bad = 0;
for (const f of fileList) {
  const src = fs.readFileSync(f, 'utf8');
  // 匹配 [text](<path>) 和 [text](path)，只取站内 / 开头
  const re = /\]\((?:<(\/[^>]+)>|(\/[^)\s]+))\)/g;
  let m;
  while ((m = re.exec(src))) {
    const raw = (m[1] || m[2]).split('#')[0].replace(/\.md$/, '');
    if (!raw) continue;
    if (!validRoutes.has(raw)) {
      console.log(`✗ ${f}\n    -> ${raw}`);
      bad++;
    }
  }
}
console.log(`\n内部链接检查：${bad} 个死链（有效路由 ${validRoutes.size} 个）`);
process.exitCode = bad > 0 ? 1 : 0;
