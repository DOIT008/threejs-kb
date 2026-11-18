# API 04 · 相机全参考

## 什么时候用：快速决策

::: tip 大白话时间
选相机就像选镜头：透视相机（PerspectiveCamera）是普通相机，有近大远小，适合游戏和现实场景；正交相机（OrthographicCamera）像工程制图仪的平行投影，1 米和 10 米的球一样大，适合建筑图纸和等距游戏。CubeCamera 则是「六面同时拍照的球」，专门用来生成环境反射贴图。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 做游戏 / 展品浏览，要有纵深感 | `new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100)` | 别用 `OrthographicCamera`——没有近大远小，画面像贴图 |
| 做建筑图纸 / 等距视角 / 2.5D / UI 叠加 | `new THREE.OrthographicCamera(-d*aspect, d*aspect, d, -d, 0.1, 100)` | 别用 `PerspectiveCamera`——近大远小会破坏等距测量感 |
| 产品展示怕广角变形 | `fov = 35~45`，改完调 `updateProjectionMatrix()` | 别用 `fov = 90`——鱼眼畸变，产品边缘被拉弯 |
| 窗口缩放后画面被拉伸 | 改 `camera.aspect` 后调 `camera.updateProjectionMatrix()` | 别只调 `renderer.setSize()`——投影矩阵不更新，画面依旧变形 |
| 远处表面闪烁（z-fighting） | 收紧 `near/far`，保持比值约小于 10000（如 `0.1~1000`） | 别用 `near=0.0001, far=100000`——深度精度不够 |
| 做反射球，一次生成周围环境贴图 | `new THREE.CubeCamera(0.1, 100, cubeRT)` + `cubeCam.update(renderer, scene)` | 别用普通相机渲染 6 次——CubeCamera 一次搞定并匹配立方体渲染目标 |

::: warning 一个高频误区
改完 `fov` / `aspect` / `near` / `far` / `zoom` 后忘记调 `updateProjectionMatrix()`，是最高频的坑——参数明明改了，画面却没变化，让人以为 API 坏了。`near/far` 比值也别超约 10000:1：设成 `near=0.1, far=100000` 会让深度缓冲精度骤降，远处的面互相穿插闪烁。正确做法是尽量收紧范围，场景只需看到 100 单位，`far` 就设 100~200，别偷懒填 2000。
:::

## 一、Camera（基类）

不直接使用，是所有相机的父类。

### 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `position` | `Vector3` | 相机位置（继承 Object3D） |
| `up` | `Vector3` | 上方方向，默认 `(0,1,0)` |
| `matrixWorldInverse` | `Matrix4` | 世界矩阵逆矩阵（视图矩阵），内部计算 |
| `projectionMatrix` | `Matrix4` | 投影矩阵 |
| `projectionMatrixInverse` | `Matrix4` | 投影矩阵逆矩阵 |
| `layers` | `Layers` | 渲染层：只有同层的物体才会被渲染 |
| `near` | `number` | 近裁剪面 |
| `far` | `number` | 远裁剪面 |
| `zoom` | `number` | 缩放倍数，默认 1 |
| `filmGauge` | `number` | 胶片尺寸，默认 35 |
| `filmOffset` | `number` | 胶片偏移，默认 0 |
| `view` | `object \| null` | 多视口偏移参数，由 setViewOffset 设置 |

### 方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `lookAt(x,y,z)` | 三个数或 `Vector3` | 让相机看向目标（修改 rotation） |
| `updateProjectionMatrix()` | — | **改参数后必须调用** |
| `updateMatrixWorld(force)` | `boolean` | 更新世界矩阵 |
| `getWorldDirection(target)` | `Vector3` | 相机的朝向（看向的方向，-Z） |
| `setFocalLength(focalLength)` | `number` | 用毫米焦距设置 fov |
| `getFocalLength()` | — | 返回当前焦距（毫米） |
| `getEffectiveFOV()` | — | 考虑 zoom 后的实际垂直 fov |
| `getFilmWidth()` | — | 胶片宽度 |
| `getFilmHeight()` | — | 胶片高度 |
| `clearViewOffset()` | — | 清除视口偏移 |
| `updateProjectionMatrix()` | — | 重算投影矩阵 |

