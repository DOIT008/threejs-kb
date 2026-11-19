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

  // 浏览器标签页 favicon（base 拼在前面，GitHub Pages 项目站点才找得到）
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }]
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
