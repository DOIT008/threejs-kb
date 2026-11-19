# API 01 · 全局约定与常量

## 什么时候用：快速决策

::: tip 大白话时间
把常量表想成「调料货架」——颜色写法、色彩空间、混合模式这些常量就是贴好标签的盐和糖。做菜前先认清标签，后面所有材质、贴图、渲染器都从这里拿调料，拿错了整盘菜都变味。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 给材质设一个十六进制颜色 | `new THREE.Color(0x42b883)` | 别用 `'rgb(66,184,131)'` 字符串——啰嗦且不能一眼看出色值 |
| 颜色贴图（如 `map`）要正确显示 | `texture.colorSpace = THREE.SRGBColorSpace` | 别设 `NoColorSpace`——少了 sRGB→线性转换，画面偏暗偏灰 |
| 法线 / 粗糙度等数据贴图 | `texture.colorSpace = THREE.NoColorSpace` | 别设 `SRGBColorSpace`——数据被当颜色转换，法线方向出错 |
| 平面想两面都看见 | `material.side = THREE.DoubleSide` | 别用 `BackSide`——那只渲染背面，正面反而消失 |
| 发光叠加特效越叠越亮 | `material.blending = THREE.AdditiveBlending` + `transparent: true` | 别用默认 `NormalBlending`——普通透明叠加不会发亮 |
| 高光一片死白没层次 | `renderer.toneMapping = THREE.ACESFilmicToneMapping` | 别用默认 `NoToneMapping`——高光被直接裁成纯白块 |

::: warning 一个高频误区
最容易踩的是把**数据贴图当颜色贴图**：给 `normalMap`、`roughnessMap`、`metalnessMap` 设了 `SRGBColorSpace`，Three.js 会多做一次线性转换，法线方向和粗糙度数值全错，画面「怪但说不出哪里怪」。记住：能看见颜色的贴图用 sRGB，存数学数据的保持 `NoColorSpace`。另外 r187 里 `PCFSoftShadowMap` 已移除，别再用，直接写 `THREE.PCFShadowMap`。
:::

这一章是查手册的「字典前言」。后面所有 API 都会反复用到这些常量和写法，先集中列清楚。

## 一、版本

| 常量 | 类型 | 说明 |
|---|---|---|
| `THREE.REVISION` | `string` | 当前版本号，如 `"187"`（r187） |

## 二、颜色的四种写法

所有接受颜色参数的 API（`color`、`background`、`emissive` 等）都能用下面任意一种：

```js
new THREE.Color(0x42b883)      // 十六进制整数（最常用）
new THREE.Color('#42b883')     // CSS 十六进制字符串
new THREE.Color('rgb(66,184,131)') // RGB 字符串
new THREE.Color('steelblue')   // CSS 颜色名
new THREE.Color().setHSL(0.4, 0.6, 0.5) // HSL：色相/饱和度/亮度
new THREE.Color(1, 0.5, 0.2)   // 三个 0~1 的浮点数
```

::: tip 大白话时间
`0x` 开头是十六进制写法——`0x42b883` 就是 CSS 里的 `#42b883`。程序员喜欢用它，因为直接写在代码里不用加引号。
:::

## 三、材质渲染面 side

控制物体的哪个面被渲染。

| 常量 | 值 | 说明 |
|---|---|---|
| `THREE.FrontSide` | 0 | 只渲染正面（默认） |
| `THREE.BackSide` | 1 | 只渲染背面（从内部看球体时用） |
| `THREE.DoubleSide` | 2 | 正反面都渲染（平面、薄片必用） |

```js
material.side = THREE.DoubleSide;
```

::: warning 注意
平面（`PlaneGeometry`）默认正面朝 **+Z**。你从背面看它会「消失」——设 `DoubleSide` 或把它转过来即可。
:::

## 四、混合模式 blending

| 常量 | 说明 |
|---|---|
| `THREE.NoBlending` | 不混合，直接覆盖 |
| `THREE.NormalBlending` | 普通透明混合（默认） |
| `THREE.AdditiveBlending` | 加法混合，越叠越亮（发光特效） |
| `THREE.SubtractiveBlending` | 减法混合 |
| `THREE.MultiplyBlending` | 乘法混合，越叠越暗 |
| `THREE.CustomBlending` | 自定义，配合下面两组常量 |

**混合方程**（`blendEquation`）：

| 常量 | 说明 |
|---|---|
| `AddEquation` | 相加（默认） |
| `SubtractEquation` | 相减 |
| `ReverseSubtractEquation` | 反向相减 |
| `MinEquation` / `MaxEquation` | 取最小/最大 |

**混合因子**（`blendSrc` / `blendDst`）：

`ZeroFactor`、`OneFactor`、`SrcColorFactor`、`OneMinusSrcColorFactor`、`SrcAlphaFactor`、`OneMinusSrcAlphaFactor`、`DstColorFactor`、`OneMinusDstColorFactor`、`DstAlphaFactor`、`OneMinusDstAlphaFactor`、`SrcAlphaSaturateFactor`、`ConstantFactor`、`OneMinusConstantFactor`

```js
material.blending = THREE.CustomBlending;
material.blendEquation = THREE.AddEquation;
material.blendSrc = THREE.SrcAlphaFactor;
material.blendDst = THREE.OneMinusSrcAlphaFactor;
```

## 五、颜色空间 colorSpace

