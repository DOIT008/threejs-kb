import fs from 'node:fs';
import path from 'node:path';

/**
 * 扫描 docs/ 实际文件，生成 docs/README.md 总索引
 * （链接用 /路由，尖括号包裹含空格路径）
 */
const ROOT = 'docs';

function collect(dir) {
  const groups = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort()) {
    if (e.name.startsWith('.') || e.name === 'public') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const files = fs.readdirSync(p).filter(f => f.endsWith('.md')).sort();
      if (files.length) groups.push({ dir: e.name, files });
    }
  }
  return groups;
}

const groups = collect(ROOT);
const total = groups.reduce((s, g) => s + g.files.length, 0);

// VitePress 版索引
let vp = '# Three.js 知识库\n\n';
vp += `> 通俗易懂的 Three.js 学习手册，基于 r187（three@0.187.0）。共 ${total} 篇，每个概念都配「大白话」解释与可运行代码。\n\n`;
vp += '> 完整体验请在项目根目录运行 `npm run docs:dev`（Vue 官网同款样式 + 交互 3D 演示）。\n\n## 目录\n\n';
for (const g of groups) {
  vp += `### ${g.dir.replace(/^\d+-/, '')}\n\n`;
  for (const f of g.files) {
    const name = f.replace(/\.md$/, '');
    vp += `- [${name}](</${g.dir}/${name}>)\n`;
  }
  vp += '\n';
}
fs.writeFileSync(path.join(ROOT, 'README.md'), vp, 'utf8');

console.log(`索引生成完成：${groups.length} 个分组，${total} 篇文档`);
