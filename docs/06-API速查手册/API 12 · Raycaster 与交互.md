# API 12 · Raycaster 与交互

## 什么时候用：快速决策

::: tip 大白话时间
`Raycaster` 像一支「激光笔」：从相机（或枪口、手指）射出一条看不见的激光，打到哪个物体就点亮哪个。`intersectObject` 是瞄一个靶，`intersectObjects` 是一排靶一起打；`Layers` 是给靶子分组、只让激光认某一组；`near/far` 是激光的有效射程，`threshold` 是给细线和点套一根"粗管"好瞄准。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 鼠标点击/悬停拾取场景物体 | `raycaster.setFromCamera(ndc, camera)` + `intersectObjects(scene.children, true)` | 别对每个物体分别调 `intersectObject`——多个目标时代码繁琐、性能更差 |
| 只让部分物体可被点中（忽略地面、只点 UI 层） | 给目标 `obj.layers.enable(1)`，再设 `raycaster.layers.set(1)` | 别检测完再 `filter` 结果——`Layers` 在检测阶段就排除，更快更准 |
| 排除太近/太远的命中（忽略贴脸特效、只看 100 米内） | 设 `raycaster.near = 0.5; raycaster.far = 100` | 别检测完再按 `hit.distance` 筛——提前限定范围省去无用计算 |
| 细线/粒子怎么点都点不中 | 调大 `raycaster.params.Line.threshold` / `Points.threshold`（默认 1，按世界单位） | 别去改线的几何体——线和点没有粗细，只有阈值能给"碰撞半径" |
| 百万面模型拾取卡顿 | 装 `three-mesh-bvh`，`geometry.computeBoundsTree()` + 覆盖 `Mesh.prototype.raycast` | 别靠降面数硬扛——BVH 才是数量级加速，还能保留精度 |
| 角色贴地、测两点距离 | 从脚底 `raycaster.set(origin, new THREE.Vector3(0,-1,0))`，取 `hits[0].point` | 别用包围盒猜地面高度——遇到斜面、台阶会算错 |

::: warning 一个高频误区
`pointermove` 给的 `clientX/clientY` 是**像素坐标**，直接传给 `setFromCamera` 会拾取错位。必须先转成 -1~1 的 NDC 并翻转 Y：`mouse.x = (e.clientX/innerWidth)*2-1; mouse.y = -(e.clientY/innerHeight)*2+1`。另外 `intersectObjects` 结果按距离由近到远排序，`hits[0]` 才是最近命中——别拿最后一个当点击目标。
:::

## 一、Raycaster（射线投射器）

```js
new THREE.Raycaster(origin, direction, near, far)
```

### 构造参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `origin` | `Vector3` | `(0,0,0)` | 射线起点 |
| `direction` | `Vector3` | `(0,0,-1)` | 方向（单位向量） |
| `near` | `number` | `0` | 最近检测距离 |
| `far` | `number` | `Infinity` | 最远检测距离 |

### 属性

| 属性 | 说明 |
|---|---|
| `ray` | `Ray` 对象，可读写的起点和方向 |
| `near` / `far` | 检测距离范围 |
| `layers` | `Layers`，只检测匹配层的物体 |
| `params` | 各类物体的检测参数（见下） |
| `camera` | 由 setFromCamera 设置的相机 |

### params 详细配置

```js
raycaster.params = {
  Mesh: {},
  Line: { threshold: 1 },
  LOD: {},
  Points: { threshold: 1 },
  Sprite: {}
};
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `Line.threshold` | `1` | 线的检测半径（世界单位），线太细需要调大 |
| `Points.threshold` | `1` | 点的检测半径 |

::: tip 大白话时间
线和点是没有「粗细」的数学概念，射线很难正好命中。threshold 给它们一个虚拟的「碰撞半径」——调大一点更容易点中。
:::

### 方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `set(origin, direction)` | `Vector3, Vector3` | 设置起点和方向 |
| `setFromCamera(coords, camera)` | `Vector2, Camera` | 从屏幕坐标设置（coords 是 -1~1 的 NDC） |
| `intersectObject(object, recursive, optionalTarget)` | `Object3D, boolean, Array` | 检测单个物体 |
| `intersectObjects(objects, recursive, optionalTarget)` | `Array, boolean, Array` | 检测多个物体 |
| `intersectObjectAsync(...)` | 同上 | 异步版本（BVH 用，返回 Promise） |
| `intersectObjectsAsync(...)` | 同上 | 异步版本 |
| `clone()` | — | 克隆 |

### 检测结果（intersection 对象）

| 属性 | 说明 |
|---|---|
| `distance` | 到交点的距离 |
| `point` | 交点世界坐标 `Vector3` |
| `object` | 被击中的物体 |
| `face` | 三角面 `{a,b,c,normal,materialIndex}` |
| `faceIndex` | 面的索引 |
| `uv` / `uv1` / `uv2` / `uv3` | 各套 UV 坐标 |
| `normal` | 插值后的法线 |
| `instanceId` | InstancedMesh 的实例索引 |
| `barycoord` | 重心坐标 |

结果按**距离从近到远**排序，`[0]` 是最近的。

```js
const hits = raycaster.intersectObjects(scene.children, true);
hits.forEach(hit => {
  console.log(hit.object.name, hit.distance, hit.point);
});
```

## 二、鼠标坐标转 NDC

::: warning 关键
`pointermove` 事件给的是像素坐标，必须转成 -1~1 的 NDC，Y 轴还要翻转。
:::

```js
const mouse = new THREE.Vector2();
addEventListener('pointermove', e => {
  mouse.x =  (e.clientX / innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

// 检测
raycaster.setFromCamera(mouse, camera);
const hits = raycaster.intersectObjects(objects, false);
```

## 三、性能优化：BVH

物体很多时，逐三角检测很慢。用 **three-mesh-bvh** 库加速：

```bash
npm install three-mesh-bvh
```

```js
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

geometry.computeBoundsTree(); // 建 BVH
```

::: tip 大白话时间
BVH（包围体层次）就像书的目录——不用一页页翻，先定位到大概章节再细找。百万面模型也能瞬间拾取。
:::

## 四、其他交互相关

### 射线应用速查

| 用途 | 做法 |
|---|---|
| 鼠标悬停高亮 | pointermove + intersectObject |
| 点击拾取 | click + intersectObjects |
| 角色贴地 | 从脚底向下发射线检测地面 |
| 射击命中 | 从枪口沿朝向发射线 |
| 测量距离 | 点两次取 point 算距离 |
| 拖拽物体 | DragControls 或手动更新位置 |

## 五、PointerLockControls（第一人称）

```js
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const controls = new PointerLockControls(camera, document.body);
controls.lock();   // 锁定鼠标（需用户交互触发）
controls.unlock(); // 解锁

// 事件
controls.addEventListener('lock', ...);
controls.addEventListener('unlock', ...);

// 移动
controls.moveForward(distance);
controls.moveRight(distance);
```

| 属性 | 说明 |
|---|---|
| `isLocked` | 是否锁定 |
| `minPolarAngle` / `maxPolarAngle` | 上下视角限制 |
| `pointerSpeed` | 鼠标灵敏度 |