## 二、PerspectiveCamera（透视相机）

```js
new THREE.PerspectiveCamera(fov, aspect, near, far)
```

### 构造参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `fov` | `number` | 50 | 垂直视野角度（**度**，不是弧度），常用 35~75 |
| `aspect` | `number` | 1 | 宽高比，通常 `innerWidth / innerHeight` |
| `near` | `number` | 0.1 | 近裁剪面，比这更近的不渲染 |
| `far` | `number` | 2000 | 远裁剪面，比这更远的不渲染 |

### 特有属性（在基类基础上）

| 属性 | 类型 | 说明 |
|---|---|---|
| `fov` | `number` | 视野角度 |
| `aspect` | `number` | 宽高比 |
| `view` | `object \| null` | 视口偏移配置 |

### 特有方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `setViewOffset(fullWidth, fullHeight, x, y, width, height)` | 6 个数字 | 设置视口偏移，做多屏拼接/分屏渲染 |
| `updateProjectionMatrix()` | — | 改 fov/aspect/near/far/zoom 后调用 |

```js
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// 窗口变化时
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix(); // 必须！
  renderer.setSize(innerWidth, innerHeight);
});
```

::: tip 大白话时间
`fov` 是垂直方向能看多少度。数值越大，画面越「广角」，物体显得越小，边缘越容易变形。

产品展示常用 35~45（不变形），游戏常用 60~75（视野开阔），鱼眼效果用 90+。
:::

::: warning 注意
`near` 和 `far` 的比值别超过约 10000:1，否则深度缓冲精度不够，会出现 z-fighting（表面闪烁）。`near=0.1, far=1000` 是安全范围。
:::

## 三、OrthographicCamera（正交相机）

```js
new THREE.OrthographicCamera(left, right, top, bottom, near, far)
```

### 构造参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `left` | `number` | -1 | 左边界 |
| `right` | `number` | 1 | 右边界 |
| `top` | `number` | 1 | 上边界 |
| `bottom` | `number` | -1 | 下边界 |
| `near` | `number` | 0.1 | 近裁剪面 |
| `far` | `number` | 2000 | 远裁剪面 |

### 特有属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `left` / `right` / `top` / `bottom` | `number` | 视锥边界 |
| `view` | `object \| null` | 视口偏移 |

```js
const aspect = innerWidth / innerHeight;
const d = 5; // 半高
const camera = new THREE.OrthographicCamera(-d*aspect, d*aspect, d, -d, 0.1, 100);
```

::: tip 大白话时间
正交相机**没有近大远小**——1 米远的球和 10 米远的球看起来一样大。

适合做：建筑图纸、等距视角游戏、2.5D 场景、UI 叠加层。
:::

## 四、CubeCamera（立方体相机）

一次性渲染 6 个方向，生成环境贴图（做反射球常用）。

```js
new THREE.CubeCamera(near, far, renderTarget)
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `near` | `number` | 近裁剪面 |
| `far` | `number` | 远裁剪面 |
| `renderTarget` | `WebGLCubeRenderTarget` | 立方体渲染目标 |

| 方法 | 参数 | 说明 |
|---|---|---|
| `update(renderer, scene)` | `WebGLRenderer, Scene` | 渲染 6 个面到 renderTarget |

```js
const cubeRT = new THREE.WebGLCubeRenderTarget(256);
const cubeCam = new THREE.CubeCamera(0.1, 100, cubeRT);
cubeCam.update(renderer, scene);
ball.material.envMap = cubeRT.texture;
```

## 五、ArrayCamera（相机数组）

用于 VR/多视口，一次渲染多个相机视角。

```js
new THREE.ArrayCamera(cameras)
```

| 属性 | 说明 |
|---|---|
| `cameras` | 子相机数组，每个需设置 `viewport` |
| `isArrayCamera` | `true` |

## 六、相机选择速查

| 需求 | 用哪个 |
|---|---|
| 常规 3D 场景、产品展示 | PerspectiveCamera |
| 建筑图纸、等距游戏、UI | OrthographicCamera |
| 实时反射/环境捕获 | CubeCamera |
| VR、分屏 | ArrayCamera |
