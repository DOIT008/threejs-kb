import fs from 'node:fs';
import path from 'node:path';

const docs = 'docs';
const groups = fs.readdirSync(docs)
  // public 是 VitePress 的静态资源目录，不是文档分组，必须排除
  .filter(d => fs.statSync(path.join(docs, d)).isDirectory() && d !== '.vitepress' && d !== 'public')
  .sort();

let sidebar = '[\n';
for (const g of groups) {
  const label = g.replace(/^\d+-/, '');
  const files = fs.readdirSync(path.join(docs, g)).filter(f => f.endsWith('.md')).sort();
  sidebar += `  {\n    text: ${JSON.stringify(label)},\n    collapsed: false,\n    items: [\n`;
  for (const f of files) {
    const name = f.replace(/\.md$/, '');
    sidebar += `      { text: ${JSON.stringify(name)}, link: ${JSON.stringify('/' + g + '/' + name)} },\n`;
  }
  sidebar += '    ]\n  },\n';
}
sidebar += ']\n';

const config = `import { defineConfig } from 'vitepress'

// 部署到 GitHub Pages 项目站点时，Actions 会注入仓库名作为 base（如 /threejs-kb/）
// 本地预览不设环境变量，默认根路径 /
// 注意：Windows 的 Git Bash 会把 /xxx/ 误转成盘符路径，这里做一次规范化兜底
const rawBase = process.env.VITE_BASE_PATH || '/'
const base = rawBase.startsWith('/') ? rawBase : ('/' + String(rawBase).replace(/^.*[\\\/]([^\\\/]+)[\\\/]?$/, '$1') + '/')

export default defineConfig({
  base,
  title: 'Three.js 知识库',
  description: '通俗易懂的 Three.js 学习手册 · 基于 r187',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  // 浏览器标签页 favicon（base 拼在前面，GitHub Pages 项目站点才找得到）
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: \`\${base}logo.svg\` }]
  ],

  // 提示块中文化；「大白话时间」由 CSS 按标题染成 Vue 绿
  markdown: {
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '警告',
      infoLabel: '信息',
      detailsLabel: '详情'
    },
    lineNumbers: true
  },

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '学习路径', link: '/00-学习路径/01 · 7 天学习路线图' },
      { text: '入门教程', link: '/01-基础入门/01 · Three.js 是个啥' },
      { text: 'API 手册', link: '/06-API速查手册/API 01 · 全局约定与常量' },
      { text: '交互实验室', link: '/11-交互实验室/01 · 交互演示总览' },
      { text: '数字孪生', link: '/10-数字孪生与数字工厂/01 · 数字孪生是什么' },
      { text: '生产实战', link: '/09-生产级专题/01 · 内存管理与泄漏排查' }
    ],

    sidebar: ${sidebar.trim()},

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdatedText: '最后更新于',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: { provider: 'local', options: { translations: { button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' }, modal: { noResultsText: '没有找到结果', displayNoResults: '没有找到结果', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭', upText: '上', downText: '下' } } } } },

    socialLinks: [{ icon: 'github', link: 'https://github.com/mrdoob/three.js' }]
  }
})
`;

fs.mkdirSync(path.join(docs, '.vitepress'), { recursive: true });
fs.writeFileSync(path.join(docs, '.vitepress', 'config.mts'), config, 'utf8');
console.log('config.mts 已生成，分组数:', groups.length);
