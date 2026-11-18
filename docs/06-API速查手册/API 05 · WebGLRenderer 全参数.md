# API 05 · WebGLRenderer 全参数

## 什么时候用：快速决策

::: tip 大白话时间
把 WebGLRenderer 想成「照片冲洗店」——你拍好的场景和相机交给它，它负责输出画面。`antialias`、`setPixelRatio`、`shadowMap`、`toneMapping` 就是冲洗时选的画质档位、分辨率、要不要加阴影、调色风格，档位越高越好看也越费性能。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 页面背景透明，露出背后的 CSS | `new THREE.WebGLRenderer({ alpha: true })`（其默认 clearAlpha 已为 `0`） | 别只设 `alpha: false` 却想要透明——那种情况下 clearAlpha 是 `1`， canvas 背景不透明 |
| 边缘锯齿明显，想更平滑 | `new THREE.WebGLRenderer({ antialias: true })` | 别指望 `setPixelRatio`——像素比提升清晰度但不消除几何边缘锯齿 |
| 高清屏画面模糊 | `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` | 别直接传 `devicePixelRatio`——3x/4x 屏像素量翻几倍，帧率暴跌 |
| 要让物体投下阴影 | `renderer.shadowMap.enabled = true` + 灯和物体 `castShadow` + 接收者 `receiveShadow` | 别只开 `enabled`——四个开关缺一个就看不到影子 |
| 高光一片死白，没有层次 | `renderer.toneMapping = THREE.ACESFilmicToneMapping` + `toneMappingExposure = 1.2` | 别用默认 `NoToneMapping`——高光被直接裁成纯白 |
| 把 canvas 内容存成图片 | `{ preserveDrawingBuffer: true }` 后调 `canvas.toDataURL()` | 别用默认 `false`——缓冲在合成后被清空，截出来全黑 |

::: warning 一个高频误区
最高频的是「阴影只开一个开关就以为完事」——`renderer.shadowMap.enabled = true` 只是总闸，还必须灯 `castShadow = true`、投影物体 `castShadow = true`、接收者 `receiveShadow = true`，三缺一都看不到影子。其次是 `setPixelRatio`：直接填 `window.devicePixelRatio` 在高分屏（3x/4x）上会让像素量翻几倍到十几倍，帧率暴跌，应使用 `Math.min(devicePixelRatio, 2)` 封顶。另外 `preserveDrawingBuffer: true` 会常驻显存、拖慢渲染，只在需要截图时打开。
:::

## 一、构造

```js
const renderer = new THREE.WebGLRenderer(parameters)
```

### 构造参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `canvas` | `HTMLCanvasElement` | 自动创建 | 指定已有 canvas 元素 |
| `context` | `WebGLRenderingContext` | `null` | 指定已有 WebGL 上下文 |
| `alpha` | `boolean` | `false` | canvas 是否带 alpha 通道（透明背景） |
| `antialias` | `boolean` | `false` | 抗锯齿，边缘更平滑，有性能开销 |
| `depth` | `boolean` | `true` | 是否启用深度缓冲 |
| `stencil` | `boolean` | `false` | 是否启用模板缓冲 |
| `premultipliedAlpha` | `boolean` | `true` | 预乘 alpha |
| `preserveDrawingBuffer` | `boolean` | `false` | 保留绘图缓冲（截图需要设 true） |
| `powerPreference` | `string` | `'default'` | `'high-performance'` / `'low-power'` / `'default'` |
| `failIfMajorPerformanceCaveat` | `boolean` | `false` | 性能不足时是否失败 |
| `logarithmicDepthBuffer` | `boolean` | `false` | 对数深度缓冲，解决超大场景精度 |

```js
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
```

## 二、核心属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `domElement` | `HTMLCanvasElement` | — | 只读，渲染用的 canvas |
| `autoClear` | `boolean` | `true` | 每帧渲染前自动清屏 |
| `autoClearColor` | `boolean` | `true` | 自动清颜色缓冲 |
| `autoClearDepth` | `boolean` | `true` | 自动清深度缓冲 |
| `autoClearStencil` | `boolean` | `true` | 自动清模板缓冲 |
| `sortObjects` | `boolean` | `true` | 按材质/深度排序，减少状态切换 |
| `shadowMap` | `WebGLShadowMap` | — | 阴影配置对象（见下） |
| `outputColorSpace` | `string` | `SRGBColorSpace` | 输出颜色空间 |
| `toneMapping` | `constant` | `NoToneMapping` | 色调映射 |
| `toneMappingExposure` | `number` | `1` | 曝光度 |
| `localClippingEnabled` | `boolean` | `false` | 是否启用局部裁剪 |
| `clippingPlanes` | `Plane[]` | `[]` | 全局裁剪平面 |
| `info` | `object` | — | 渲染统计（见下） |
| `capabilities` | `object` | — | 硬件能力（见下） |
| `properties` | `object` | — | 内部属性缓存 |
| `state` | `object` | — | 内部 WebGL 状态 |
| `extensions` | `object` | — | WebGL 扩展管理 |
| `xr` | `WebXRManager` | — | XR/VR 管理 |

