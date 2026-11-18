# API 09 · 光照与阴影全参考

## 什么时候用：快速决策

::: tip 大白话时间
布光像在摄影棚打灯——AmbientLight 是「环境底光」（整个屋子均匀亮），DirectionalLight 是「太阳」（平行光、能投影），PointLight 是「灯泡」（向四面八方照），SpotLight 是「聚光灯」（锥形光束），RectAreaLight 是「柔光箱」（面光源）。阴影则是灯照不到的地方，要凑齐四个开关才会出现。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 补一层基础亮度，避免暗部死黑 | `new THREE.AmbientLight(0xffffff, 0.5)` | 别用 DirectionalLight 替代——它有方向，会让暗面全黑亮面过曝 |
| 模拟户外天光（上蓝下棕的自然过渡） | `new THREE.HemisphereLight(0x87ceeb, 0x444444, 1)` | 别用 AmbientLight——上下一个色，没有天空/地面的层次 |
| 模拟太阳光并投影整个场景 | `DirectionalLight` + `castShadow` + 调 `shadow.camera` 范围 + `target` 加入 scene | 别用 PointLight——向四面发光，模拟不了平行太阳光 |
| 灯泡 / 蜡烛，光向四周扩散 | `new THREE.PointLight(0xffaa55, 50, 10, 2)` | 别照老教程写 `intensity: 1`——r155+ 物理光照下几乎看不见 |
| 舞台追光 / 手电筒（锥形、边缘柔和） | `new THREE.SpotLight(0xffffff, 100, 0, Math.PI/6, 0.5, 2)` | 别用 PointLight——它照全向，没有锥形边界和 `penumbra` 柔边 |
| 摄影棚柔光箱 / 灯管，要均匀面光 | `RectAreaLight` + 先 `RectAreaLightUniformsLib.init()` | 别指望它投影——不支持阴影，且只支持 Standard / Physical 材质 |

::: warning 一个高频误区
阴影要同时满足四个开关才出现（总闸 + 灯投影 + 物体投影 + 接收）：`renderer.shadowMap.enabled = true`、灯 `castShadow = true`、投影物体 `castShadow = true` 且接收者 `receiveShadow = true`。很多人只开一个就纳闷「怎么没影子」。更大的坑是点光源阴影：PointLight 要渲染 6 个面（立方体），代价是普通灯的 6 倍，移动端很容易掉帧——能用 DirectionalLight 或 SpotLight 模拟就别用 PointLight 投影。此外平行光阴影相机默认范围只有 ±5，场景大了远处物体没影子，要扩大 `shadow.camera.left/right/top/bottom`；表面条纹（shadow acne）优先调 `normalBias = 0.02`，比 `bias` 更不容易让影子脱节。
:::

## 一、Light（基类）

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `color` | `Color` | `0xffffff` | 光颜色 |
| `intensity` | `number` | `1` | 强度 |
| `visible` | `boolean` | `true` | 开关 |
| `castShadow` | `boolean` | `false` | 是否投影 |
| `target` | `Object3D` | 新 Object3D | 照射目标（部分灯有） |
| `shadow` | `LightShadow` | — | 阴影配置 |

::: warning 物理光照单位
r155 起 Three.js 默认启用**物理正确光照**（`useLegacyLights` 已移除）。点光源/聚光灯的强度单位是坎德拉（candela），数值往往要设得很大（几十到几百），跟老教程的 `intensity: 1` 感觉完全不同。平行光和环境光不受影响。
:::

## 二、AmbientLight（环境光）

```js
new THREE.AmbientLight(color, intensity)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 颜色 |
| `intensity` | `1` | 强度 |

均匀照亮所有物体，无方向、无阴影。只增加 `.color` 和 `.intensity`，没有额外属性。

## 三、HemisphereLight（半球光）

```js
new THREE.HemisphereLight(skyColor, groundColor, intensity)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `skyColor` | `0xffffff` | 天空方向的颜色 |
| `groundColor` | `0x444444` | 地面方向的颜色 |
| `intensity` | `1` | 强度 |

| 额外属性 | 说明 |
|---|---|
| `.color` | 天空色（等同 skyColor） |
| `.groundColor` | 地面色 |
| `.position` | 方向由位置决定，默认 `(0,1,0)` |

## 四、DirectionalLight（平行光/太阳）

