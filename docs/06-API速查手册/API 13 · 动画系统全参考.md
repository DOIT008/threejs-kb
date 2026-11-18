# API 13 · 动画系统全参考

## 什么时候用：快速决策

::: tip 大白话时间
把动画系统想成「拍电影」：`KeyframeTrack` 是记着"第几秒摆什么姿势"的分镜表，`AnimationClip` 是把若干分镜表订成的一集剧本，`AnimationAction` 是某个演员按剧本演的这一遍（能淡入淡出、循环），`AnimationMixer` 是推动时间线的放映机；`Timer` 则是场记的秒表，给每一帧提供统一的时间基准。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 播放 GLTF 自带的动画 | `new AnimationMixer(gltf.scene)` + `mixer.clipAction(gltf.animations[0]).play()`，循环里 `mixer.update(dt)` | 别自己逐帧改 `mesh.position`——关键帧里还有骨骼、缩放、材质动画，手写还原不了 |
| 从走路平滑切到跑步 | `walk.fadeOut(0.5)` + `run.reset().setEffectiveWeight(1).fadeIn(0.5).play()` | 别直接 `stop()` 旧的再 `play()` 新的——会瞬间跳变、没有过渡 |
| 播一次就停、停在最后一帧 | `action.setLoop(THREE.LoopOnce, 1)` + `action.clampWhenFinished = true`，监听 `'finished'` | 别用默认 `LoopRepeat`——默认会无限循环 |
| 自己写关键帧（如方块上下弹跳） | `new VectorKeyframeTrack('.position', [0,1,2], [...])` 组成 `AnimationClip` 再交给 mixer | 别用 `Math.sin` 在循环里硬算——关键帧系统自带插值、变速与混合 |
| 动画慢放/倒放 | `mixer.timeScale = 0.5`（慢放）或负数（倒放）；单个动作用 `action.timeScale` | 别改 `Timer` 的 timescale——那会影响所有逻辑，不只是动画 |
| 提供帧率无关的时间增量 | `timer.update(); const dt = Math.min(timer.getDelta(), 0.1)` | 别自己用 `Date.now()` 相减——切后台回来会冒出巨大 delta 导致瞬移 |

::: warning 一个高频误区
`clipAction().play()` 只是把动作"排上队"，真正推进时间靠每帧的 `mixer.update(dt)`——循环里漏了这行，画面会一动不动。另一个高频坑是模板里的 `actions[clip.name]`：`actions` 必须先初始化成 `{}`，若写成 `let actions;` 直接赋值，会抛 `TypeError: Cannot set properties of undefined`。
:::

## 一、Timer（计时器，r183+ 推荐）

```js
const timer = new THREE.Timer();
```

### 属性

| 属性 | 说明 |
|---|---|
| `_delta` | 内部 delta 值（秒） |
| `_elapsed` | 内部累计时间（秒） |

### 方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `update(timestamp)` | `number`（可选） | 每帧调用，更新内部计时；不传参更安全 |
| `getDelta()` | — | 距上一帧的秒数 |
| `getElapsed()` | — | 累计秒数 |
| `getTimescale()` | — | 时间缩放系数 |
| `setTimescale(value)` | `number` | 设置时间缩放（0.5=慢动作，2=快进） |
| `connect(document)` | `Document` | 恢复页面可见性处理（切后台暂停） |
| `disconnect()` | — | 断开 |
| `reset()` | — | 重置 |

```js
const timer = new THREE.Timer();
renderer.setAnimationLoop(() => {
  timer.update();
  const dt = timer.getDelta();
  const t = timer.getElapsed();
  mesh.rotation.y += dt;
  renderer.render(scene, camera);
});
```

::: tip 大白话时间
`Timer` 取代了老版的 `Clock`（r183 起废弃）。核心区别：Timer 需要你**手动调用 `update()`**，然后才能 `getDelta()`。

`delta` 是「这一帧过了多少秒」——乘上它，动画速度就和设备帧率无关了。
:::

::: warning 注意
r186/r187 里，切到后台再回来时，如果给 `update(timestamp)` 传的时间戳早于内部重置时间，可能得到**负的 delta**，导致物体瞬移。解决：调用 `update()` 时**不传参数**，并对 delta 做 clamp：`Math.min(timer.getDelta(), 0.1)`。
:::

## 二、AnimationMixer（动画播放器）

```js
const mixer = new THREE.AnimationMixer(root)
```

| 参数 | 说明 |
|---|---|
| `root` | 动画作用的对象（通常是 GLTF 的 scene） |

### 属性

| 属性 | 默认值 | 说明 |
|---|---|---|
| `time` | `0` | 当前时间（秒） |
| `timeScale` | `1` | 时间缩放（负数=倒放） |
| `root` | — | 根对象 |
| `actions` | `[]` | 所有 AnimationAction |
| `listeners` / `timeBindings` / `propertyBindings` | — | 内部数据 |

### 方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `clipAction(clip, optionalRoot, blendMode)` | `AnimationClip, Object3D, constant` | 获取/创建动作 |
| `existingAction(clip, optionalRoot)` | — | 查找已有动作 |
| `stopAllAction()` | — | 停止所有动作 |
| `update(deltaTime)` | `number` | **每帧调用**，推进动画 |
| `setTime(timeInSeconds)` | `number` | 跳到指定时间 |
| `getRoot()` | — | 返回根对象 |
| `uncacheClip(clip)` / `uncacheRoot(root)` / `uncacheAction(action)` | — | 清除缓存 |
| `addEventListener` 等 | — | 事件：`'finished'` |

