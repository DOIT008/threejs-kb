# 案例 13 · 加载 GLTF 模型并播放动画

前面那些案例，物体都是我们用代码「捏」出来的。但真实项目里，人物、汽车、家具这些复杂模型通常是美术同学在 Blender 里做好再导出的。这篇就来打通「外部模型 → 场景 → 播放自带动画」这条链路：加载一个官方机器人模型，用数字键在待机、走路、跳舞、挥手之间切换。

## 一、效果长啥样

灰色地面上站着一个机器人，镜头可以拖拽环绕它。页面顶部有提示文字，按数字键 1/2/3/4，机器人会在「站立待机 / 原地走路 / 跳舞 / 挥手」之间平滑过渡，按空格暂停当前动画。模型自带骨骼动画，不需要我们手写任何关键帧。

```text
        glTF 文件（.glb：几何 + 材质 + 贴图 + 骨骼 + 动画）
                      │
              GLTFLoader.load()
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
   gltf.scene                 gltf.animations[]
   （模型本体）                （一串 AnimationClip）
        │                           │
     加进 scene                 AnimationMixer
                                     │
                              AnimationAction
                                     │
                        每帧 mixer.update(dt)
```

## 二、完整代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>加载 GLTF 模型并播放动画</title>
<style>
  body { margin: 0; overflow: hidden; }
  #hud {
    position: fixed; left: 16px; top: 16px; color: #fff;
    font: 14px/1.7 sans-serif; background: rgba(0,0,0,.55);
    padding: 10px 14px; border-radius: 8px; pointer-events: none;
  }
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.187.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.187.0/examples/jsm/"
  }
}
</script>
</head>
<body>
<div id="hud">模型加载中…</div>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a24);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;   // r187 推荐用这个阴影类型
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 2));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(3, 6, 4);
key.castShadow = true;
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x333344 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;

let mixer = null;
let actions = [];
let names = [];
let current = 0;
const hud = document.getElementById('hud');

function showHud() {
  hud.innerHTML = `当前动画：<b>${names[current]}</b><br>数字键 1~${names.length} 切换，空格暂停`;
}

new GLTFLoader().load(
  'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  gltf => {
    const robot = gltf.scene;
    robot.scale.setScalar(0.5);
    robot.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    scene.add(robot);

    // 只挑模型里确实存在的动画，避免找不到名字时报错
    names = ['Idle', 'Walking', 'Dance', 'Wave']
      .filter(n => gltf.animations.some(c => c.name === n));

    mixer = new THREE.AnimationMixer(robot);
    actions = names.map(n =>
      mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, n))
    );
    actions[current].play();
    showHud();
  },
  e => {
    if (e.lengthComputable) {
      hud.textContent = `加载中 ${Math.round(e.loaded / e.total * 100)}%`;
    }
  },
  err => {
    hud.textContent = '加载失败，请检查网络';
    console.error(err);
  }
);

addEventListener('keydown', e => {
  if (!actions.length) return;
  const n = Number(e.key);
  if (n >= 1 && n <= actions.length) {
    const next = n - 1;
    actions[current].fadeOut(0.3);
    actions[next].reset().fadeIn(0.3).play();
    current = next;
    showHud();
  }
  if (e.code === 'Space') {
    e.preventDefault();
    actions[current].paused = !actions[current].paused;
  }
});

