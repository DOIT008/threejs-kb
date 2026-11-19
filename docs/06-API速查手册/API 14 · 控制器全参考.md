# API 14 · 控制器全参考

所有控制器都在 `three/addons/controls/` 下。

## 什么时候用：快速决策

::: tip 大白话时间
选控制器像选「相机怎么架」：`OrbitControls` 是把相机架在云台上绕一个点转（产品展示）；`MapControls` 是同一套云台但对调左右键，专门看地图；`PointerLockControls` 是戴上头显把鼠标锁死，第一人称走路；`FlyControls` 是开飞机自由飞。而 `TransformControls` 不动相机，是伸手去拖场景里的物体（编辑器手柄）。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 产品展示、模型查看，绕物体转 | `OrbitControls`，`target` 设为物体中心，`enableDamping = true` 时每帧 `update()` | 别用 `MapControls`——它默认左键平移、右键旋转，手感相反 |
| 看地图/平面图，要拖动平移 | `MapControls`（继承 OrbitControls，左键 PAN、右键 ROTATE） | 别用默认键位的 `OrbitControls`——看地图时左键旋转很别扭 |
| 第一人称游戏，鼠标看向+WASD 走 | `PointerLockControls`，`controls.lock()` 后用 `moveForward/moveRight` | 别用 `FirstPersonControls`——它较老，鼠标会移出窗口 |
| 自由飞行漫游、可翻滚 | `FlyControls`，`update(delta)` + `movementSpeed`/`rollSpeed` | 别用 `OrbitControls`——它始终盯住一个 target，没法自由飞 |
| 3D 编辑器，用 xyz 手柄改位置/旋转/缩放 | `TransformControls`：`transform.attach(mesh)`，并 `scene.add(transform.getHelper())` | 别用 `DragControls`——它只能整体拖，没有轴向和旋转/缩放手柄 |
| 直接抓着物体拖走（不显示手柄） | `DragControls`（内部基于 Raycaster） | 别用 `TransformControls`——它有可见手柄，不是"直接拖" |

::: warning 一个高频误区
加了 `TransformControls` 后拖手柄，轨道相机常会跟着一起转。要监听 `dragging-changed` 在拖拽时关掉 orbit：`transform.addEventListener('dragging-changed', e => { orbit.enabled = !e.value; })`。另外 r169+ 必须 `scene.add(transform.getHelper())`，直接 `scene.add(transform)` 会报错；开了 `enableDamping` 却忘了每帧 `controls.update()`，相机也会卡住不动。
:::

