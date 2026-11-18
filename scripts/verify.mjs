import fs from 'node:fs';
import path from 'node:path';

/**
 * 全量 Markdown 校验：
 * 1) ::: 容器成对闭合
 * 2) ``` 代码块成对闭合（且带语言标注）
 * 3) Vue 组件标签拼写正确
 * 4) 标题层级从 ## 起（无 frontmatter 的正文页）
 * 5) 残留转义 <\/script> 检查（独立 md 不应有）
 */
const ROOT = 'docs';
const KNOWN_COMPONENTS = [
  'MaterialLab', 'GeometryGallery', 'TransformLab', 'CodePlayground',
  'LightLab', 'CameraLab', 'RaycastLab', 'EasingLab', 'ParticleLab', 'BloomLab',
];

let totalFiles = 0, totalErrors = 0, totalWarnings = 0;
const fileList = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.vitepress' || e.name === 'node_modules' || e.name === 'dist') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) fileList.push(p);
  }
}
walk(ROOT);

for (const f of fileList) {
  totalFiles++;
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  const errs = [];
  const warns = [];

  // 容器闭合
  const fences = lines.filter(l => /^:::\s*\w+/.test(l) || /^:::\s*$/.test(l));
  if (fences.length % 2 !== 0) errs.push(`::: 容器未成对（${fences.length} 个标记）`);

  // 代码块闭合 + 语言标注
  const ticks = lines.filter(l => /^```/.test(l));
  if (ticks.length % 2 !== 0) errs.push(`\`\`\` 代码块未闭合（${ticks.length} 个）`);
  const openers = ticks.filter((_, i) => i % 2 === 0);
  openers.forEach(o => { if (/^```\s*$/.test(o)) warns.push('有代码块未标注语言'); });

  // 组件标签：只认「代码块之外、独占一行」的嵌入标签
  let inCode = false;
  const compTags = [];
  for (const l of lines) {
    if (/^```/.test(l)) { inCode = !inCode; continue; }
    if (inCode) continue;
    const mm = l.match(/^\s*<([A-Z][A-Za-z]+)\s*\/?>\s*$/);
    if (mm) compTags.push(mm[1]);
  }
  compTags.forEach(name => {
    if (!KNOWN_COMPONENTS.includes(name)) errs.push(`未知组件标签 ${name}`);
  });

  // 残留转义
  if (src.includes('<\\/script>')) warns.push('残留 <\\/script> 转义（独立 md 不需要）');

  // 正文页标题层级（跳过首页/frontmatter 页/README）
  if (!src.startsWith('---') && !f.endsWith('README.md') && !f.endsWith('index.md')) {
    if (!/^##\s/m.test(src) && !/^#\s/m.test(src)) warns.push('没有二级或一级标题');
  }

  if (errs.length || warns.length) {
    console.log(`\n【${f}】`);
    errs.forEach(e => console.log('  ✗', e));
    warns.forEach(w => console.log('  ⚠', w));
  }
  totalErrors += errs.length;
  totalWarnings += warns.length;
}

console.log(`\n===== 汇总 =====`);
console.log(`Markdown 文件: ${totalFiles}`);
console.log(`错误: ${totalErrors}`);
console.log(`警告: ${totalWarnings}`);
process.exitCode = totalErrors > 0 ? 1 : 0;
