# API 08 · PBR 与特殊材质

## 什么时候用：快速决策

::: tip 大白话时间
把 Standard 想成「日常通用漆」——调 `roughness`（粗糙度）和 `metalness`（金属度）就能调出塑料、木头、金属。Physical 则是「高级定制漆」，多了清漆（车漆）、透射（玻璃）、虹彩（肥皂泡）这些特殊工艺。普通物体用通用漆就够，只有要玻璃、车漆时才升级。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 日常物体（塑料 / 木头 / 石头 / 金属） | `new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0 })` | 别用 Phong——非物理正确，参数不直观、反射不真实 |
| 真实玻璃，要能看到并折射背后 | `new THREE.MeshPhysicalMaterial({ transmission: 1, thickness: 0.5, ior: 1.5, transparent: true })` | 别用 `opacity: 0.5`——那只是变淡，不会折射背后，玻璃感全无 |
| 车漆 / 光亮保护层 | `clearcoat: 1, clearcoatRoughness: 0.05` + `metalness: 0.9` | 别用普通 Standard——没有清漆层，少了那层罩光高光 |
| 肥皂泡 / 油膜 / 虹彩 | `iridescence: 1, iridescenceIOR: 1.3` | 别靠 `envMap` 硬凑——虹彩是随视角变色的薄膜干涉，贴图做不出来 |
| 布料 / 天鹅绒柔光 | `sheen: 1, sheenColor: 0xffcccc, sheenRoughness: 1` | 别用高 roughness 的 Standard——那只是哑光，没有布料边缘柔光 |
| 检查法线是否翻转 / 确认物体在不在画面 | `new THREE.MeshNormalMaterial()` | 别用 Standard——它依赖光照，法线错误不容易看出来 |

::: warning 一个高频误区
`transmission` 和 `opacity` 不是一回事：`opacity` 只是把物体整体变淡（alpha 混合），背后不会折射；`transmission` 是真实透射，会采样并折射背后的场景，计算昂贵，还必须配合 `transparent: true`、`thickness`（厚度）和 `ior`（折射率）才有玻璃感。另一个坑是 `metalness` 乱设中间值——非金属永远是 0，金属永远是 1，只有带锈过渡才用 0~1 之间；把塑料设成 0.5 会不伦不类。Physical 比 Standard 贵，别全场景无脑用它。
:::

## 一、MeshStandardMaterial（物理标准材质）

日常开发的默认选择，物理正确渲染（PBR）。

```js
new THREE.MeshStandardMaterial(parameters)
```

### 核心参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `color` | `Color` | `0xffffff` | 基础颜色 |
| `roughness` | `number` | `1` | 粗糙度：0=镜面，1=完全哑光 |
| `metalness` | `number` | `0` | 金属度：0=非金属，1=金属 |
| `roughnessMap` | `Texture` | `null` | 粗糙度贴图（乘到 roughness 上） |
| `metalnessMap` | `Texture` | `null` | 金属度贴图 |
| `map` | `Texture` | `null` | 颜色贴图 |
| `normalMap` | `Texture` | `null` | 法线贴图 |
| `normalScale` | `Vector2` | `(1,1)` | 法线强度 |
| `bumpMap` / `bumpScale` | `Texture / number` | `null / 1` | 凹凸贴图 |
| `displacementMap` / `displacementScale` / `displacementBias` | — | — | 位移贴图 |
| `aoMap` / `aoMapIntensity` | `Texture / number` | `null / 1` | AO 贴图（需要 uv1） |
| `lightMap` / `lightMapIntensity` | `Texture / number` | `null / 1` | 光照贴图（需要 uv1） |
| `emissive` | `Color` | `0x000000` | 自发光颜色 |
| `emissiveMap` | `Texture` | `null` | 自发光贴图 |
| `emissiveIntensity` | `number` | `1` | 自发光强度 |
| `alphaMap` | `Texture` | `null` | 透明度贴图 |
| `envMap` | `Texture` | `null` | 环境贴图（scene.environment 会自动提供） |
| `envMapIntensity` | `number` | `1` | 环境反射强度 |
| `flatShading` | `boolean` | `false` | 平面着色 |

::: tip 大白话时间
**roughness（粗糙度）和 metalness（金属度）是 PBR 的核心：**

| 材质 | roughness | metalness |
|---|---|---|
| 塑料 | 0.5~0.8 | 0 |
| 橡胶 | 0.9~1 | 0 |
| 镜面金属 | 0.05~0.2 | 1 |
| 磨砂金属 | 0.4~0.6 | 1 |
| 木头/石头 | 0.7~1 | 0 |

记住一条：**非金属 metalness 永远是 0，金属永远是 1，中间值只用于过渡（比如带锈的铁）。**
:::

## 二、MeshPhysicalMaterial（物理增强材质）

继承 Standard，增加高级特性——玻璃、车漆、布料。

