# Three.js 知识库（r187）

通俗易懂的 Three.js 学习手册，97 篇内容，从零基础到实战，每章都有「大白话」解释和可运行代码。含可交互的 3D 演示、数字孪生/数字工厂实战、生产级优化专题。

教程按**由浅入深**编排：每章内部结构统一为「是什么 → 怎么用 → 深一层（为什么）→ 踩坑与生产」；跨章节的四级阅读顺序见 [7 天学习路线图](</00-学习路径/01 · 7 天学习路线图>) 的「由浅入深」一节。

## 两种使用方式

### 1. 本地预览（Vue 官网同款样式）⭐ 推荐

内容用 VitePress 渲染——这正是 Vue 官网的文档框架，绿色主题、侧边栏、搜索、彩色提示块全都有，还能在文档里直接玩 3D 演示。

```bash
npm install
npm run docs:dev      # 打开 http://localhost:5173
```

> 前提：`npm config get omit` 不能是 `dev`。本项目已把 vitepress 放进 `dependencies` 规避该问题。

### 2. 纯 Markdown 文件

`docs/` 下是 97 个独立的 `.md` 文件，按 13 个分组目录组织，可直接用任何 Markdown 编辑器打开。`docs/README.md` 是目录索引。

### 3. 线上访问（GitHub Pages）

本仓库已配置 GitHub Actions：推送到 `main` 分支后会自动构建 VitePress，并部署到 GitHub Pages。

部署完成后访问：

```txt
https://DOIT008.github.io/threejs-kb/
```

如果仓库改名，URL 中的 `threejs-kb` 也要跟着改。构建时会自动把仓库名注入为 VitePress 的 `base`，无需手改配置。

首次启用步骤：

1. 把仓库推送到 GitHub。
2. 打开仓库 `Settings → Pages`。
3. `Build and deployment → Source` 选择 **GitHub Actions**。
4. 等待 `.github/workflows/deploy.yml` 运行成功后，打开上面的网址。

## 目录结构

| 目录 | 内容 | 篇数 |
|---|---|---|
| `docs/` | Markdown 源文件（VitePress 用） | 97 |
| `docs/.vitepress/theme/components/` | 10 个交互组件源码（材质/几何体/变换/Playground/光照/相机/拾取/缓动/粒子/辉光） | 10 |
| `scripts/` | 维护脚本（配置生成/索引生成/校验） | 4 |
| `docs/.vitepress/theme/composables/` | 通用舞台 composable（WebGL 初始化/循环/清理） | 1 |
| `index.html` | 最初的旧版单文件站点（已弃用，仅备份） | — |

## 内容分组

学习路径(4) · 基础入门(4) · 核心概念(3) · 动画与交互(3) · 进阶特性(6) · 实战与排错(3) · API 速查手册(19) · 实战案例集(13) · Vue3 集成案例(11) · 生产级专题(4) · 数字孪生与数字工厂(8) · 交互实验室(7，含 10 个实时演示) · 更多实战案例(10)

## 交互组件怎么加

`docs/.vitepress/theme/components/` 下的 Vue 组件已在主题里全局注册，在任意 `.md` 里直接写标签即可嵌入：

```md
<MaterialLab />      <!-- 材质 PBR -->
<GeometryGallery />  <!-- 几何体画廊 -->
<TransformLab />     <!-- 变换 -->
<CodePlayground />   <!-- 代码即改即跑 -->
<LightLab />         <!-- 光照与阴影 -->
<CameraLab />        <!-- 透视/正交 -->
<RaycastLab />       <!-- 射线拾取 -->
<EasingLab />        <!-- 动画缓动 -->
<ParticleLab />      <!-- 粒子系统 -->
<BloomLab />         <!-- 后期辉光 -->
```

新组件需在 `docs/.vitepress/theme/index.mjs` 里 `app.component()` 注册一次。组件内部统一用 `useThreeStage` composable 处理 WebGL 初始化、渲染循环和资源清理。

## 代码真实性

「数字孪生与数字工厂」第 07 篇的 12 个文件已实际建 Vite 项目跑过 `npm run build`（41 模块编译通过）并用浏览器验证首屏渲染（canvas、看板、报警数据均正常）。过程中发现并补进了文档遗漏的 `index.html` 和 `vite.config.js`——缺后者会导致 `.vue` 文件无法解析。

## 维护脚本

改了内容后按需运行（在 `threejs-kb/` 目录下）：

```bash
node scripts/gen-config.mjs      # 重新生成 VitePress 侧边栏配置（新增分组/章节后）
node scripts/gen-index.mjs       # 重新生成 docs/README.md 目录索引
node scripts/verify.mjs          # 校验容器/代码块闭合、组件标签
node scripts/check-links.mjs     # 检查站内链接是否死链
```

所有内容都直接编辑 `docs/` 下对应的 `.md` 文件即可。`index.html` 是最初的旧版单文件站点，仅作备份，与现在的 Markdown 版相互独立。
