# API 07 · Material 基类与基础材质

## 什么时候用：快速决策

::: tip 大白话时间
选材质就像给物体挑「外衣面料」——Basic 是自带颜料的贴纸（不吃饭也亮），Lambert 是便宜的棉布（吃光但没光泽），Phong 是有光泽的塑料，Standard 是物理正确的万能面料。想让外衣半透明，还得同时调 `transparent` 和 `opacity` 两个旋钮。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 调试红线框 / UI / 图标 / 发光体 | `new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })` | 别用 StandardMaterial——受光照影响，调试颜色会被光改变 |
| 低配设备 / 大量简单物体 | `new THREE.MeshLambertMaterial({ color: 0x42b883 })` | 别用 Phong——多算高光，低配上没必要 |
| 经典塑料 / 金属高光 | `new THREE.MeshPhongMaterial({ specular: 0x111111, shininess: 30 })` | 别用 Lambert——没有高光点，塑料感出不来 |
| 日常首选，不确定用什么 | `new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 })` | 别默认 Basic——它不受光，场景会像贴纸一样平 |
| 做镂空（叶子 / 栅栏），要快 | `material.alphaTest = 0.5` + 设置 `alphaMap` | 别用 `transparent: true` + `opacity`——透明要排序，镂空用 alphaTest 丢弃像素更快 |
| 半透明显示（玻璃罩 / 幽灵） | `material.transparent = true; material.opacity = 0.5` | 别只设 `opacity: 0.5`——不设 transparent，物体依旧完全不透明 |

::: warning 一个高频误区
最高频的坑是只设 `opacity: 0.5` 却忘了 `transparent: true`——物体完全不透明，让人以为 opacity 失效。其次是拿 `transparent` 当「镂空」用：真要挖洞（叶子、铁丝网）应该用 `alphaTest` 配合 `alphaMap`，它直接丢弃 alpha 低于阈值的像素，无需排序、也不会有半透明穿插错误；`transparent` 要按深度排序，物体多了容易穿插闪烁。半透明物体还常配合 `depthWrite = false` 避免遮挡后面的透明物。
:::

## 一、Material（基类）

所有材质的父类，下面的属性各种材质通用。

### 构造

```js
const material = new THREE.Material();
```

### 通用属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `id` | `number` | 自动 | 只读，唯一 ID |
| `uuid` | `string` | 自动 | 只读 |
| `name` | `string` | `''` | 材质名 |
| `type` | `string` | `'Material'` | 只读，类型标识 |
| `color` | `Color` | 白色 | 材质颜色（部分材质有） |
| `opacity` | `number` | `1` | 透明度 0~1 |
| `transparent` | `boolean` | `false` | 是否启用透明（改 opacity 必须开这个） |
| `alphaTest` | `number` | `0` | alpha 阈值，低于它的像素被丢弃（做镂空，比 transparent 快） |
| `alphaHash` | `boolean` | `false` | 用哈希抖动模拟透明（r155+，无需排序） |
| `side` | `constant` | `FrontSide` | 渲染哪面 |
| `depthTest` | `boolean` | `true` | 是否做深度测试 |
| `depthWrite` | `boolean` | `true` | 是否写入深度缓冲（透明物体常设 false） |
| `depthFunc` | `constant` | `LessEqualDepth` | 深度比较函数 |
| `blending` | `constant` | `NormalBlending` | 混合模式 |
| `blendSrc` / `blendDst` | `constant` | — | 自定义混合因子 |
| `blendEquation` | `constant` | `AddEquation` | 混合方程 |
| `blendSrcAlpha` / `blendDstAlpha` / `blendEquationAlpha` | `constant` | `null` | 单独设置 alpha 通道混合 |
| `premultipliedAlpha` | `boolean` | `false` | 预乘 alpha |
| `wireframe` | `boolean` | `false` | 线框模式 |
| `wireframeLinewidth` | `number` | `1` | 线宽（多数平台只支持 1） |
| `flatShading` | `boolean` | `false` | 平面着色（每个面一个法线，有棱角感） |
| `fog` | `boolean` | `true` | 是否受场景雾影响 |
| `lightMapIntensity` | `number` | `1` | 光照贴图强度 |
| `aoMapIntensity` | `number` | `1` | AO 贴图强度 |
| `toneMapped` | `boolean` | `true` | 是否参与色调映射（发光物体常设 false） |
| `visible` | `boolean` | `true` | 材质是否可见 |
| `clippingPlanes` | `Plane[]` | `null` | 局部裁剪平面 |
| `clipIntersection` | `boolean` | `false` | 裁剪相交/相交取反 |
| `clipShadows` | `boolean` | `false` | 裁剪是否影响阴影 |
| `shadowSide` | `constant \| null` | `null` | 阴影渲染用哪面 |
| `needsUpdate` | `boolean` | `false` | 设 true 时重新编译着色器 |
| `version` | `number` | 0 | 只读，每次 needsUpdate 会 +1 |
| `userData` | `object` | `{}` | 自定义数据 |

### 方法