| 常量 | 说明 |
|---|---|
| `THREE.SRGBColorSpace` | sRGB，用于颜色贴图和最终输出（最常用） |
| `THREE.LinearSRGBColorSpace` | 线性空间，用于数据贴图（法线、粗糙度等） |
| `THREE.NoColorSpace` | 不转换，纯数据 |
| `THREE.DisplayP3ColorSpace` | P3 广色域 |

```js
colorMap.colorSpace = THREE.SRGBColorSpace;  // 颜色贴图
normalMap.colorSpace = THREE.NoColorSpace;   // 数据贴图
renderer.outputColorSpace = THREE.SRGBColorSpace;
```

::: tip 大白话时间
颜色贴图要设 sRGB，数据贴图**不要**设——这是新手最常踩的坑之一。记住：**能看见颜色的用 sRGB，存数学数据的不用。**
:::

## 六、色调映射 toneMapping

| 常量 | 说明 |
|---|---|
| `THREE.NoToneMapping` | 不做映射（默认） |
| `THREE.LinearToneMapping` | 线性 |
| `THREE.ReinhardToneMapping` | 柔和压暗高光 |
| `THREE.CineonToneMapping` | 电影感 |
| `THREE.ACESFilmicToneMapping` | 电影级，最常用 |
| `THREE.AgXToneMapping` | 更真实的色彩保留（较新） |
| `THREE.NeutralToneMapping` | 中性，颜色变化小 |
| `THREE.CustomToneMapping` | 自定义 |

```js
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; // 曝光度
```

## 七、阴影类型

| 常量 | 说明 |
|---|---|
| `THREE.BasicShadowMap` | 硬阴影，最快，锯齿明显 |
| `THREE.PCFShadowMap` | 百分比滤波，柔化（r186 起推荐，默认） |
| `THREE.VSMShadowMap` | 方差阴影，更柔和但可能有漏光 |

::: warning 注意
`THREE.PCFSoftShadowMap` 从 **r182 起废弃**（当时 WebGL 端先弃用，且 `PCFShadowMap` 自 r182 起就已经是柔化的），到 **r186 起从两个渲染器彻底移除**——现在写入会收到警告并回退到 `PCFShadowMap`。所以 r187 里直接用 `THREE.PCFShadowMap` 即可，老教程里那个常量别再用。
:::

## 八、纹理包裹方式 wrapS / wrapT

| 常量 | 说明 |
|---|---|
| `THREE.ClampToEdgeWrapping` | 超出部分拉伸边缘像素（默认） |
| `THREE.RepeatWrapping` | 重复平铺 |
| `THREE.MirroredRepeatWrapping` | 镜像重复（像镜子翻转） |

## 九、纹理过滤 filter

| 常量 | 说明 |
|---|---|
| `THREE.NearestFilter` | 最近邻，像素风，最快 |
| `THREE.LinearFilter` | 线性插值，平滑 |
| `THREE.NearestMipmapNearestFilter` | 最近 mipmap + 最近邻 |
| `THREE.NearestMipmapLinearFilter` | 最近 mipmap + 线性 |
| `THREE.LinearMipmapNearestFilter` | 线性 mipmap + 最近邻 |
| `THREE.LinearMipmapLinearFilter` | 三线性过滤（默认，质量最好） |

```js
texture.magFilter = THREE.LinearFilter;
texture.minFilter = THREE.LinearMipmapLinearFilter;
```

## 十、纹理映射方式 mapping

| 常量 | 说明 |
|---|---|
| `THREE.UVMapping` | 普通 UV 贴图（默认） |
| `THREE.EquirectangularReflectionMapping` | 全景图反射（HDRI 常用） |
| `THREE.EquirectangularRefractionMapping` | 全景图折射 |
| `THREE.CubeReflectionMapping` | 立方体反射 |
| `THREE.CubeRefractionMapping` | 立方体折射 |

::: warning 注意
`THREE.CubeUVReflectionMapping` 在 r187 已被移除。用 `EquirectangularReflectionMapping` 即可，Three.js 内部会自动用 PMREM 转换。
:::

## 十一、像素数据类型 type

`UnsignedByteType`（默认）、`ByteType`、`ShortType`、`UnsignedShortType`、`IntType`、`UnsignedIntType`、`FloatType`、`HalfFloatType`

## 十二、缓冲区用途 usage

用于 `BufferAttribute.setUsage()`：

| 常量 | 说明 |
|---|---|
| `THREE.StaticDrawUsage` | 静态，几乎不变（默认） |
| `THREE.DynamicDrawUsage` | 频繁更新 |
| `THREE.StreamDrawUsage` | 每帧都变 |

```js
geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
```

## 十三、深度比较函数 depthFunc

`NeverDepth`、`AlwaysDepth`、`LessDepth`、`LessEqualDepth`（默认）、`EqualDepth`、`GreaterEqualDepth`、`GreaterDepth`、`NotEqualDepth`

## 十四、其他常用枚举速查

| 类别 | 常量 |
|---|---|
| 动画循环 | `THREE.LoopOnce`、`THREE.LoopRepeat`、`THREE.LoopPingPong` |
| 插值 | `THREE.InterpolateSmooth`、`InterpolateLinear`、`InterpolateDiscrete` |
| 曲线 | `THREE.CurvePath`、`CatmullRomCurve3`、`CubicBezierCurve3` |
| 键盘/鼠标 | 标准 DOM 事件值（详见[控制器章节](</06-API速查手册/API 14 · 控制器全参考>)） |
