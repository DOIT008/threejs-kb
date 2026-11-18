# 案例 22 · 后期处理自定义 ShaderPass

前面所有案例都是「画什么就看到什么」。后期处理则是在画面画完之后，把整张图当照片再加工一遍——就像给照片加滤镜。这篇搭一条 `EffectComposer` 流水线：先用 `RenderPass` 把场景拍下来，再用自己写的 `ShaderPass` 加扫描线、RGB 色散和随机故障条纹，最后用 `OutputPass` 正确输出。

## 一、效果长啥样

旋转的金属环面纽结和几颗小球，表面覆盖着细密的 CRT 扫描线。画面会不定时「抽风」：某些水平条带突然横向错位、红蓝通道分离，像老电视信号不良的样子。左下角有滑杆实时调节故障强度，可以切到 0 看干净画面。

```text
   场景 → RenderPass → 自定义 ShaderPass → OutputPass → 屏幕
          （拍照片）    （加扫描线/错位/色散）  （颜色校正）

   流水线里流动的是一张「纹理」：
   上一站的输出自动变成下一站的 tDiffuse uniform
```

## 二、完整代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>后期处理 · 自定义 ShaderPass</title>
<style>
  body { margin: 0; overflow: hidden; }
  #ui {
    position: fixed; left: 16px; bottom: 16px; color: #fff;
    font: 14px/1.8 sans-serif; background: rgba(0,0,0,.55);
    padding: 10px 14px; border-radius: 8px;
  }
  #ui input { vertical-align: middle; }
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
<div id="ui">故障强度 <input id="amt" type="range" min="0" max="2" step="0.01" value="1" width="180"></div>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060c);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 2));
const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(4, 6, 5);
scene.add(light);

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.2, 0.4, 160, 24),
  new THREE.MeshStandardMaterial({ color: 0x4ecdc4, metalness: 0.7, roughness: 0.25 })
);
scene.add(knot);
const dotMat = new THREE.MeshStandardMaterial({
  color: 0xff6b6b, emissive: 0xff3355, emissiveIntensity: 0.5
});
for (let i = 0; i < 5; i++) {
  const a = i / 5 * Math.PI * 2;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), dotMat);
  m.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0);
  scene.add(m);
}

