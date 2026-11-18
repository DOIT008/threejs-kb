# API 16 · 后期处理全参考

## 什么时候用：快速决策

::: tip 大白话时间
后期处理像一条「照片流水线」：`EffectComposer` 是传送带，`RenderPass` 是第一步"把 3D 场景拍成底片"，`UnrealBloomPass` 是给亮部加辉光的滤镜，`ShaderPass` 是你自己调的滤镜，`OutputPass` 是最后一步"冲印成照片"（sRGB 转换 + 色调映射）。Pass 的先后顺序就是工序顺序，不能乱排。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 给场景加辉光（霓虹、发光字） | 顺序：`RenderPass` → `UnrealBloomPass(res, strength, radius, threshold)` → `OutputPass`，调 `threshold` 只让亮部发光 | 别把 `OutputPass` 放到 bloom 前面——顺序反了颜色空间会错 |
| 自定义画面滤镜（黑白、色差、扭曲） | `ShaderPass({ uniforms, vertexShader, fragmentShader })`，输入纹理 uniform 默认叫 `tDiffuse` | 别去改 `renderer` 的输出设置——效果要在 Pass 链里做 |
| 角色描边/选中高亮 | `OutlinePass(resolution, scene, camera, selectedObjects)`，设 `edgeStrength`/`visibleEdgeColor` | 别用 bloom 代替——bloom 是发光，不是描边轮廓 |
| 景深（背景虚化） | `BokehPass(scene, camera, { focus, aperture, maxblur })` | 别随便拿 `ShaderPass` 糊一下——景深要深度信息，BokehPass 才带 |
| 开了 composer 后锯齿变明显 | 末尾加 `SMAAPass(w,h)` 或 `ShaderPass(FXAAShader)` | 别只指望 `antialias: true`——用了 composer 后它不再作用于最终输出 |
| 切到 composer 后画面发灰/偏暗 | 最后加 `OutputPass()`（r152+ 负责 sRGB 转换与色调映射） | 别指望 `renderer.outputColorSpace` 自动处理——链里必须显式加 OutputPass |

::: warning 一个高频误区
用了 `EffectComposer` 后，必须把动画循环里的 `renderer.render(scene, camera)` 换成 `composer.render()`，否则后期效果完全不生效（等于没接流水线）。另外 Pass 数量控制在 2~3 个，堆太多手机会卡；`RenderPass` 必须第一个、`OutputPass` 必须最后一个。窗口 resize 时别忘了 `composer.setSize(w, h)`，否则画面会被拉伸模糊。
:::

## 一、EffectComposer（合成器）

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
const composer = new EffectComposer(renderer, renderTarget);
```

| 参数 | 说明 |
|---|---|
| `renderer` | 渲染器 |
| `renderTarget` | 可选，自定义渲染目标 |

### 属性

| 属性 | 说明 |
|---|---|
| `renderTarget1` / `renderTarget2` | 两个乒乓缓冲 |
| `writeBuffer` / `readBuffer` | 当前写/读缓冲 |
| `passes` | Pass 数组 |
| `copyPass` | 内部拷贝 Pass |
| `renderToScreen` | 是否渲染到屏幕 |

### 方法

| 方法 | 说明 |
|---|---|
| `addPass(pass)` | 添加 Pass |
| `insertPass(pass, index)` | 插入到指定位置 |
| `removePass(pass)` | 移除 |
| `render(deltaTime)` | 执行所有 Pass |
| `setSize(width, height)` | 设置尺寸 |
| `setPixelRatio(value)` | 设置像素比 |
| `reset(renderTarget)` | 重置 |
| `dispose()` | 释放 |

## 二、Pass（基类）

所有 Pass 的父类。

| 属性 | 默认值 | 说明 |
|---|---|---|
| `enabled` | `true` | 是否启用 |
| `needsSwap` | `true` | 渲染后是否交换缓冲 |
| `clear` | `false` | 渲染前是否清屏 |
| `renderToScreen` | `false` | 是否直接渲染到屏幕 |

| 方法 | 说明 |
|---|---|
| `render(renderer, writeBuffer, readBuffer, deltaTime, maskActive)` | 执行渲染 |
| `setSize(width, height)` | 尺寸变化 |
| `dispose()` | 释放 |

## 三、常用 Pass 详解

### RenderPass（场景渲染）

```js
new THREE.RenderPass(scene, camera, overrideMaterial, clearColor, clearAlpha)
```

| 参数 | 说明 |
|---|---|
| `scene` / `camera` | 场景和相机 |
| `overrideMaterial` | 覆盖材质 |
| `clearColor` / `clearAlpha` | 清屏颜色 |

必须是**第一个** Pass。

### OutputPass（输出）

```js
new THREE.OutputPass()
```

无参数。做最终的颜色空间转换和色调映射。r152+ 建议作为**最后一个** Pass。

### UnrealBloomPass（泛光）

```js
new THREE.UnrealBloomPass(resolution, strength, radius, threshold)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `resolution` | — | `Vector2`，分辨率 |
| `strength` | `1` | 泛光强度 |
| `radius` | `0` | 扩散半径 |
| `threshold` | `0` | 亮度阈值（超过才发光） |

