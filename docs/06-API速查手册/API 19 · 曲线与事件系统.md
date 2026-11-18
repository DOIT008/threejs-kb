# API 19 · 曲线与事件系统

## 什么时候用：快速决策

::: tip 大白话时间
`Curve` 像「在地图上画一条路线」：`CatmullRomCurve3` 是顺着几个路标连成顺滑曲线（最常用），`getPoint(t)` 按"路标序号的进度"取点（t=0.5 是第 1 段走到第 2 段的中点，**不是**全程一半），`getPointAt(u)` 才按"实际路程的百分比"取点（匀速不忽快忽慢）。`CurvePath` 把几段路拼起来，`Shape` 画一个带洞的平面轮廓再挤出成 3D。而 `EventDispatcher` 像「对讲机」——`addEventListener` 调到一个频道，`dispatchEvent` 按住说话。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 让物体沿路径匀速移动（小车绕赛道） | `CatmullRomCurve3(points)` + `getPointAt(u)`（按弧长、匀速），用 `getTangentAt(u)` 定朝向 | 别用 `getPoint(t)`——t 是参数不是弧长，弯道会忽快忽慢 |
| 生成管道/轨道/绳子 | `curve` + `TubeGeometry(curve, segments, radius, radialSegments, closed)`（内部用 `computeFrenetFrames`） | 别手动算截面——Frenet 标架才能保证管道不扭转 |
| 把多段曲线拼成一条路径 | `CurvePath.add(curve1).add(curve2)`，`closePath()` 闭合 | 别用 `CatmullRomCurve3` 硬连——它只做平滑插值，段与段之间没法精确控制 |
| 画 2D 带洞的徽章/挤出成立体字 | `Shape` + `shape.holes.push(holePath)`，再喂给 `ShapeGeometry` 或 `ExtrudeGeometry` | 别用 `LineLoop` 画轮廓——它没有面和洞，挤不出 3D |
| 物体间解耦通信（点我 → 播动画） | `obj.addEventListener('click', fn)`，内部 `dispatchEvent({ type:'click' })`；或监听 mixer 的 `'finished'` | 别用全局变量互相调用——事件让模块各管各的，更好维护 |
| 移除监听避免内存泄漏 | 用具名函数 `const fn = e => {...}`，移除时 `removeEventListener('click', fn)` | 别传匿名函数——`removeEventListener` 认的是同一个函数引用，匿名函数删不掉 |

::: warning 一个高频误区
一个坑是把 `getPoint(t)` 当匀速用：t 是曲线参数，和弧长不成正比，物体在控制点稀疏处会明显加速/减速——要匀速必须用 `getPointAt(u)`。另一个坑是用 `addEventListener('click', e => {...})` 注册匿名函数，之后 `removeEventListener` 再传一个新的匿名函数根本删不掉，导致回调重复执行、内存泄漏——要保留具名函数的引用。
:::

## 一、Curve（曲线基类）

用于生成路径、管道、运动轨迹。

| 属性/方法 | 说明 |
|---|---|
| `getPoint(t, optionalTarget)` | 取 t 处点（t ∈ [0,1]） |
| `getPointAt(u, optionalTarget)` | 按弧长取点（匀速） |
| `getTangent(t, optionalTarget)` | 取切线 |
| `getTangentAt(u, optionalTarget)` | 按弧长取切线 |
| `getPoints(divisions)` | 取一系列点（默认 12 段） |
| `getSpacedPoints(divisions)` | 等距取点 |
| `getLength()` / `getLengths(divisions)` | 长度 |
| `updateArcLengths()` | 更新弧长表 |
| `getUtoTmapping(u, distance)` | u → t 映射 |
| `computeFrenetFrames(segments, closed)` | 计算 Frenet 标架（管道用） |
| `clone()` / `toJSON()` / `fromJSON()` | 克隆/序列化 |

## 二、曲线子类

### 3D 曲线

```js
new THREE.LineCurve3(v1, v2)                    // 直线
new THREE.QuadraticBezierCurve3(v0, v1, v2)     // 二次贝塞尔
new THREE.CubicBezierCurve3(v0, v1, v2, v3)     // 三次贝塞尔
new THREE.CatmullRomCurve3(points, closed, curveType, tension) // 样条曲线（最常用）
```

| CatmullRomCurve3 参数 | 默认值 | 说明 |
|---|---|---|
| `points` | — | `Vector3[]` 控制点 |
| `closed` | `false` | 是否闭合 |
| `curveType` | `'centripetal'` | `'centripetal'` / `'chordal'` / `'catmullrom'` |
| `tension` | `0.5` | 张力（curveType='catmullrom' 时有效） |

```js
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(5, 3, 0),
  new THREE.Vector3(10, 0, 5)
]);

// 沿曲线放物体
const pt = curve.getPointAt(t);
mesh.position.copy(pt);
mesh.lookAt(curve.getPointAt(t + 0.01)); // 朝向切线方向
```