### 新增参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `clearcoat` | `number` | `0` | 清漆层强度（车漆的光亮外层） |
| `clearcoatRoughness` | `number` | `0` | 清漆层粗糙度 |
| `clearcoatMap` / `clearcoatRoughnessMap` / `clearcoatNormalMap` | `Texture` | `null` | 清漆相关贴图 |
| `sheen` | `number` | `0` | 织物柔光（布料效果） |
| `sheenColor` | `Color` | `0xffffff` | 柔光颜色 |
| `sheenRoughness` | `number` | `1` | 柔光粗糙度 |
| `transmission` | `number` | `0` | **透射**——玻璃效果的关键参数 |
| `thickness` | `number` | `0` | 材质厚度（影响折射） |
| `attenuationColor` | `Color` | `0xffffff` | 光穿过材质后的衰减色 |
| `attenuationDistance` | `number` | `Infinity` | 衰减距离 |
| `ior` | `number` | `1.5` | 折射率（玻璃 1.5、水 1.33、钻石 2.4） |
| `iridescence` | `number` | `0` | 虹彩效果（肥皂泡、油膜） |
| `iridescenceIOR` | `number` | `1.3` | 虹彩折射率 |
| `iridescenceThicknessRange` | `number[]` | `[100,400]` | 虹彩厚度范围（r187 已弃用，改单值） |
| `specularIntensity` | `number` | `1` | 镜面反射强度 |
| `specularColor` | `Color` | `0xffffff` | 镜面反射颜色 |
| `anisotropy` | `number` | `0` | 各向异性（拉丝金属） |
| `anisotropyRotation` | `number` | `0` | 各向异性方向 |

### 玻璃效果配方

```js
new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transmission: 1,    // 关键：完全透射
  thickness: 0.5,     // 有厚度才有折射
  ior: 1.5,           // 玻璃的折射率
  transparent: true,
  envMapIntensity: 1
});
```

### 车漆效果配方

```js
new THREE.MeshPhysicalMaterial({
  color: 0xff0000,
  metalness: 0.9,
  roughness: 0.3,
  clearcoat: 1,           // 清漆层
  clearcoatRoughness: 0.05
});
```

::: warning 注意
`transmission` 需要配合 `transparent: true`。它和 `opacity` 不同——`opacity` 只是变淡，`transmission` 会真实折射背后的物体，计算更贵。
:::

## 三、MeshNormalMaterial

按法线方向染色，彩虹色。不需要光照，调试神器。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `normalMap` / `normalScale` | `null / (1,1)` | 法线贴图 |
| `flatShading` | `false` | 平面着色 |
| `wireframe` | `false` | 线框 |

```js
const debugMat = new THREE.MeshNormalMaterial();
```

::: tip 调试用途
- 看法线是否翻转（颜色异常说明法线错了）
- 看模型朝向
- 快速确认物体在不在画面里
:::

## 四、MeshDepthMaterial

按到相机的距离染色（近白远黑）。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `depthPacking` | `BasicDepthPacking` | `BasicDepthPacking` 或 `RGBADepthPacking` |
| `map` / `alphaMap` / `displacementMap` | `null` | 贴图 |

常配合 `scene.overrideMaterial` 做深度可视化或阴影自定义。

## 五、MeshDistanceMaterial

类似 DepthMaterial，用于点光源阴影。

## 六、ShaderMaterial（自定义着色器）

```js
new THREE.ShaderMaterial(parameters)
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `uniforms` | `object` | `{ uName: { value: ... } }` 传给 GPU 的变量 |
| `vertexShader` | `string` | 顶点着色器 GLSL 代码 |
| `fragmentShader` | `string` | 片元着色器 GLSL 代码 |
| `defines` | `object` | 预编译宏定义 |
| `lights` | `boolean` | 是否注入光照 uniform |
| `clipping` | `boolean` | 是否支持裁剪 |
| `extensions` | `object` | WebGL 扩展开关 |
| `glslVersion` | `constant` | `GLSL1` / `GLSL3` |
| `transparent` / `depthTest` / `depthWrite` | — | 同基类 |

内置 uniform（自动提供）：`projectionMatrix`、`modelViewMatrix`、`modelMatrix`、`viewMatrix`、`normalMatrix`、`cameraPosition`

内置 attribute：`position`、`normal`、`uv`

## 七、RawShaderMaterial

比 ShaderMaterial 更底层——**不会自动注入**内置 uniform 和 attribute，全都要自己声明。适合完全掌控着色器。

## 八、PointsMaterial（点材质）

| 参数 | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 点颜色 |
| `size` | `1` | 点大小（像素） |
| `sizeAttenuation` | `true` | 是否远小近大 |
| `map` / `alphaMap` | `null` | 点贴图（做圆形粒子） |
| `vertexColors` | `false` | 启用顶点颜色 |

## 九、SpriteMaterial（精灵材质）

| 参数 | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 颜色 |
| `map` | `null` | 精灵贴图 |
| `alphaMap` / `alphaTest` | `null / 0` | 透明控制 |
| `rotation` | `0` | 精灵旋转弧度 |
| `sizeAttenuation` | `true` | 是否远小近大 |
| `fog` | `true` | 受雾影响 |

精灵（`Sprite`）永远面向相机，做标签、图标、火焰billboard 用。

## 十、LineBasicMaterial / LineDashedMaterial

| LineBasicMaterial | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 线颜色 |
| `linewidth` | `1` | 线宽（多数平台只支持 1） |
| `vertexColors` | `false` | 顶点颜色 |
| `fog` | `true` | 受雾影响 |

| LineDashedMaterial 新增 | 默认值 | 说明 |
|---|---|---|
| `dashSize` | `1` | 虚线段长度 |
| `gapSize` | `1` | 间隔长度 |
| `scale` | `1` | 缩放 |

::: warning 注意
用虚线材质必须调用 `line.computeLineDistances()`，否则显示成实线。
:::

## 延伸阅读

- [交互实验室 · 材质实验室](</11-交互实验室/01 · 交互演示总览>) —— 对着滑块亲手拖一遍 roughness / metalness，把这张参数表里的数字和真实光泽变化一一对应起来
