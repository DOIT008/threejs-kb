import { defineConfig } from 'vitepress'

// 部署到 GitHub Pages 项目站点时，Actions 会注入仓库名作为 base（如 /threejs-kb/）
// 本地预览不设环境变量，默认根路径 /
// 注意：Windows 的 Git Bash 会把 /xxx/ 误转成盘符路径，这里做一次规范化兜底
const rawBase = process.env.VITE_BASE_PATH || '/'
const base = rawBase.startsWith('/') ? rawBase : ('/' + String(rawBase).replace(/^.*[\/]([^\/]+)[\/]?$/, '$1') + '/')

export default defineConfig({
  base,
  title: 'Three.js 知识库',
  description: '通俗易懂的 Three.js 学习手册 · 基于 r187',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  // 浏览器标签页 favicon + 主题色防闪烁（渲染前应用保存的主题）
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['script', {}, 'try{var t=localStorage.getItem("kb-theme");if(t&&t!=="green")document.documentElement.setAttribute("data-theme",t)}catch(e){}'],
    ['script', {}, "/* 前端访问密码门（静态站点，仅阻挡普通访客，非服务端鉴权）。\n   逻辑：SHA-256 校验，未通过时全屏遮罩 + 隐藏正文；通过后本次会话放行。 */\n(function () {\n  var SESSION_KEY = 'kb_access_ok';\n  var HASH = 'de853f506e40e09bbe662e3801dac9b44272366354436a460701c5e14b694fcc';\n\n  var K = [\n    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,\n    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,\n    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,\n    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,\n    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,\n    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,\n    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,\n    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2\n  ];\n  function rr(x, n) { return (x >>> n) | (x << (32 - n)); }\n  function sha256(msg) {\n    var words = [], len = msg.length, i;\n    for (i = 0; i < len; i++) { words[i >> 2] |= (msg.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8); }\n    words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);\n    var bitLen = len * 8;\n    var paddedWords = ((((len + 8) >> 6) + 1) << 4);\n    words[paddedWords - 2] = Math.floor(bitLen / 4294967296);\n    words[paddedWords - 1] = bitLen | 0;\n    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];\n    var w = new Array(64);\n    for (var off = 0; off < words.length; off += 16) {\n      for (i = 0; i < 16; i++) { w[i] = words[off + i] || 0; }\n      for (i = 16; i < 64; i++) {\n        var x = w[i - 15], y = w[i - 2];\n        var s0 = rr(x, 7) ^ rr(x, 18) ^ (x >>> 3);\n        var s1 = rr(y, 17) ^ rr(y, 19) ^ (y >>> 10);\n        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;\n      }\n      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];\n      for (i = 0; i < 64; i++) {\n        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);\n        var ch = (e & f) ^ ((~e) & g);\n        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;\n        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);\n        var maj = (a & b) ^ (a & c) ^ (b & c);\n        var t2 = (S0 + maj) | 0;\n        h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;\n      }\n      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;\n      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;\n    }\n    var out = '';\n    for (i = 0; i < 8; i++) { out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8); }\n    return out;\n  }\n\n  var GATE_CSS = [\n    'html.kb-locked #app{visibility:hidden!important}',\n    '#kb-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;overflow:hidden;',\n      'background:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px) 0 0/28px 28px,',\n      'linear-gradient(120deg,#15172c 0%,#1c1f38 48%,#121428 100%);',\n      '-webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%);',\n      'font-family:var(--vp-font-family-base,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif);',\n      'animation:kb-gate-fade .35s ease both}',\n    '#kb-gate::before,#kb-gate::after{content:\"\";position:absolute;border-radius:50%;pointer-events:none;filter:blur(24px)}',\n    '#kb-gate::before{top:-18%;left:-8%;width:56vw;height:56vw;',\n      'background:radial-gradient(circle,var(--vp-c-brand-1,#42b883) 0%,transparent 66%);opacity:.32}',\n    '#kb-gate::after{bottom:-28%;right:-8%;width:54vw;height:54vw;',\n      'background:radial-gradient(circle,#5b6ef5 0%,transparent 66%);opacity:.30}',\n    '@keyframes kb-gate-fade{from{opacity:0}to{opacity:1}}',\n    '.kb-gate-card{position:relative;z-index:1;width:min(92vw,420px);padding:44px 40px 34px;border-radius:24px;overflow:hidden;text-align:center;',\n      'background:var(--vp-c-bg,#fff);',\n      'background:color-mix(in srgb,var(--vp-c-bg,#fff) 82%,transparent);',\n      'border:1px solid color-mix(in srgb,var(--vp-c-bg,#fff) 55%,transparent);',\n      '-webkit-backdrop-filter:blur(26px) saturate(180%);backdrop-filter:blur(26px) saturate(180%);',\n      'box-shadow:0 30px 90px -24px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.06);',\n      'animation:kb-gate-rise .5s cubic-bezier(.16,1,.3,1) both}',\n    '@keyframes kb-gate-rise{from{opacity:0;transform:translateY(26px) scale(.96)}to{opacity:1;transform:none}}',\n    '.kb-gate-icon{width:70px;height:70px;margin:0 auto 22px;border-radius:22px;display:flex;align-items:center;justify-content:center;',\n      'background:linear-gradient(135deg,var(--vp-c-brand-2),var(--vp-c-brand-3));',\n      'box-shadow:0 12px 26px -10px var(--vp-c-brand-1)}',\n    '.kb-gate-icon svg{width:32px;height:32px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',\n    '.kb-gate-title{margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-.01em;color:var(--vp-c-text-1,#1f2937)}',\n    '.kb-gate-desc{margin:0 0 26px;font-size:13px;line-height:1.6;color:var(--vp-c-text-2,#6b7280)}',\n    '.kb-gate-field{position:relative;margin-bottom:6px}',\n    '.kb-gate-field>svg{position:absolute;left:15px;top:50%;transform:translateY(-50%);width:18px;height:18px;',\n      'fill:none;stroke:var(--vp-c-text-3,#9ca3af);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}',\n    '.kb-gate-input{width:100%;box-sizing:border-box;padding:14px 16px 14px 45px;border-radius:12px;',\n      'border:1.5px solid var(--vp-c-divider,#d1d5db);background:var(--vp-c-bg-soft,#f9fafb);',\n      'color:var(--vp-c-text-1,#1f2937);font-size:15px;outline:none;transition:border-color .2s,box-shadow .2s}',\n    '.kb-gate-input::placeholder{color:var(--vp-c-text-3,#9ca3af)}',\n    '.kb-gate-input:focus{border-color:var(--vp-c-brand-1);box-shadow:0 0 0 4px var(--vp-c-brand-soft)}',\n    '.kb-gate-msg{min-height:18px;margin:8px 0 14px;font-size:12.5px;color:#ef4444;text-align:left;display:flex;align-items:center;gap:6px}',\n    '.kb-gate-btn{width:100%;padding:14px;border:0;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;',\n      'background:linear-gradient(135deg,var(--vp-c-brand-1),var(--vp-c-brand-3));color:#fff;font-size:15px;font-weight:600;cursor:pointer;',\n      'box-shadow:0 10px 22px -10px var(--vp-c-brand-1);transition:transform .2s,box-shadow .2s}',\n    '.kb-gate-btn:hover{transform:translateY(-2px);box-shadow:0 14px 28px -10px var(--vp-c-brand-1)}',\n    '.kb-gate-btn:active{transform:translateY(0)}',\n    '.kb-gate-btn svg{width:17px;height:17px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',\n    '.kb-gate-foot{margin-top:22px;font-size:11px;color:var(--vp-c-text-3,#9ca3af)}'\n  ].join('');\n\n  function unlock() {\n    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}\n    var box = document.getElementById('kb-gate');\n    if (box && box.parentNode) box.parentNode.removeChild(box);\n    document.documentElement.classList.remove('kb-locked');\n    document.documentElement.style.overflow = '';\n    if (document.body) document.body.style.overflow = '';\n  }\n\n  function showGate() {\n    if (document.getElementById('kb-gate')) return;\n    var style = document.createElement('style');\n    style.id = 'kb-gate-style';\n    style.textContent = GATE_CSS;\n    document.head.appendChild(style);\n    document.documentElement.classList.add('kb-locked');\n    document.documentElement.style.overflow = 'hidden';\n    if (document.body) document.body.style.overflow = 'hidden';\n\n    var box = document.createElement('div');\n    box.id = 'kb-gate';\n    box.innerHTML =\n      '<div class=\"kb-gate-card\">' +\n        '<div class=\"kb-gate-icon\">' +\n          '<svg viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"10\" width=\"16\" height=\"11\" rx=\"2.5\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"/></svg>' +\n        '</div>' +\n        '<h3 class=\"kb-gate-title\">知识库需要密码</h3>' +\n        '<p class=\"kb-gate-desc\">请输入访问密码后继续阅读</p>' +\n        '<div class=\"kb-gate-field\">' +\n          '<svg viewBox=\"0 0 24 24\"><circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M11 12l8-8m-3 3l2 2m-5-1l2 2\"/></svg>' +\n          '<input id=\"kb-gate-pwd\" class=\"kb-gate-input\" type=\"password\" autocomplete=\"off\" placeholder=\"访问密码\">' +\n        '</div>' +\n        '<div id=\"kb-gate-msg\" class=\"kb-gate-msg\"></div>' +\n        '<button id=\"kb-gate-ok\" class=\"kb-gate-btn\">进入知识库' +\n          '<svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6l6 6-6 6\"/></svg>' +\n        '</button>' +\n        '<div class=\"kb-gate-foot\">🔒 受密码保护的内容</div>' +\n      '</div>';\n    (document.body || document.documentElement).appendChild(box);\n\n    var input = document.getElementById('kb-gate-pwd');\n    var msg = document.getElementById('kb-gate-msg');\n    var card = box.querySelector('.kb-gate-card');\n    function submit() {\n      var val = input.value;\n      if (!val) { msg.textContent = '⚠ 请输入密码'; return; }\n      if (sha256(val) === HASH) { unlock(); return; }\n      msg.textContent = '⚠ 密码不正确，请重试';\n      input.value = '';\n      input.focus();\n      if (card.animate) {\n        card.animate(\n          [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(0)' }],\n          { duration: 300 }\n        );\n      }\n    }\n    document.getElementById('kb-gate-ok').addEventListener('click', submit);\n    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });\n    setTimeout(function () { try { input.focus(); } catch (e) {} }, 80);\n  }\n\n  var passed = false;\n  try { passed = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) {}\n  if (!passed) {\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', showGate);\n    } else {\n      showGate();\n    }\n  }\n})();\n"]
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

    sidebar: [
  {
    text: "学习路径",
    collapsed: false,
    items: [
      { text: "01 · 7 天学习路线图", link: "/00-学习路径/01 · 7 天学习路线图" },
      { text: "02 · API 速查总表", link: "/00-学习路径/02 · API 速查总表" },
      { text: "03 · 常见错误速查", link: "/00-学习路径/03 · 常见错误速查" },
      { text: "04 · 术语表", link: "/00-学习路径/04 · 术语表" },
    ]
  },
  {
    text: "基础入门",
    collapsed: false,
    items: [
      { text: "01 · Three.js 是个啥", link: "/01-基础入门/01 · Three.js 是个啥" },
      { text: "02 · 把环境搭起来", link: "/01-基础入门/02 · 把环境搭起来" },
      { text: "03 · 第一个 3D 场景", link: "/01-基础入门/03 · 第一个 3D 场景" },
      { text: "04 · 三件套详解", link: "/01-基础入门/04 · 三件套详解" },
    ]
  },
  {
    text: "核心概念",
    collapsed: false,
    items: [
      { text: "05 · 几何体与材质", link: "/02-核心概念/05 · 几何体与材质" },
      { text: "06 · 坐标与变换", link: "/02-核心概念/06 · 坐标与变换" },
      { text: "07 · 光照与阴影", link: "/02-核心概念/07 · 光照与阴影" },
    ]
  },
  {
    text: "动画与交互",
    collapsed: false,
    items: [
      { text: "08 · 动画循环（r187 新写法）", link: "/03-动画与交互/08 · 动画循环（r187 新写法）" },
      { text: "09 · 鼠标控制器", link: "/03-动画与交互/09 · 鼠标控制器" },
      { text: "10 · 鼠标交互与射线拾取", link: "/03-动画与交互/10 · 鼠标交互与射线拾取" },
    ]
  },
  {
    text: "进阶特性",
    collapsed: false,
    items: [
      { text: "11 · 纹理贴图", link: "/04-进阶特性/11 · 纹理贴图" },
      { text: "12 · 加载外部模型", link: "/04-进阶特性/12 · 加载外部模型" },
      { text: "13 · 后期处理", link: "/04-进阶特性/13 · 后期处理" },
      { text: "14 · 着色器入门", link: "/04-进阶特性/14 · 着色器入门" },
      { text: "15 · 粒子系统", link: "/04-进阶特性/15 · 粒子系统" },
      { text: "16 · 性能优化", link: "/04-进阶特性/16 · 性能优化" },
    ]
  },
  {
    text: "实战与排错",
    collapsed: false,
    items: [
      { text: "17 · 完整实战项目", link: "/05-实战与排错/17 · 完整实战项目" },
      { text: "18 · 常见问题排错", link: "/05-实战与排错/18 · 常见问题排错" },
      { text: "19 · 学习资源与路线", link: "/05-实战与排错/19 · 学习资源与路线" },
    ]
  },
  {
    text: "API速查手册",
    collapsed: false,
    items: [
      { text: "API 01 · 全局约定与常量", link: "/06-API速查手册/API 01 · 全局约定与常量" },
      { text: "API 02 · Object3D 全参考", link: "/06-API速查手册/API 02 · Object3D 全参考" },
      { text: "API 03 · Scene - Group - Layers", link: "/06-API速查手册/API 03 · Scene - Group - Layers" },
      { text: "API 04 · 相机全参考", link: "/06-API速查手册/API 04 · 相机全参考" },
      { text: "API 05 · WebGLRenderer 全参数", link: "/06-API速查手册/API 05 · WebGLRenderer 全参数" },
      { text: "API 06 · 几何体全参考", link: "/06-API速查手册/API 06 · 几何体全参考" },
      { text: "API 07 · Material 基类与基础材质", link: "/06-API速查手册/API 07 · Material 基类与基础材质" },
      { text: "API 08 · PBR 与特殊材质", link: "/06-API速查手册/API 08 · PBR 与特殊材质" },
      { text: "API 09 · 光照与阴影全参考", link: "/06-API速查手册/API 09 · 光照与阴影全参考" },
      { text: "API 10 · 纹理与加载器全参考", link: "/06-API速查手册/API 10 · 纹理与加载器全参考" },
      { text: "API 11 · 数学工具类全参考", link: "/06-API速查手册/API 11 · 数学工具类全参考" },
      { text: "API 12 · Raycaster 与交互", link: "/06-API速查手册/API 12 · Raycaster 与交互" },
      { text: "API 13 · 动画系统全参考", link: "/06-API速查手册/API 13 · 动画系统全参考" },
      { text: "API 14 · 控制器全参考", link: "/06-API速查手册/API 14 · 控制器全参考" },
      { text: "API 15 · 物体类型全参考", link: "/06-API速查手册/API 15 · 物体类型全参考" },
      { text: "API 16 · 后期处理全参考", link: "/06-API速查手册/API 16 · 后期处理全参考" },
      { text: "API 17 · 音频系统全参考", link: "/06-API速查手册/API 17 · 音频系统全参考" },
      { text: "API 18 · 渲染目标与调试", link: "/06-API速查手册/API 18 · 渲染目标与调试" },
      { text: "API 19 · 曲线与事件系统", link: "/06-API速查手册/API 19 · 曲线与事件系统" },
    ]
  },
  {
    text: "实战案例集",
    collapsed: false,
    items: [
      { text: "案例 00 · 怎么用这些例子", link: "/07-实战案例集/案例 00 · 怎么用这些例子" },
      { text: "案例 01 · 会呼吸的变色星球", link: "/07-实战案例集/案例 01 · 会呼吸的变色星球" },
      { text: "案例 02 · 鼠标拖拽的甜甜圈", link: "/07-实战案例集/案例 02 · 鼠标拖拽的甜甜圈" },
      { text: "案例 03 · 星空穿越", link: "/07-实战案例集/案例 03 · 星空穿越" },
      { text: "案例 04 · 弹跳球与真实阴影", link: "/07-实战案例集/案例 04 · 弹跳球与真实阴影" },
      { text: "案例 05 · 会起伏的波浪海面", link: "/07-实战案例集/案例 05 · 会起伏的波浪海面" },
      { text: "案例 06 · 迷你太阳系", link: "/07-实战案例集/案例 06 · 迷你太阳系" },
      { text: "案例 07 · 键盘控制的小车", link: "/07-实战案例集/案例 07 · 键盘控制的小车" },
      { text: "案例 08 · 点击让物体爆炸", link: "/07-实战案例集/案例 08 · 点击让物体爆炸" },
      { text: "案例 09 · 霓虹发光城市", link: "/07-实战案例集/案例 09 · 霓虹发光城市" },
      { text: "案例 10 · 脉冲万花筒", link: "/07-实战案例集/案例 10 · 脉冲万花筒" },
      { text: "案例 11 · 烟花秀", link: "/07-实战案例集/案例 11 · 烟花秀" },
      { text: "案例 12 · 水晶球折射", link: "/07-实战案例集/案例 12 · 水晶球折射" },
    ]
  },
  {
    text: "Vue3集成案例",
    collapsed: false,
    items: [
      { text: "Vue3-00 · 怎么用这些案例", link: "/08-Vue3集成案例/Vue3-00 · 怎么用这些案例" },
      { text: "Vue3-01 · 组件里的第一个 3D 场景", link: "/08-Vue3集成案例/Vue3-01 · 组件里的第一个 3D 场景" },
      { text: "Vue3-02 · 滑杆控制面板联动 3D", link: "/08-Vue3集成案例/Vue3-02 · 滑杆控制面板联动 3D" },
      { text: "Vue3-03 · 组件化拆分与 provide-inject", link: "/08-Vue3集成案例/Vue3-03 · 组件化拆分与 provide-inject" },
      { text: "Vue3-04 · 用 composable 复用渲染循环", link: "/08-Vue3集成案例/Vue3-04 · 用 composable 复用渲染循环" },
      { text: "Vue3-05 · 点击拾取联动 UI", link: "/08-Vue3集成案例/Vue3-05 · 点击拾取联动 UI" },
      { text: "Vue3-06 · Pinia 管理场景状态", link: "/08-Vue3集成案例/Vue3-06 · Pinia 管理场景状态" },
      { text: "Vue3-07 · GLTF 加载与进度条", link: "/08-Vue3集成案例/Vue3-07 · GLTF 加载与进度条" },
      { text: "Vue3-08 · 路由切换与资源清理", link: "/08-Vue3集成案例/Vue3-08 · 路由切换与资源清理" },
      { text: "Vue3-09 · 响应式避坑专章", link: "/08-Vue3集成案例/Vue3-09 · 响应式避坑专章" },
      { text: "Vue3-10 · 完整实战 3D 产品配置器", link: "/08-Vue3集成案例/Vue3-10 · 完整实战 3D 产品配置器" },
    ]
  },
  {
    text: "生产级专题",
    collapsed: false,
    items: [
      { text: "01 · 内存管理与泄漏排查", link: "/09-生产级专题/01 · 内存管理与泄漏排查" },
      { text: "02 · glTF 优化管线", link: "/09-生产级专题/02 · glTF 优化管线" },
      { text: "03 · 性能剖析与调优", link: "/09-生产级专题/03 · 性能剖析与调优" },
      { text: "04 · WebGPU 迁移实战", link: "/09-生产级专题/04 · WebGPU 迁移实战" },
    ]
  },
  {
    text: "数字孪生与数字工厂",
    collapsed: false,
    items: [
      { text: "01 · 数字孪生是什么", link: "/10-数字孪生与数字工厂/01 · 数字孪生是什么" },
      { text: "02 · 三维场景搭建与产线布局", link: "/10-数字孪生与数字工厂/02 · 三维场景搭建与产线布局" },
      { text: "03 · 设备状态与实时数据驱动", link: "/10-数字孪生与数字工厂/03 · 设备状态与实时数据驱动" },
      { text: "04 · 点击设备查看详情", link: "/10-数字孪生与数字工厂/04 · 点击设备查看详情" },
      { text: "05 · 报警与动画效果", link: "/10-数字孪生与数字工厂/05 · 报警与动画效果" },
      { text: "06 · 数据看板与图表联动", link: "/10-数字孪生与数字工厂/06 · 数据看板与图表联动" },
      { text: "07 · Vue3 数字工厂完整实战", link: "/10-数字孪生与数字工厂/07 · Vue3 数字工厂完整实战" },
      { text: "08 · 从演示到落地", link: "/10-数字孪生与数字工厂/08 · 从演示到落地" },
    ]
  },
  {
    text: "交互实验室",
    collapsed: false,
    items: [
      { text: "01 · 交互演示总览", link: "/11-交互实验室/01 · 交互演示总览" },
      { text: "02 · 光照实验室", link: "/11-交互实验室/02 · 光照实验室" },
      { text: "03 · 相机实验室", link: "/11-交互实验室/03 · 相机实验室" },
      { text: "04 · 射线拾取实验室", link: "/11-交互实验室/04 · 射线拾取实验室" },
      { text: "05 · 动画缓动实验室", link: "/11-交互实验室/05 · 动画缓动实验室" },
      { text: "06 · 粒子系统实验室", link: "/11-交互实验室/06 · 粒子系统实验室" },
      { text: "07 · 后期辉光实验室", link: "/11-交互实验室/07 · 后期辉光实验室" },
    ]
  },
  {
    text: "更多实战案例",
    collapsed: false,
    items: [
      { text: "案例 13 · 加载 GLTF 模型并播放动画", link: "/12-更多实战案例/案例 13 · 加载 GLTF 模型并播放动画" },
      { text: "案例 14 · 拖拽摆放物体", link: "/12-更多实战案例/案例 14 · 拖拽摆放物体" },
      { text: "案例 15 · 第一人称漫游", link: "/12-更多实战案例/案例 15 · 第一人称漫游" },
      { text: "案例 16 · 布料模拟", link: "/12-更多实战案例/案例 16 · 布料模拟" },
      { text: "案例 17 · 分形粒子树", link: "/12-更多实战案例/案例 17 · 分形粒子树" },
      { text: "案例 18 · 音频可视化", link: "/12-更多实战案例/案例 18 · 音频可视化" },
      { text: "案例 19 · 多点触控手势", link: "/12-更多实战案例/案例 19 · 多点触控手势" },
      { text: "案例 20 · 昼夜切换", link: "/12-更多实战案例/案例 20 · 昼夜切换" },
      { text: "案例 21 · 物理弹跳", link: "/12-更多实战案例/案例 21 · 物理弹跳" },
      { text: "案例 22 · 后期处理自定义 ShaderPass", link: "/12-更多实战案例/案例 22 · 后期处理自定义 ShaderPass" },
    ]
  },
  {
    text: "Daily",
    collapsed: false,
    items: [
      { text: "2026-11-20", link: "/Daily/2026-11-20" },
    ]
  },
],

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