### shadowMap 子对象

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enabled` | `boolean` | `false` | 阴影总开关 |
| `autoUpdate` | `boolean` | `true` | 每帧重算阴影 |
| `needsUpdate` | `boolean` | `false` | 手动标记需要更新阴影 |
| `type` | `constant` | `PCFShadowMap` | 阴影算法 |

## 三、核心方法

### 尺寸

| 方法 | 参数 | 说明 |
|---|---|---|
| `setSize(width, height, updateStyle)` | `number, number, boolean` | 设置画布尺寸；`updateStyle=true` 时同时设 CSS 样式 |
| `getSize(target)` | `Vector2` | 读取当前尺寸到 target |
| `setPixelRatio(value)` | `number` | 设置像素比（高清屏适配） |
| `getPixelRatio()` | — | 返回当前像素比 |
| `getDrawingBufferSize(target)` | `Vector2` | 绘图缓冲区实际尺寸（含像素比） |
| `setViewport(x, y, width, height)` | 4 个数字 | 设置视口 |
| `setScissor(x, y, width, height)` | 4 个数字 | 设置裁剪区域 |
| `setScissorTest(boolean)` | `boolean` | 开关裁剪测试 |

### 渲染

| 方法 | 参数 | 说明 |
|---|---|---|
| `render(scene, camera)` | `Scene, Camera` | 渲染一帧 |
| `setAnimationLoop(callback)` | `Function \| null` | 设置动画循环；传 null 停止 |
| `compile(scene, camera, targetScene)` | `Scene, Camera, Scene` | 预编译着色器（减少卡顿） |
| `compileAsync(scene, camera, targetScene)` | 同上 | 异步预编译，返回 Promise |
| `clear(color, depth, stencil)` | `boolean...` | 清空缓冲 |
| `clearColor()` / `clearDepth()` / `clearStencil()` | — | 清指定缓冲 |
| `setClearColor(color, alpha)` | `Color, number` | 设置清屏颜色 |
| `getClearColor(target)` | `Color` | 读取清屏颜色 |
| `getClearAlpha()` | — | 读取清屏透明度 |
| `setRenderTarget(rt, activeCubeFace, activeMipmapLevel)` | `RenderTarget, number, number` | 切换到渲染目标 |
| `getRenderTarget()` | — | 返回当前渲染目标 |
| `copyFramebufferToTexture(...)` | 多参数 | 复制帧缓冲到纹理 |
| `copyTextureToTexture(...)` | 多参数 | 纹理间复制 |
| `readRenderTargetPixels(rt, x, y, w, h, buffer, activeCubeFaceIndex)` | 多参数 | 读取渲染目标像素 |

### 生命周期

| 方法 | 说明 |
|---|---|
| `dispose()` | 释放渲染器资源 |
| `forceContextLoss()` | 强制丢失 WebGL 上下文（测试用） |
| `forceContextRestore()` | 恢复上下文 |
| `getContext()` | 返回底层 WebGL 上下文 |
| `getContextAttributes()` | 返回上下文属性 |

## 四、info 渲染统计

```js
console.log(renderer.info);
```

| 字段 | 说明 |
|---|---|
| `info.render.frame` | 已渲染帧数 |
| `info.render.calls` | draw call 次数（**性能关键指标**） |
| `info.render.triangles` | 三角形数量 |
| `info.render.points` | 点数量 |
| `info.render.lines` | 线数量 |
| `info.memory.geometries` | 已上传的几何体数 |
| `info.memory.textures` | 已上传的纹理数 |
| `info.programs` | 着色器程序数组 |
| `info.autoReset` | 是否每帧自动重置统计（默认 true） |
| `info.reset()` | 手动重置统计 |

## 五、capabilities 硬件能力

| 属性 | 说明 |
|---|---|
| `isWebGL2` | 是否 WebGL 2（r163 起强制） |
| `maxTextures` | 最大纹理单元数 |
| `maxTextureSize` | 最大纹理尺寸 |
| `maxCubemapSize` | 最大立方体贴图尺寸 |
| `maxAttributes` | 最大顶点属性数 |
| `maxVertexUniforms` | 最大顶点 uniform 数 |
| `maxVaryings` | 最大 varying 数 |
| `maxFragmentUniforms` | 最大片元 uniform 数 |
| `vertexTextures` | 是否支持顶点纹理 |
| `maxSamples` | 最大多重采样数 |
| `precision` | 着色器精度（`highp`/`mediump`/`lowp`） |
| `getMaxAnisotropy()` | 最大各向异性过滤级别 |

```js
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
```

## 六、WebGPURenderer（r187 新方向）

```js
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init(); // 异步初始化！
renderer.setAnimationLoop(animate); // 推荐：在循环里渲染会自动初始化
```

| 构造参数 | 说明 |
|---|---|
| `antialias` / `alpha` / `canvas` | 同 WebGLRenderer |
| `forceWebGL` | 强制使用 WebGL 后端 |
| `powerPreference` | 电源偏好 |

| 方法 | 说明 |
|---|---|
| `init()` | 异步初始化后端 |
| `renderAsync(scene, camera)` | 异步渲染 |
| `computeAsync(node, count)` | 执行计算着色器 |
| `render(scene, camera)` | 同步渲染（需先 init） |

::: warning 注意
WebGPURenderer **只支持 Node Material**——传统 `ShaderMaterial` 和 `onBeforeCompile` 在它上面不生效。要移植到 TSL。它会自动回退到 WebGL 2，所以一套代码全平台能跑。
:::