```js
new THREE.DirectionalLight(color, intensity)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 颜色 |
| `intensity` | `1` | 强度 |

光线平行，从 `.position` 射向 `.target.position`。

| 额外属性 | 说明 |
|---|---|
| `.target` | 照射目标 Object3D，**必须 add 到 scene** 才生效 |
| `.shadow` | `DirectionalLightShadow`，正交相机阴影 |

```js
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(5, 10, 5);
sun.target.position.set(0, 0, 0);
scene.add(sun, sun.target); // target 要加进场景！
```

## 五、PointLight（点光源）

```js
new THREE.PointLight(color, intensity, distance, decay)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 颜色 |
| `intensity` | `1` | 强度（坎德拉，常需设几十~几百） |
| `distance` | `0` | 照射距离，0=无限远 |
| `decay` | `2` | 衰减指数，2=物理正确（平方反比） |

| 额外属性 | 说明 |
|---|---|
| `.power` | 光通量（流明），设置它会自动换算 intensity：`intensity = power / (4π)` |
| `.shadow` | `PointLightShadow`，立方体阴影（代价高：渲染 6 个面） |

## 六、SpotLight（聚光灯）

```js
new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 颜色 |
| `intensity` | `1` | 强度 |
| `distance` | `0` | 照射距离 |
| `angle` | `Math.PI/3` | 光锥张角（弧度，最大 π/2） |
| `penumbra` | `0` | 边缘柔化 0~1，越大边缘越软 |
| `decay` | `2` | 衰减指数 |

| 额外属性 | 说明 |
|---|---|
| `.target` | 照射目标，要 add 到 scene |
| `.power` | 光通量 |
| `.map` | 聚光灯投影贴图（gobo 效果） |
| `.shadow` | `SpotLightShadow`，透视相机阴影 |

## 七、RectAreaLight（面光源）

```js
new THREE.RectAreaLight(color, intensity, width, height)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `color` | `0xffffff` | 颜色 |
| `intensity` | `1` | 强度 |
| `width` | `1` | 宽度 |
| `height` | `1` | 高度 |

::: warning 注意
使用前**必须初始化**：

```js
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();
```

而且 RectAreaLight **不支持阴影**。只支持 MeshStandardMaterial 和 MeshPhysicalMaterial。
:::

## 八、LightProbe（光照探针）

捕获环境光照信息（球谐函数）。包括 `AmbientLightProbe`、`HemisphereLightProbe`。

```js
new THREE.AmbientLightProbe(color, intensity)
new THREE.HemisphereLightProbe(skyColor, groundColor, intensity)
```

## 九、LightShadow（阴影基类）

所有阴影对象的基础配置：

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `mapSize` | `Vector2` | `(512,512)` | 阴影贴图分辨率，越大越清晰越吃性能 |
| `camera` | `Camera` | 正交/透视 | 阴影相机 |
| `bias` | `number` | `0` | 深度偏移，消除 shadow acne（常用 `-0.0001`） |
| `normalBias` | `number` | `0` | 法线方向偏移，更推荐（常用 `0.02`） |
| `radius` | `number` | `1` | 阴影模糊半径（PCF 下有效） |
| `blurSamples` | `number` | `8` | VSM 阴影的模糊采样数 |
| `intensity` | `number` | `1` | 阴影强度（r165+，0~1，可淡化阴影） |
| `autoUpdate` | `boolean` | `true` | 是否每帧更新 |
| `needsUpdate` | `boolean` | `false` | 手动标记更新 |

| 方法 | 说明 |
|---|---|
| `getFrameExtents()` | 返回阴影帧范围 |
| `getViewportCount()` | 视口数量（点光=6） |
| `dispose()` | 释放资源 |

### 各灯的 shadow.camera

| 灯 | 相机类型 | 需要调整的参数 |
|---|---|---|
| DirectionalLight | `OrthographicCamera` | `left/right/top/bottom`（阴影覆盖范围） |
| SpotLight | `PerspectiveCamera` | `fov` 自动由 angle 算，可调 `near/far` |
| PointLight | `PerspectiveCamera` ×6 | `near/far` |

::: tip 大白话时间
平行光的阴影相机默认范围只有 ±5 单位。场景大了，远处物体就没影子——必须扩大 `shadow.camera.left/right/top/bottom`。

`bias` 和 `normalBias` 用来消除物体表面的条纹（shadow acne）。优先调 `normalBias`（从 0.02 开始），它比 bias 更不容易让影子「脱节」。
:::

### 阴影配置完整示例

```js
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(10, 15, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
sun.shadow.bias = -0.0001;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 2;
scene.add(sun);
```

## 十、灯光性能排序

从快到慢：`AmbientLight` < `HemisphereLight` < `DirectionalLight` < `SpotLight` < `RectAreaLight` < `PointLight`

投影的灯更贵（每盏要额外渲染一遍场景），点光源阴影最贵（6 个面）。移动端建议最多 1~2 盏投影灯。