// ---------- 自定义着色器：扫描线 + 故障条带 + RGB 色散 ----------
const GlitchShader = {
  uniforms: {
    tDiffuse:  { value: null },   // ShaderPass 会自动把上一站画面塞进来
    time:      { value: 0 },
    intensity: { value: 1 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      // 把画面横切成 28 条，每条随机决定要不要错位
      float band = floor(uv.y * 28.0);
      float noise = rand(vec2(band, floor(time * 10.0)));
      float glitch = step(0.88, noise) * intensity;
      uv.x += (noise - 0.5) * 0.15 * glitch;

      // RGB 三通道分开采样 → 色散（红蓝边缘分离）
      float sep = 0.008 * glitch + 0.0012 * intensity;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + vec2(sep, 0.0)).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - vec2(sep, 0.0)).b;

      // CRT 扫描线：按 y 高频正弦压暗
      float scan = sin(uv.y * 900.0 + time * 8.0) * 0.035;
      col -= scan;

      // 暗角：边缘渐暗，更有屏幕味
      float vig = 1.0 - smoothstep(0.25, 1.1, length(vUv - 0.5));
      col *= vig;

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const glitchPass = new ShaderPass(GlitchShader);
composer.addPass(glitchPass);
composer.addPass(new OutputPass());             // r152+ 颜色管理，必须放最后

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
document.getElementById('amt').addEventListener('input', e => {
  glitchPass.uniforms.intensity.value = Number(e.target.value);
});

let last = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  knot.rotation.x += dt * 0.4;
  knot.rotation.y += dt * 0.7;
  glitchPass.uniforms.time.value = now / 1000;
  controls.update();
  composer.render();                             // 用 composer 代替 renderer.render
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
</script>
</body>
</html>
```

## 三、关键点拆解

::: tip 大白话时间
后期处理就是把「渲染结果」当一张照片，再进行二次加工。`EffectComposer` 是一条**流水线**：`RenderPass` 先把 3D 场景拍成一张纹理，然后每个 `ShaderPass` 拿上一站的纹理做加工，加工结果传给下一站，最后 `OutputPass` 把成品送到屏幕。你可以像叠滤镜一样随便加 Pass——发光、模糊、描边、色差，都能串起来。本案例只加了一个自定义 Pass，但它已经能干「故障艺术」的活了。
:::

::: tip ShaderPass 的两个约定
自定义 Pass 只要提供一个符合约定的对象：① `uniforms` 里必须有 `tDiffuse`，`ShaderPass` 会自动把上一站的输出纹理塞给它；② 顶点着色器要把 `uv` 传给片元着色器的 `vUv`，这样你才知道当前像素在画面上的位置。剩下的工作 `ShaderPass` 全包了——它内部用一个铺满屏幕的四边形跑你的片元着色器，每个像素执行一次，把结果写进新纹理。
:::

::: tip 故障效果是怎么「编」出来的
`rand(vec2)` 是 GLSL 里的伪随机函数：`sin(点积)×大数` 再取小数部分，得到 0~1 的伪随机数。我们把画面按 y 切成 28 条横带，每条用 `rand(条号, 时间片)` 决定要不要错位——`step(0.88, noise)` 表示只有 12% 的条带会抽风。`uv.x += ...` 把这些条带的采样坐标横向挪动，画面就撕裂了。红蓝通道分别用 `uv±sep` 采样再拼回 `col.r/col.b`，就是色散。扫描线则是 `sin(uv.y*900)` 的高频明暗条纹。
:::

::: tip OutputPass 不能省
从 r152 起 Three.js 改用新的颜色管理：场景内部在线性空间计算，输出到屏幕前要转到 sRGB。`OutputPass` 就是干这个的（顺带做色调映射）。把它放在流水线最后，颜色才和不用后期处理时一致。漏掉它，画面往往会明显偏暗或偏灰。同理，开了后期处理后要用 `composer.render()` 替换 `renderer.render()`，并且窗口尺寸变化时 `composer.setSize()` 也要跟着调用。
:::

::: tip Pass 越多越贵
每加一个 Pass，就多一次「全屏四边形绘制 + 读写一张纹理」。在 4K 屏或手机上，串五六个 Pass 很容易掉帧。优化手段：`setPixelRatio(Math.min(devicePixelRatio, 2))` 限制超采样、合并功能到一个 shader 里（本案例就把三种效果塞进一个 Pass）、不需要时用 `pass.enabled = false` 暂时关掉。
:::

## 四、改着玩

- 滑杆 `max="2"` 改成 `max="5"` → 故障可以暴力到几乎看不清画面。
- `step(0.88, noise)` 改成 `step(0.97, noise)` → 故障变成稀有的偶尔一闪；改成 `step(0.5, noise)` → 持续抽风。
- `uv.y * 28.0` 改成 `uv.y * 120.0` → 条带变细，像磁带雪花；改成 `8.0` → 大块撕裂。
- `sin(uv.y * 900.0)` 的 `900` 改成 `300` → 扫描线更粗；改成 `2000` → 细到几乎看不见。
- 想做「老电视绿屏」：在最后加 `col = vec3(col.g * 0.8 + col.r * 0.2);` → 单色磷光效果。
- 在 `composer` 里再加一个 `UnrealBloomPass` 放在 `glitchPass` 之前 → 先泛光再故障，赛博朋克味更浓。

## 五、用到的 API

| API / 成员 | 本案例的作用 | 手册 |
|---|---|---|
| `EffectComposer` / `.addPass()` / `.render()` | 后期处理流水线与渲染入口 | [API 16 · 后期处理全参考](</06-API速查手册/API 16 · 后期处理全参考>) |
| `RenderPass` | 把场景渲染成初始纹理 | [API 16 · 后期处理全参考](</06-API速查手册/API 16 · 后期处理全参考>) |
| `ShaderPass` / `tDiffuse` | 承载自定义着色器的 Pass | [API 16 · 后期处理全参考](</06-API速查手册/API 16 · 后期处理全参考>) |
| `OutputPass` | 最终颜色空间转换与色调映射 | [API 16 · 后期处理全参考](</06-API速查手册/API 16 · 后期处理全参考>) |
| `WebGLRenderer.setPixelRatio()` / `composer.setSize()` | 像素比与窗口自适应 | [API 05 · WebGLRenderer 全参数](</06-API速查手册/API 05 · WebGLRenderer 全参数>) |
| `TorusKnotGeometry` / `SphereGeometry` | 主体与装饰球 | [API 06 · 几何体全参考](</06-API速查手册/API 06 · 几何体全参考>) |
| `MeshStandardMaterial` / `metalness` / `emissive` | 金属主体与自发光小球 | [API 08 · PBR 与特殊材质](</06-API速查手册/API 08 · PBR 与特殊材质>) |
| `OrbitControls` | 拖拽观察（与主渲染共用相机） | [API 14 · 控制器全参考](</06-API速查手册/API 14 · 控制器全参考>) |