```js
mixer.update(delta); // 动画循环里必须有这行
```

## 三、AnimationClip（动画片段）

```js
new THREE.AnimationClip(name, duration, tracks)
```

| 参数 | 说明 |
|---|---|
| `name` | 名字（如 `'walk'`） |
| `duration` | 时长（秒），-1 表示自动计算 |
| `tracks` | `KeyframeTrack[]` 关键帧轨道 |

### 静态/实例方法

| 方法 | 说明 |
|---|---|
| `AnimationClip.parse(json)` | 从 JSON 创建 |
| `AnimationClip.CreateFromMorphTargetSequence(...)` | 从 morph 目标创建 |
| `clip.duration` | 时长 |
| `clip.tracks` | 轨道数组 |
| `clip.name` | 名字 |
| `clip.resetDuration()` | 重算时长 |
| `clip.optimize()` | 优化关键帧 |
| `clip.clone()` | 克隆 |

## 四、AnimationAction（动作实例）

由 `mixer.clipAction()` 返回。

### 属性

| 属性 | 默认值 | 说明 |
|---|---|---|
| `loop` | `LoopRepeat` | 循环模式：`LoopOnce` / `LoopRepeat` / `LoopPingPong` |
| `repetitions` | `Infinity` | 重复次数 |
| `timeScale` | `1` | 播放速度 |
| `weight` | `1` | 混合权重（0~1） |
| `clampWhenFinished` | `false` | 结束后停在最后一帧 |
| `paused` | `false` | 是否暂停 |
| `enabled` | `true` | 是否启用 |
| `time` | `0` | 当前时间 |
| `zeroSlopeAtStart` / `zeroSlopeAtEnd` | `true` | 循环边界平滑 |

### 方法

| 方法 | 说明 |
|---|---|
| `play()` | 播放 |
| `stop()` | 停止并重置 |
| `pause()` / `unpause()` | 暂停/继续 |
| `reset()` | 重置到开始 |
| `setLoop(mode, repetitions)` | 设置循环 |
| `setEffectiveWeight(weight)` | 设置有效权重 |
| `setEffectiveTimeScale(scale)` | 设置有效时间缩放 |
| `fadeIn(duration)` / `fadeOut(duration)` | 淡入/淡出 |
| `crossFadeFrom(action, duration, warp)` | 交叉淡出到另一个动作 |
| `crossFadeTo(action, duration, warp)` | 交叉淡入 |
| `getMixer()` / `getClip()` | 获取 mixer / clip |
| `isRunning()` / `isScheduled()` | 状态查询 |

```js
// 从走路平滑切换到跑步
actions.walk.fadeOut(0.5);
actions.run.reset().setEffectiveWeight(1).fadeIn(0.5).play();
```

## 五、KeyframeTrack（关键帧轨道）

| 子类 | 用途 |
|---|---|
| `VectorKeyframeTrack` | 位置、缩放（Vector3） |
| `QuaternionKeyframeTrack` | 旋转（四元数） |
| `NumberKeyframeTrack` | 数值（如 opacity） |
| `ColorKeyframeTrack` | 颜色 |
| `BooleanKeyframeTrack` | 布尔 |

```js
new THREE.VectorKeyframeTrack('.position', [0, 1, 2], [0,0,0, 1,1,1, 0,0,0]);
```

| 属性 | 说明 |
|---|---|
| `name` | 属性路径，如 `.position`、`.material.opacity`、`.bones[0].position` |
| `times` | 时间点数组 |
| `values` | 值数组 |
| `interpolation` | 插值方式：`InterpolateLinear` / `InterpolateSmooth` / `InterpolateDiscrete` |

| 方法 | 说明 |
|---|---|
| `optimize()` / `clone()` | 优化/克隆 |
| `getMaxTime()` / `getValues()` / `getTimes()` | 读取 |

## 六、PropertyBinding（属性绑定）

负责把轨道数据绑定到对象属性。一般不用手动操作，GLTFLoader 自动生成。

路径语法：`对象名.属性名[索引].子属性`，如 `'mesh.position'`、`'scene.children[0].material.color'`

## 七、AnimationUtils

| 静态方法 | 说明 |
|---|---|
| `AnimationUtils.lerp(a, b, t)` | 插值（支持数字、向量、四元数等） |
| `AnimationUtils.arraySlice(array, begin, end)` | 数组切片 |
| `AnimationUtils.convertArray(array, toType)` | 类型转换 |

## 八、常见动画流程模板

```js
// 1. 加载带动画的模型
let mixer, actions = {}; // 必须先初始化成对象，否则下面 actions[clip.name] 会抛 TypeError
loader.load('model.glb', gltf => {
  mixer = new THREE.AnimationMixer(gltf.scene);
  gltf.animations.forEach(clip => {
    actions[clip.name] = mixer.clipAction(clip);
  });
  if (gltf.animations.length) actions[gltf.animations[0].name].play();
  scene.add(gltf.scene);
});

// 2. 动画循环
renderer.setAnimationLoop(() => {
  timer.update(); // 必须先 update，再 getDelta——否则首帧 delta 恒为 0
  const dt = Math.min(timer.getDelta(), 0.1);
  if (mixer) mixer.update(dt);
  renderer.render(scene, camera);
});
```