| 属性 | 说明 |
|---|---|
| `strength` / `radius` / `threshold` | 可运行时调整 |
| `highPassUniforms` | 高通滤波参数 |

### BokehPass（景深）

```js
new THREE.BokehPass(scene, camera, params)
```

| params | 默认值 | 说明 |
|---|---|---|
| `focus` | `1` | 对焦距离 |
| `aperture` | `0.025` | 光圈（越大越糊） |
| `maxblur` | `1` | 最大模糊量 |
| `width` / `height` | 窗口尺寸 | 分辨率 |

### OutlinePass（描边）

```js
new THREE.OutlinePass(resolution, scene, camera, selectedObjects)
```

| 属性 | 默认值 | 说明 |
|---|---|---|
| `selectedObjects` | `[]` | 要描边的物体 |
| `edgeStrength` | `3` | 边缘强度 |
| `edgeGlow` | `0` | 发光强度 |
| `edgeThickness` | `1` | 边缘厚度 |
| `pulsePeriod` | `0` | 脉冲周期（0=不闪） |
| `visibleEdgeColor` | `0xffffff` | 可见边颜色 |
| `hiddenEdgeColor` | `0x190a05` | 被遮挡边颜色 |
| `usePatternTexture` | `false` | 图案纹理 |

### ShaderPass（自定义着色器 Pass）

```js
new THREE.ShaderPass(shader, textureID)
```

| 参数 | 说明 |
|---|---|
| `shader` | `{ uniforms, vertexShader, fragmentShader }` |
| `textureID` | 输入纹理的 uniform 名，默认 `'tDiffuse'` |

| 属性 | 说明 |
|---|---|
| `uniforms` | 着色器 uniform |
| `material` | ShaderMaterial |

### FXAA / SMAA（抗锯齿）

```js
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
const fxaa = new ShaderPass(FXAAShader);
fxaa.material.uniforms.resolution.value.set(1/w, 1/h);

import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
const smaa = new SMAAPass(w, h);
```

### 其他 Pass

| Pass | 效果 |
|---|---|
| `FilmPass` | 胶片颗粒、扫描线 |
| `GlitchPass` | 故障/干扰 |
| `DotScreenPass` | 网点印刷 |
| `HalftonePass` | 半色调 |
| `RGBShiftShader` | RGB 色差 |
| `BleachBypassShader` | 漂白旁路 |
| `AfterimagePass` | 运动残影 |
| `SSAOPass` | 屏幕空间环境光遮蔽 |
| `SAOPass` | 改进的 AO |
| `GTAOPass` | 高质量 AO |
| `SSRPass` | 屏幕空间反射 |
| `LuminosityHighPassShader` | 亮度高通（Bloom 内部用） |
| `ClearPass` / `TexturePass` | 清屏 / 贴图 |

## 四、标准组合模板

```js
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(w,h), 1.2, 0.4, 0.85));
composer.addPass(new OutputPass());

renderer.setAnimationLoop(() => {
  composer.render(); // 注意：不是 renderer.render()
});
```

::: warning 注意
用了 EffectComposer 后：
1. 用 `composer.render()` 替代 `renderer.render()`
2. 最后一个 Pass 加 `OutputPass`（负责 sRGB 转换和色调映射）
3. Pass 数量控制在 2~3 个，多了手机会卡
:::