## 一、OrbitControls（轨道控制器）

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const controls = new OrbitControls(camera, domElement);
```

### 构造参数

| 参数 | 说明 |
|---|---|
| `object` | 要控制的相机 |
| `domElement` | 监听事件的元素，默认 `document.body` |

### 属性（完整）

**状态**

| 属性 | 默认值 | 说明 |
|---|---|---|
| `enabled` | `true` | 总开关 |
| `target` | `(0,0,0)` | 围绕的点 |
| `object` | — | 被控制的相机 |
| `domElement` | — | 事件元素 |
| `state` | — | 当前状态（只读） |

**阻尼（惯性）**

| 属性 | 默认值 | 说明 |
|---|---|---|
| `enableDamping` | `false` | 启用惯性（手感更好） |
| `dampingFactor` | `0.05` | 阻尼系数，越小越顺滑 |

::: warning 注意
启用 `enableDamping` 后，**必须每帧调用 `controls.update()`**，否则阻尼效果失效甚至相机不动。
:::

**旋转**

| 属性 | 默认值 | 说明 |
|---|---|---|
| `enableRotate` | `true` | 允许旋转 |
| `rotateSpeed` | `1` | 旋转速度 |
| `autoRotate` | `false` | 自动旋转 |
| `autoRotateSpeed` | `2` | 自动旋转速度 |
| `minPolarAngle` | `0` | 最小极角（弧度，0=正上方） |
| `maxPolarAngle` | `π` | 最大极角（π=正下方） |
| `minAzimuthAngle` | `-Infinity` | 最小方位角 |
| `maxAzimuthAngle` | `Infinity` | 最大方位角 |

**缩放**

| 属性 | 默认值 | 说明 |
|---|---|---|
| `enableZoom` | `true` | 允许缩放 |
| `zoomSpeed` | `1` | 缩放速度 |
| `minDistance` | `0` | 最近距离（透视相机） |
| `maxDistance` | `Infinity` | 最远距离 |
| `minZoom` | `0` | 最小 zoom（正交相机） |
| `maxZoom` | `Infinity` | 最大 zoom |

**平移**

| 属性 | 默认值 | 说明 |
|---|---|---|
| `enablePan` | `true` | 允许平移 |
| `panSpeed` | `1` | 平移速度 |
| `screenSpacePanning` | `true` | 屏幕空间平移（false=沿世界 Y 轴） |
| `keyPanSpeed` | `7` | 键盘平移速度 |
| `maxTargetRadius` | `Infinity` | target 离原点的最大距离 |

**鼠标按键映射**

| 属性 | 默认值 | 说明 |
|---|---|---|
| `mouseButtons.LEFT` | `ROTATE` | 左键行为 |
| `mouseButtons.MIDDLE` | `DOLLY` | 中键行为 |
| `mouseButtons.RIGHT` | `PAN` | 右键行为 |

可选值：`THREE.MOUSE.ROTATE` / `DOLLY` / `PAN`

**触摸映射**

| 属性 | 默认值 | 说明 |
|---|---|---|
| `touches.ONE` | `ROTATE` | 单指 |
| `touches.TWO` | `DOLLY_PAN` | 双指 |

可选值：`TOUCH.ROTATE` / `PAN` / `DOLLY_PAN` / `DOLLY_ROTATE`

### 方法

| 方法 | 说明 |
|---|---|
| `update()` | 更新控制器（用阻尼时必须每帧调用） |
| `listenToKeyEvents(domElement)` | 监听键盘事件（方向键平移） |
| `stopListenToKeyEvents()` | 停止键盘监听 |
| `saveState()` | 保存当前状态 |
| `reset()` | 重置到保存的状态 |
| `dispose()` | 移除所有事件监听 |
| `getDistance()` / `getPolarAngle()` / `getAzimuthalAngle()` | 获取当前状态 |
| `connect(domElement)` / `disconnect()` | 连接/断开 DOM |

### 事件

| 事件 | 触发时机 |
|---|---|
| `'change'` | 相机变化时 |
| `'start'` | 用户开始交互 |
| `'end'` | 用户结束交互 |

```js
controls.addEventListener('change', () => renderer.render(scene, camera));
```

## 二、MapControls（地图控制器）

继承 OrbitControls，只是默认鼠标按键不同（左键=PAN，右键=ROTATE）。属性方法完全相同。

## 三、FlyControls（飞行控制器）

像开飞机——WASD 前后左右，鼠标转向。

| 属性 | 默认值 | 说明 |
|---|---|---|
| `movementSpeed` | `1` | 移动速度 |
| `rollSpeed` | `0.005` | 翻滚速度 |
| `dragToLook` | `false` | 是否按住拖拽才转向 |
| `autoForward` | `false` | 自动前进 |

| 方法 | 说明 |
|---|---|
| `update(deltaTime)` | 每帧更新（需要传 delta） |
| `dispose()` | 清理 |

## 四、PointerLockControls（第一人称）

见[上一章 Raycaster](</06-API速查手册/API 12 · Raycaster 与交互>)部分。

## 五、TransformControls（变换工具）

编辑器风格的 xyz 轴操作手柄。

```js
import { TransformControls } from 'three/addons/controls/TransformControls.js';
const transform = new TransformControls(camera, renderer.domElement);
transform.attach(mesh);
scene.add(transform.getHelper()); // r169+ 需要用 getHelper()
```

| 属性/方法 | 说明 |
|---|---|
| `mode` | `'translate'` / `'rotate'` / `'scale'` |
| `space` | `'world'` / `'local'` |
| `size` | 手柄大小 |
| `translationSnap` / `rotationSnap` / `scaleSnap` | 吸附步长 |
| `showX` / `showY` / `showZ` | 显示哪些轴 |
| `attach(object)` / `detach()` | 附加/分离物体 |
| `getHelper()` | 获取要加入场景的辅助对象 |
| `axis` | 当前选中的轴 |
| `dragging` | 是否正在拖拽 |

```js
// 拖拽物体时禁用轨道控制，避免冲突
transform.addEventListener('dragging-changed', e => {
  orbit.enabled = !e.value;
});
```

## 六、其他控制器

| 控制器 | 说明 |
|---|---|
| `DragControls` | 直接拖拽物体（基于 Raycaster） |
| `TrackballControls` | 轨迹球，无极角限制 |
| `ArcballControls` | 科学可视化常用的弧球控制 |
| `FirstPersonControls` | 老式第一人称（鼠标看+键盘走） |
| `DeviceOrientationControls` | 手机陀螺仪控制 |

## 七、控制器选择速查

| 需求 | 控制器 |
|---|---|
| 产品展示、模型查看 | OrbitControls |
| 地图/平面图 | MapControls |
| 第一人称游戏 | PointerLockControls |
| 自由飞行漫游 | FlyControls |
| 3D 编辑器 | TransformControls + OrbitControls |
| 拖动物体 | DragControls |
| 分子/科学可视化 | ArcballControls |
