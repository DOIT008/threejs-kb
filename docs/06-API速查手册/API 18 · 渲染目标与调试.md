# API 18 · 渲染目标与调试

## 什么时候用：快速决策

::: tip 大白话时间
`WebGLRenderTarget` 像一台「离屏照相机」：不把画面直接投到屏幕，而是先拍成一张纹理存起来，再拿这张纹理当贴图用（镜面反射、监控画面、后期处理都靠它）。`WebGLCubeRenderTarget` + `CubeCamera` 是六面同时拍照，用来做反射球。各种 Helper 则像装修验收的卷尺和水平仪——平时收着，排查问题时才拿出来。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 镜面反射、监控画面、把画面当贴图 | `WebGLRenderTarget(w,h)`：`setRenderTarget(rt)` → `render()` → `setRenderTarget(null)`，再 `mesh.material.map = rt.texture` | 别用 `CanvasTexture` 截图——它拿不到 GPU 的渲染结果和深度 |
| 实时环境反射/天空盒 | `WebGLCubeRenderTarget` + `CubeCamera.update(renderer, scene)`，`fromEquirectangularTexture` 可转全景图 | 别用普通 `WebGLRenderTarget`——它只有一面，做不了立方体反射 |
| 需要深度信息（SSAO、软粒子、深度描边） | rt 的 options 设 `depthTexture = new DepthTexture(w,h)`，再读 `rt.depthTexture` | 别想从颜色贴图反推深度——精度不够，读不到真实深度值 |
| 画面"什么都看不见"排查 | 按顺序：F12 看报错 → `renderer.info.render.calls` 是否 >0 → 换 `MeshNormalMaterial` → 加 `AxesHelper` | 别一上来就改相机——先用调试材质确认物体到底在不在 |
| 看不清网格/法线/灯光范围 | `MeshBasicMaterial({ wireframe:true })`、`VertexNormalsHelper`、`CameraHelper(light.shadow.camera)` | 别靠肉眼猜——Helper 能直接显示坐标系、法线和阴影范围 |
| 掉帧，想知道瓶颈在哪 | 看 `renderer.info.render.calls` / `triangles`，再用 Spector.js 抓 WebGL 调用 | 别盲目降面数——先看 draw call 是不是太高 |

::: warning 一个高频误区
离屏渲染的经典坑：`renderer.setRenderTarget(rt)` 之后**一定**要 `renderer.setRenderTarget(null)` 切回屏幕，否则后续渲染（UI、下一帧）全画进那张纹理里，屏幕一片黑。另外 rt 尺寸要跟着窗口 resize 调 `rt.setSize(w,h)`，不用时 `rt.dispose()`，否则显存泄漏。注意 `renderer.info` 在每次 `render()` 后会被重置。
:::

## 一、WebGLRenderTarget（渲染目标）

不渲染到屏幕，而是渲染到纹理——后期处理、离屏渲染、反射都靠它。

```js
new THREE.WebGLRenderTarget(width, height, options)
```

### options 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `wrapS` / `wrapT` | `constant` | `ClampToEdgeWrapping` | 纹理包裹 |
| `magFilter` / `minFilter` | `constant` | `LinearFilter` | 过滤方式 |
| `format` | `constant` | `RGBAFormat` | 像素格式 |
| `type` | `constant` | `UnsignedByteType` | 数据类型 |
| `anisotropy` | `number` | `1` | 各向异性 |
| `depthBuffer` | `boolean` | `true` | 是否含深度缓冲 |
| `stencilBuffer` | `boolean` | `false` | 是否含模板缓冲 |
| `generateMipmaps` | `boolean` | `false` | 是否生成 mipmap |
| `colorSpace` | `string` | `NoColorSpace` | 颜色空间 |
| `samples` | `number` | `0` | MSAA 采样数（0=不开） |
| `count` | `number` | `1` | 多渲染目标（MRT）数量 |
| `depthTexture` | `DepthTexture` | `null` | 深度纹理 |

### 属性

| 属性 | 说明 |
|---|---|
| `width` / `height` | 尺寸 |
| `texture` | 渲染结果纹理（可当贴图用） |
| `textures` | 多渲染目标纹理数组 |
| `depthTexture` | 深度纹理 |
| `viewport` | 视口 |
| `scissor` / `scissorTest` | 裁剪 |

### 方法

| 方法 | 说明 |
|---|---|
| `setSize(width, height)` | 改尺寸 |
| `clone()` / `copy(source)` | 克隆/复制 |
| `dispose()` | 释放 |
| `texture` | 取纹理用于材质 |