| 方法 | 说明 |
|---|---|
| `clone()` | 克隆材质（深拷贝，纹理是浅拷贝） |
| `copy(source)` | 从源材质复制 |
| `dispose()` | 释放资源 |
| `toJSON(meta)` | 序列化 |
| `setValues(values)` | 批量设置属性（构造函数内部用） |
| `onBeforeCompile(shader, renderer)` | 编译前回调，可注入自定义 GLSL |
| `customProgramCacheKey()` | 自定义着色器缓存键 |

```js
// 用 setValues 批量设置
material.setValues({ color: 0xff0000, transparent: true, opacity: 0.5 });

// 注入自定义着色器（WebGL）
material.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader.replace('...', '...');
};
```

::: tip 大白话时间
`transparent` 和 `opacity` 必须**一起用**。只设 `opacity: 0.5` 而不设 `transparent: true`，物体还是完全不透明——这是超高频的新手坑。
:::

## 二、MeshBasicMaterial（基础材质）

不受光照影响的纯色/纯贴图材质。

```js
new THREE.MeshBasicMaterial(parameters)
```

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `color` | `Color` | `0xffffff` | 颜色 |
| `map` | `Texture` | `null` | 颜色贴图 |
| `lightMap` | `Texture` | `null` | 光照贴图 |
| `aoMap` | `Texture` | `null` | 环境光遮蔽贴图 |
| `alphaMap` | `Texture` | `null` | 透明度贴图 |
| `envMap` | `Texture` | `null` | 环境反射贴图 |
| `combine` | `constant` | `MultiplyOperation` | envMap 与颜色混合方式 |
| `reflectivity` | `number` | `1` | 反射强度 |
| `refractionRatio` | `number` | `0.98` | 折射比 |
| `wireframe` | `boolean` | `false` | 线框 |
| `wireframeLinejoin` | `string` | `'round'` | 线框连接样式 |
| `fog` | `boolean` | `true` | 受雾影响 |
| `toneMapped` | `boolean` | `true` | 参与色调映射 |

**用途**：调试（红色线框）、UI 元素、图标、发光物体、天空盒。

## 三、MeshLambertMaterial（兰伯特材质）

便宜的漫反射材质，无高光。适合低配设备。

```js
new THREE.MeshLambertMaterial(parameters)
```

在 Basic 的基础上增加：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `emissive` | `0x000000` | 自发光颜色 |
| `emissiveMap` | `null` | 自发光贴图 |
| `emissiveIntensity` | `1` | 自发光强度 |

::: tip 大白话时间
Lambert 是最简单的「吃光」材质——光从正面照就亮，斜着照就暗，没有高光点。

计算量小，适合大量物体或低端手机。想要塑料高光得用 Phong 或 Standard。
:::

## 四、MeshPhongMaterial（冯氏材质）

经典高光材质，有镜面反射。

```js
new THREE.MeshPhongMaterial(parameters)
```

在 Lambert 基础上增加：

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `specular` | `Color` | `0x111111` | 高光颜色 |
| `shininess` | `number` | `30` | 高光锐利度，越大高光点越小越亮 |
| `bumpMap` | `Texture` | `null` | 凹凸贴图 |
| `bumpScale` | `number` | `1` | 凹凸强度 |
| `normalMap` | `Texture` | `null` | 法线贴图 |
| `normalMapType` | `constant` | `TangentSpaceNormalMap` | 法线贴图类型 |
| `normalScale` | `Vector2` | `(1,1)` | 法线强度 |
| `displacementMap` | `Texture` | `null` | 位移贴图（真改顶点） |
| `displacementScale` | `number` | `1` | 位移强度 |
| `displacementBias` | `number` | `0` | 位移偏移 |
| `envMap` | `Texture` | `null` | 环境贴图 |
| `combine` | `constant` | `MultiplyOperation` | 混合方式：`MultiplyOperation` / `MixOperation` / `AddOperation` |
| `reflectivity` | `number` | `1` | 反射率 |

## 五、法线贴图类型

| 常量 | 说明 |
|---|---|
| `THREE.TangentSpaceNormalMap` | 切线空间（默认，最常用） |
| `THREE.ObjectSpaceNormalMap` | 物体空间 |

## 六、材质性能对比

| 材质 | 计算量 | 高光 | 物理正确 | 场景 |
|---|---|---|---|---|
| MeshBasicMaterial | 最低 | ❌ | ❌ | 调试、UI、发光 |
| MeshLambertMaterial | 低 | ❌ | ❌ | 低配设备、简单场景 |
| MeshPhongMaterial | 中 | ✅ | ❌ | 经典塑料/金属感 |
| MeshStandardMaterial | 中高 | ✅ | ✅ | **日常首选** |
| MeshPhysicalMaterial | 高 | ✅ | ✅ | 玻璃、车漆 |

::: tip 选择建议
不确定用什么就选 `MeshStandardMaterial`——物理正确、效果真实、参数直观。只有明确需要极致性能时才降级到 Lambert，需要特殊效果（玻璃/清漆）时才升级到 Physical。
:::
