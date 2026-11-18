# API 03 · Scene / Group / Layers

## 什么时候用：快速决策

::: tip 大白话时间
把 Scene 想成「整个摄影棚」，Group 是棚里可搬动的「道具组」，Layers 则是「电视频道」——物体待在哪个频道，相机调到那个频道才能拍到它，射线检测同理。一个管层级怎么组织，一个管谁看得见谁。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 设全局背景 / 雾 / 环境反射 | `scene.background = new THREE.Color(0x1a1a2e)`、`scene.fog`、`scene.environment` | 别设在 Group 上——Group 没这些属性，设了不生效也不报错 |
| 车身 + 四个轮子作为整体搬动 | `const car = new THREE.Group(); car.add(body, ...wheels); scene.add(car)` | 别逐个移动 mesh——代码冗余，整车转向时难同步 |
| 让某物体只被小地图相机看到 | `mesh.layers.set(1)` + `miniCam.layers.set(1)` | 别用 `visible = false`——那对所有相机都隐藏了 |
| 主相机既看默认层又看第 1 层 | `camera.layers.enable(1)` | 别用 `camera.layers.set(1)`——set 会清掉第 0 层，默认物体全消失 |
| 射线只检测 UI 层、不误碰场景 | `raycaster.layers.set(2)` + UI 物体 `layers.set(2)` | 别遍历全场景手动过滤物体——性能差、逻辑重复 |
| 做无明确终点的自然远景雾 | `scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02)` | 别用 `Fog(color, near, far)`——线性雾起止明显，过渡生硬 |

::: warning 一个高频误区
最容易把 `layers.set()` 和 `enable()` 搞混。相机默认在第 0 层，`set(1)` 是「只保留第 1 层」——所有没设层的普通物体会突然消失，看起来像「场景黑了」。要追加层必须用 `enable(1)`。同理物体 `layers.set(1)` 会让它从第 0 层消失、主相机看不见——这是设计如此，不是 bug。
:::

## 一、Scene（场景）

继承 `Object3D`，是所有物体的根容器。

### 构造

```js
const scene = new THREE.Scene();
```

### 特有属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `background` | `Color \| Texture \| CubeTexture \| null` | `null` | 背景：纯色 / 全景图 / 立方体贴图 |
| `backgroundIntensity` | `number` | `1` | 背景亮度 |
| `backgroundBlurriness` | `number` | `0` | 背景模糊度（仅环境贴图，0~1） |
| `environment` | `Texture \| null` | `null` | 环境贴图，给所有 PBR 材质提供反射 |
| `environmentIntensity` | `number` | `1` | 环境光强度 |
| `environmentRotation` | `Euler` | `(0,0,0)` | 环境贴图旋转 |
| `fog` | `Fog \| FogExp2 \| null` | `null` | 雾效 |
| `overrideMaterial` | `Material \| null` | `null` | 强制所有物体用此材质渲染（调试用） |
| `autoUpdate` | `boolean` | `true` | 每帧自动更新场景矩阵 |
| `matrixWorldAutoUpdate` | `boolean` | `true` | 自动更新世界矩阵 |

```js
scene.background = new THREE.Color(0x1a1a2e);
scene.backgroundBlurriness = 0.3;
scene.environment = envTexture;
scene.environmentIntensity = 0.8;
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
```

::: tip overrideMaterial 的妙用
设 `scene.overrideMaterial = new THREE.MeshDepthMaterial()` 能一键查看场景深度；设成线框材质能看所有物体的网格结构。调试神器。用完记得设回 `null`。
:::

### 继承的方法

`Scene` 没有特有方法，全部继承自 `Object3D`（见上一章）。

## 二、Fog / FogExp2（雾）

### Fog（线性雾）

```js
new THREE.Fog(color, near, far)
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `color` | `Color` | 雾的颜色，通常和背景色一致 |
| `near` | `number` | 从多远开始起雾 |
| `far` | `number` | 到多远完全变成雾色 |

### FogExp2（指数雾）

```js
new THREE.FogExp2(color, density)
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `color` | `Color` | 雾色 |
| `density` | `number` | 密度，越大雾越浓（常用 0.001~0.1） |

| 属性 | 说明 |
|---|---|
| `.name` | 名字 |
| `.color` | 雾颜色，可运行时改 |
| `.near` / `.far` | Fog 的起止距离 |
| `.density` | FogExp2 的密度 |

::: tip 大白话时间
线性雾是「10 米开始糊，50 米全糊」；指数雾是「越远越糊，没有明确终点」，更自然一些。
:::

## 三、Group（分组）

继承 `Object3D`，**没有任何新增属性或方法**。

它存在的意义是**语义分组**：把相关物体放一起，移动/旋转/删除整组。

```js
const car = new THREE.Group();
car.name = 'car';
car.add(body, wheel1, wheel2, ...);
scene.add(car);

car.position.set(0, 0, 5);   // 整车移动
car.rotation.y = Math.PI/2;  // 整车转向
```

## 四、Layers（渲染层）

控制「哪些物体被哪台相机看到」「哪些物体被射线检测到」。

### 构造

```js
const layer = new THREE.Layers(); // 默认在第 0 层
```

### 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `mask` | `number` | 32 位整数位掩码，每一位代表一个层（0~31） |

### 方法

| 方法 | 参数 | 返回 | 说明 |
|---|---|---|---|
| `set(channel)` | `number` | `this` | 只启用指定层（清掉其他） |
| `enable(channel)` | `number` | `this` | 启用某层 |
| `enableAll()` | — | `this` | 启用全部 32 层 |
| `toggle(channel)` | `number` | `this` | 切换某层开关 |
| `disable(channel)` | `number` | `this` | 禁用某层 |
| `disableAll()` | — | `this` | 禁用所有层 |
| `test(layers)` | `Layers` | `boolean` | 与另一 Layers 是否有交集 |

### 实战：分会场的物体

```js
// 物体放第 1 层
mesh.layers.set(1);

// 主相机默认在第 0 层，看不到它
// 让主相机也能看第 1 层：
camera.layers.enable(1);

// 或者专门用一台渲染第 1 层的相机
const layerCamera = camera.clone();
layerCamera.layers.set(1);
```

::: tip 大白话时间
`Layers` 就像**电视频道**。物体在特定频道播，相机要调到那个频道才能收到。

常见用途：
- 做「小地图」：主相机看所有物体，小地图相机只看第 1 层的标记点
- 做「编辑模式」：辅助线放第 2 层，只在编辑器里显示
- 射线拾取：让射线只检测第 1 层的可交互物体
:::

```js
// 射线只检测第 1 层
raycaster.layers.set(1);
```