```js
const rt = new THREE.WebGLRenderTarget(512, 512);
renderer.setRenderTarget(rt);
renderer.render(scene, camera);
renderer.setRenderTarget(null); // 切回屏幕

// 用渲染结果当贴图
mesh.material.map = rt.texture;
```

## 二、WebGLCubeRenderTarget（立方体渲染目标）

```js
new THREE.WebGLCubeRenderTarget(size, options)
```

配合 `CubeCamera` 做实时反射/环境贴图。

| 方法 | 说明 |
|---|---|
| `fromEquirectangularTexture(renderer, texture)` | 从全景图生成立方体贴图 |

## 三、DepthTexture（深度纹理）

```js
new THREE.DepthTexture(width, height, type, mapping, wrapS, wrapT, magFilter, minFilter, anisotropy, format)
```

| 属性 | 默认值 | 说明 |
|---|---|---|
| `format` | `DepthFormat` | 或 `DepthStencilFormat` |
| `type` | `UnsignedIntType` | 或 `UnsignedShortType`、`FloatType` |
| `compareFunction` | `null` | 阴影比较函数 |

## 四、DataTexture（数据纹理）

从原始数组创建纹理，做程序化图案、查找表（LUT）。

```js
const data = new Uint8Array(4 * 4 * 4); // 4x4 RGBA
const tex = new THREE.DataTexture(data, 4, 4, THREE.RGBAFormat);
tex.needsUpdate = true;
```

## 五、调试工具

### renderer.info 统计

```js
// 每帧打印 draw call 和三角形数
console.log(renderer.info.render.calls, renderer.info.render.triangles);
```

### 性能监测

| 工具 | 说明 |
|---|---|
| `renderer.info` | draw call、三角形、纹理数 |
| Chrome DevTools Performance | 帧率、CPU/GPU 时间 |
| Spector.js | 捕获 WebGL 调用（浏览器扩展） |
| `renderer.debug.checkShaderErrors` | 着色器错误检查（默认 true） |
| `renderer.debug.onShaderError` | 自定义错误处理回调 |

```js
renderer.debug.checkShaderErrors = true;
renderer.debug.onShaderError = (gl, program, vs, fs) => {
  console.error(gl.getShaderInfoLog(vs));
  console.error(gl.getShaderInfoLog(fs));
};
```

### 常用调试材质

| 材质 | 用途 |
|---|---|
| `MeshNormalMaterial()` | 看法线 |
| `MeshBasicMaterial({ wireframe:true })` | 看网格结构 |
| `MeshDepthMaterial()` | 看深度 |
| `scene.overrideMaterial` | 全局替换材质 |

### 常用调试技巧

```js
// 1. 包围盒可视化
const box = new THREE.Box3().setFromObject(mesh);
const helper = new THREE.Box3Helper(box, 0xffff00);
scene.add(helper);

// 2. 坐标轴辅助
scene.add(new THREE.AxesHelper(5)); // 红X 绿Y 蓝Z

// 3. 相机视锥可视化
scene.add(new THREE.CameraHelper(camera));

// 4. 法线辅助
scene.add(new THREE.VertexNormalsHelper(mesh, 0.2));

// 5. 灯光辅助
scene.add(new THREE.DirectionalLightHelper(light));
scene.add(new THREE.PointLightHelper(light));
scene.add(new THREE.SpotLightHelper(light));
scene.add(new THREE.CameraHelper(light.shadow.camera)); // 阴影范围

// 6. 网格地面
scene.add(new THREE.GridHelper(20, 20, 0x42b883, 0x35495e));

// 7. 极坐标网格
scene.add(new THREE.PolarGridHelper(10, 16));
```

### Helpers 完整列表

| Helper | 说明 |
|---|---|
| `AxesHelper` | 坐标轴 |
| `GridHelper` | 网格 |
| `PolarGridHelper` | 极坐标网格 |
| `BoxHelper` | 物体包围盒 |
| `Box3Helper` | Box3 可视化 |
| `CameraHelper` | 相机视锥 |
| `DirectionalLightHelper` | 平行光 |
| `PointLightHelper` | 点光 |
| `SpotLightHelper` | 聚光灯 |
| `HemisphereLightHelper` | 半球光 |
| `RectAreaLightHelper` | 面光源 |
| `VertexNormalsHelper` | 顶点法线 |
| `FaceNormalsHelper` | 面法线 |
| `SkeletonHelper` | 骨骼 |

::: tip 调试流程
遇到「什么都看不见」时，按顺序试：
1. F12 看控制台报错
2. `renderer.info.render.calls` 是否 > 0
3. 换成 `MeshNormalMaterial` 看物体在不在
4. 加 `AxesHelper` 确认坐标系和相机位置
5. 检查 `camera.position` 和 `mesh.position` 的距离
:::