let last = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (mixer) mixer.update(dt);
  controls.update();
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
</script>
</body>
</html>
```

## 三、关键点拆解

::: tip 大白话时间
glTF 是「3D 模型界的 JPEG」，`.glb` 是把几何体、材质、贴图、骨骼、动画统统打包进一个二进制文件的格式。加载完以后你会拿到两个宝贝：`gltf.scene` 是能直接塞进场景的模型本体，`gltf.animations` 是模型自带的一段段动画（专业叫法叫 AnimationClip，动画片段）。接下来就轮到 `AnimationMixer` 出场——你可以把它理解成一台**录像机**：Clip 是录像带，Mixer 负责转，而 `AnimationAction` 是「按下播放键后的那一次播放」，能单独暂停、淡入淡出。
:::

::: tip 为什么每帧要 mixer.update(dt)
动画本质上是「按时间查表」：第 0.5 秒手臂抬到哪、第 0.6 秒抬到哪，都写在 Clip 的关键帧里。`mixer.update(dt)` 就是告诉录像机「时间又往前走了 dt 秒，请把所有骨骼摆到对应的姿势」。这里 `dt` 必须用**真实经过的秒数**（`performance.now()` 差值除以 1000），写死 `0.016` 在卡顿或切到后台再回来时动画就会和现实时间脱节。顺手用 `Math.min(..., 0.1)` 封顶，防止切回标签页那一帧 dt 巨大导致跳帧。
:::

::: tip 切换动画为什么要 fadeIn / fadeOut
如果直接 `stop()` 旧动作、`play()` 新动作，角色会从「正在跳舞的姿势」瞬间跳到「站立的初始姿势」，看着像卡带。`fadeOut(0.3)` 让旧动作在 0.3 秒内权重降到 0，`fadeIn(0.3)` 让新动作同时升到 1，两个姿势**加权混合**，过渡就顺滑了。新动作前面加 `reset()` 是把它的播放进度归零，不然第二次切换会从上次停下的地方继续。
:::

::: tip 动画名字不一定叫 Idle
不同模型的 Clip 名字五花八门，写死之前最好先 `console.log(gltf.animations.map(a => a.name))` 看一眼。代码里用 `filter` + `findByName` 做了保护：名字不存在就跳过，避免把 `undefined` 传给 `clipAction` 导致白屏。这个「先确认再使用」的习惯在加载外部资源时特别重要。
:::

## 四、改着玩

- 把模型 URL 换成 `https://threejs.org/examples/models/gltf/Soldier.glb`，名字数组改成 `['Idle', 'Walk', 'Run']`，就变成士兵待机/行走/奔跑。
- `robot.scale.setScalar(0.5)` 改成 `1` → 机器人放大一倍，记得把相机 `camera.position.z` 拉远到 `6` 才装得下。
- `fadeOut/fadeIn` 的 `0.3` 改成 `0.05` → 几乎瞬间切换；改成 `1.0` → 慢镜头般的柔和过渡。
- 加一行 `mixer.timeScale = 0.5;` → 整体动画速度减半，配合 `2` 就是快进。
- 把 `actions[current].paused` 的切换逻辑改成 `mixer.timeScale = mixer.timeScale === 0 ? 1 : 0;` → 暂停的是整台录像机。

## 五、用到的 API

| API / 成员 | 本案例的作用 | 手册 |
|---|---|---|
| `GLTFLoader.load()` | 加载并解析 `.glb` 模型 | [API 10 · 纹理与加载器全参考](</06-API速查手册/API 10 · 纹理与加载器全参考>) |
| `gltf.scene` / `Object3D.traverse()` | 拿到模型本体、遍历子节点设置阴影 | [API 02 · Object3D 全参考](</06-API速查手册/API 02 · Object3D 全参考>) |
| `AnimationMixer` / `mixer.update(dt)` | 动画播放器，每帧推进时间 | [API 13 · 动画系统全参考](</06-API速查手册/API 13 · 动画系统全参考>) |
| `AnimationClip.findByName()` | 按名字找动画片段 | [API 13 · 动画系统全参考](</06-API速查手册/API 13 · 动画系统全参考>) |
| `mixer.clipAction()` / `action.play()` | 创建动作实例并播放 | [API 13 · 动画系统全参考](</06-API速查手册/API 13 · 动画系统全参考>) |
| `action.fadeIn()` / `fadeOut()` / `paused` | 平滑切换与暂停 | [API 13 · 动画系统全参考](</06-API速查手册/API 13 · 动画系统全参考>) |
| `OrbitControls` | 鼠标拖拽环绕观察 | [API 14 · 控制器全参考](</06-API速查手册/API 14 · 控制器全参考>) |
| `WebGLRenderer.shadowMap` / `PCFShadowMap` | 开启阴影并设置阴影类型 | [API 05 · WebGLRenderer 全参数](</06-API速查手册/API 05 · WebGLRenderer 全参数>) |
| `DirectionalLight` / `HemisphereLight` | 主光与补光，并投射阴影 | [API 09 · 光照与阴影全参考](</06-API速查手册/API 09 · 光照与阴影全参考>) |