### 2D 曲线

`LineCurve`、`QuadraticBezierCurve`、`CubicBezierCurve`、`CatmullRomCurve3`（2D 点也行）、`EllipseCurve`、`ArcCurve`

### CurvePath（组合路径）

```js
const path = new THREE.CurvePath();
path.add(curve1);
path.add(curve2);
```

| 方法 | 说明 |
|---|---|
| `add(curve)` | 添加曲线 |
| `getLength()` / `getPoint(t)` / `getSpacedPoints(divisions)` | 同 Curve |
| `closePath()` | 闭合 |

### Shape（2D 形状）

```js
const shape = new THREE.Shape();
shape.moveTo(x, y);
shape.lineTo(x, y);
shape.quadraticCurveTo(cx, cy, x, y);
shape.bezierCurveTo(...);
shape.absarc(x, y, radius, start, end, clockwise);
shape.holes.push(holePath); // 挖洞
```

配合 `ShapeGeometry`（2D）和 `ExtrudeGeometry`（3D 挤出）使用。

**Path 方法**：`moveTo`、`lineTo`、`quadraticCurveTo`、`bezierCurveTo`、`splineThru`、`absarc`、`absellipse`、`arc`、`ellipse`、`closePath`

## 三、EventDispatcher（事件派发器）

很多 Three.js 对象（Object3D、Material、Loader、Controls、Mixer）都继承它。

| 方法 | 说明 |
|---|---|
| `addEventListener(type, listener)` | 注册监听 |
| `hasEventListener(type, listener)` | 是否已注册 |
| `removeEventListener(type, listener)` | 移除监听 |
| `dispatchEvent(event)` | 派发事件 |

事件对象：`{ type, target, ... }`

```js
const onClick = e => console.log('点击了', e.object);
mesh.addEventListener('click', onClick);
mesh.removeEventListener('click', onClick);
```

::: tip 大白话时间
Three.js 的事件系统和 DOM 事件几乎一样——`addEventListener` 注册，`dispatchEvent` 触发。区别是它不依赖 DOM，纯 JavaScript 对象也能用。
:::

## 四、Clock（已废弃，仅作了解）

```js
const clock = new THREE.Clock();
clock.getDelta();       // 距上次调用的时间
clock.getElapsedTime(); // 总时间
clock.start() / stop() / reset();
```

::: warning 注意
`Clock` 自 r183 起废弃，r186/r187 仍可用但有警告。新代码请用 `Timer`（见动画章节）。
:::

## 五、核心 API 速查总表

| 你想做的事 | 用的 API |
|---|---|
| 创建场景 | `new THREE.Scene()` |
| 创建相机 | `new THREE.PerspectiveCamera(...)` |
| 创建渲染器 | `new THREE.WebGLRenderer(...)` |
| 渲染一帧 | `renderer.render(scene, camera)` |
| 动画循环 | `renderer.setAnimationLoop(fn)` |
| 创建立方体 | `new THREE.Mesh(new THREE.BoxGeometry(), material)` |
| 放进场景 | `scene.add(obj)` |
| 改位置/旋转/缩放 | `obj.position/rotation/scale.set(...)` |
| 看向目标 | `obj.lookAt(x,y,z)` |
| 加灯光 | `scene.add(new THREE.DirectionalLight(...))` |
| 开阴影 | `renderer.shadowMap.enabled = true` + `castShadow/receiveShadow` |
| 加载纹理 | `new THREE.TextureLoader().load(url)` |
| 加载模型 | `new THREE.GLTFLoader().load(url, cb)` |
| 鼠标拾取 | `raycaster.setFromCamera()` + `intersectObjects()` |
| 相机控制 | `new OrbitControls(camera, domElement)` |
| 播放动画 | `AnimationMixer.clipAction().play()` + `mixer.update(dt)` |
| 后期处理 | `EffectComposer` + Pass 链 |
| 释放资源 | `geometry.dispose()` / `material.dispose()` / `texture.dispose()` |
| 查性能 | `renderer.info` |
| 查版本 | `THREE.REVISION` |

## 六、内存管理清单

| 资源 | 释放方法 |
|---|---|
| 几何体 | `geometry.dispose()` |
| 材质 | `material.dispose()` |
| 纹理 | `texture.dispose()` |
| 渲染目标 | `renderTarget.dispose()` |
| 控制器 | `controls.dispose()` |
| 渲染器 | `renderer.dispose()` / `forceContextLoss()` |
| 动画混合器 | `mixer.uncacheRoot(root)` |
| 阴影 | `light.shadow.dispose()` |

::: warning 铁律
从场景 `remove()` 物体**不会**释放显存。切换场景/页面时，必须递归遍历并 `dispose()` 所有几何体、材质、纹理，否则显存会一直涨。
:::
