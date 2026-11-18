# API 17 · 音频系统全参考

Three.js 用 Web Audio API 封装了一套 3D 音频系统。

## 什么时候用：快速决策

::: tip 大白话时间
音频系统像一场「现场广播」：`AudioListener` 是听众的耳朵（挂在相机上，全场只要一个），`Audio` 是喇叭里循环的背景音乐（音量恒定、不分方向），`PositionalAudio` 是场景里某个会发声的物体（离得近声大、能听出左右），`AudioAnalyser` 是频谱仪，把声音变成随节拍跳动的柱子。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 背景音乐、UI 音效（不辨方向、音量恒定） | `new Audio(listener)` + `setBuffer` + `setLoop(true)` + `play()` | 别用 `PositionalAudio`——BGM 不该随镜头远近忽大忽小 |
| 3D 游戏里敌人的脚步、爆炸声 | `PositionalAudio(listener)`，`mesh.add(sound)`，设 `setRefDistance(5)`、`setRolloffFactor(1.5)` | 别用 `Audio`——它没有位置衰减和左右声像，听不出声源在哪 |
| 音乐可视化（频谱/波形驱动画面） | `new AudioAnalyser(sound, 32)`，循环里 `getFrequencyData()`（0~255） | 别靠 `Audio.isPlaying` 猜节奏——拿不到频率数据 |
| 控制整体音量 / 单个音效音量 | 全局 `listener.setMasterVolume(0.8)`；单个 `sound.setVolume(0.5)` | 别直接改 `AudioContext.destination`——用封装好的 GainNode 更安全 |
| 让声音随距离更自然地衰减 | `sound.setDistanceModel('inverse')`（默认，最自然），必要时 `setMaxDistance` | 别用 `'linear'` 配超大 maxDistance——远处会突然静音，很突兀 |
| 让声音像从前方某个方向传来 | `sound.setDirectionalCone(inner, outer, outerGain)` | 别指望 `PositionalAudio` 默认就有方向——默认 360° 全向 |

::: warning 一个高频误区
浏览器自动播放策略：不经用户交互，`AudioContext` 处于 `suspended`，声音根本不响。必须在首次点击/按键后调用 `listener.context.resume()` 再 `play()`。另一个坑：加载是异步的，一定要在 `AudioLoader.load` 的 `onLoad` 回调里 `setBuffer()` 之后再 `play()`，否则 buffer 还是空的，会报错或没声。
:::

## 一、AudioListener（音频监听器）

相当于「玩家的耳朵」，一个场景只需一个。

```js
const listener = new THREE.AudioListener();
camera.add(listener); // 通常挂在相机上
```

| 属性/方法 | 说明 |
|---|---|
| `context` | AudioContext 对象 |
| `gain` | 主音量 GainNode |
| `timeDelta` | 时间增量 |
| `setMasterVolume(value)` | 设置主音量 0~1 |
| `getMasterVolume()` | 读取主音量 |

::: warning 注意
浏览器要求**用户交互后才能播放音频**。首次播放前需要用户点击页面，否则 AudioContext 处于 suspended 状态。可以调用 `listener.context.resume()`。
:::

## 二、Audio（普通音频）

非空间音频，音量恒定。

```js
const sound = new THREE.Audio(listener);
new THREE.AudioLoader().load('sound.mp3', buffer => {
  sound.setBuffer(buffer);
  sound.play();
});
```

| 属性 | 说明 |
|---|---|
| `buffer` | AudioBuffer |
| `isPlaying` | 是否播放中 |
| `hasPlaybackControl` | `true` |
| `sourceType` | `'audio'` |

| 方法 | 说明 |
|---|---|
| `setBuffer(buffer)` | 设置音频缓冲 |
| `play(delay)` | 播放（延迟秒数） |
| `pause()` / `resume()` / `stop()` | 暂停/继续/停止 |
| `setVolume(value)` / `getVolume()` | 音量 |
| `setLoop(value)` / `getLoop()` | 循环 |
| `setPlaybackRate(value)` / `getPlaybackRate()` | 播放速率 |
| `isPlaying` | 状态查询 |

## 三、PositionalAudio（空间音频）

带 3D 位置感——离得近音量大，有左右声像。

```js
const sound = new THREE.PositionalAudio(listener);
sound.setRefDistance(1);
sound.setDistanceModel('inverse');
mesh.add(sound);
sound.play();
```

在 Audio 基础上增加：

| 方法 | 默认值 | 说明 |
|---|---|---|
| `setRefDistance(value)` | `1` | 参考距离（这个距离内音量不衰减） |
| `getRefDistance()` | — | 读取 |
| `setRolloffFactor(value)` | `1` | 衰减速度 |
| `setDistanceModel(value)` | `'inverse'` | 衰减模型：`'linear'` / `'inverse'` / `'exponential'` |
| `setMaxDistance(value)` | `10000` | 最大距离（linear 模型有效） |
| `setDirectionalCone(inner, outer, outerGain)` | `360,360,0` | 定向声音锥（角度） |
| `getPanner()` | — | PannerNode |

衰减模型：

| 模型 | 说明 |
|---|---|
| `linear` | 线性衰减，到 maxDistance 为 0 |
| `inverse` | 反比衰减（默认，最自然）：`refDistance / (refDistance + rolloff*(d-refDistance))` |
| `exponential` | 指数衰减：`pow(d/refDistance, -rolloff)` |

## 四、AudioAnalyser（音频分析）

做音乐可视化（频谱、波形）。

```js
const analyser = new THREE.AudioAnalyser(sound, 32); // 32 = fftSize/2

renderer.setAnimationLoop(() => {
  const data = analyser.getFrequencyData(); // Uint8Array，0~255
  // 用 data 驱动柱状图、缩放等
});
```

| 属性/方法 | 说明 |
|---|---|
| `fftSize` | FFT 大小（2 的幂，32~2048） |
| `analyser` | AnalyserNode |
| `data` | 频域数据数组 |
| `getFrequencyData()` | 频域数据（0~255） |
| `getAverageFrequency()` | 平均频率值 |

## 五、AudioLoader

```js
new THREE.AudioLoader().load(url, onLoad, onProgress, onError);
```

继承 Loader，`onLoad` 回调收到 `AudioBuffer`。

## 六、音频播放模板

```js
const listener = new THREE.AudioListener();
camera.add(listener);

// 背景音乐（非空间）
const bgm = new THREE.Audio(listener);
new THREE.AudioLoader().load('bgm.mp3', buffer => {
  bgm.setBuffer(buffer);
  bgm.setLoop(true);
  bgm.setVolume(0.5);
  bgm.play(); // 需在用户交互后
});

// 3D 音效
const sfx = new THREE.PositionalAudio(listener);
new THREE.AudioLoader().load('explosion.mp3', buffer => {
  sfx.setBuffer(buffer);
  sfx.setRefDistance(5);
  sfx.setRolloffFactor(1.5);
  sfx.play();
});
explosionMesh.add(sfx);
```
