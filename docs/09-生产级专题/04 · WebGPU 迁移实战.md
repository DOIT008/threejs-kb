# WebGPU 迁移实战

WebGPU 是浏览器的新一代图形接口，比 WebGL 更快、更现代，还能跑**计算着色器（compute shader）**。在 r187 里，Three.js 的 WebGPU 支持已经相对成熟——`WebGPURenderer` 不再是实验品，新项目可以认真考虑了。

最爽的一点是：**它会自动回退到 WebGL2**。也就是说，你写一套 WebGPU 代码，在没有 WebGPU 的浏览器上依然能跑（走 WebGL2 后端）。迁移成本没想象中高。

::: tip 大白话时间
WebGPU 就像给显卡换了一条**更宽、更智能的高速公路**。WebGL 是老路，车多就堵；WebGPU 路更宽还能让 GPU 帮忙干更多活。而 Three.js 的「自动回退」相当于：新路不通时自动导航走老路——用户完全无感。
:::

## 一、WebGLRenderer vs WebGPURenderer

| 对比项 | WebGLRenderer | WebGPURenderer（r187） |
|---|---|---|
| 导入路径 | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| 初始化 | 同步 `new WebGLRenderer()` | 异步，需要 `await renderer.init()` |
| 渲染 | `renderer.render()` | `renderer.render()` 或 `renderAsync()` |
| 材质 | `ShaderMaterial` + 手写 GLSL | 节点材质 + TSL（也可兼容部分传统材质） |
| 着色器语言 | GLSL | TSL（用 JS 拼装，自动转 WGSL/GLSL） |
| 计算着色器 | 不支持 | 支持（compute shader） |
| 回退 | — | 自动回退 WebGL2 |
| 后期处理 | EffectComposer | `PostProcessing` + 节点 pass |
| 动画循环 | `setAnimationLoop` | `setAnimationLoop`（一样） |

## 二、最小迁移步骤

### 2.1 改导入

```js
// 旧
import * as THREE from 'three';

// 新：WebGPU 版本（包含 WebGPURenderer 和节点材质）
import * as THREE from 'three/webgpu';
import { Fn, uniform, positionLocal, color, sin, time, mix, float } from 'three/tsl';
```

### 2.2 创建渲染器（注意 async）

```js
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 关键：WebGPU 初始化是异步的，必须等它完成
await renderer.init();

// 想知道实际用的是哪个后端：
console.log(renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2（回退）');
```

::: danger 警告
**忘记 `await renderer.init()` 是最常见的坑。** 不等待初始化就渲染，会报错或什么都不显示。如果你的代码在模块顶层，可以直接用顶层 `await`；否则包在一个 `async function` 里调用。
:::

### 2.3 渲染循环不用大改

```js
// 和 WebGL 一样，r187 推荐 setAnimationLoop
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera); // 也可以 await renderer.renderAsync(scene, camera)
});
```

## 三、自动回退 WebGL2

WebGPURenderer 默认就会回退，不需要你写额外代码：

```js
// 默认：优先 WebGPU，不支持则自动回退 WebGL2
const renderer = new THREE.WebGPURenderer();

// 强制走 WebGL2（调试对比用）
const renderer2 = new THREE.WebGPURenderer({ forceWebGL: true });
```

| 情况 | 行为 |
|---|---|
| 浏览器支持 WebGPU | 用 WebGPU 后端，性能最佳 |
| 浏览器不支持 WebGPU | 自动回退 WebGL2，画面一致 |
| 想强制测试回退路径 | `new WebGPURenderer({ forceWebGL: true })` |

::: tip 大白话时间
自动回退意味着**你现在就可以迁移**，不用担心用户浏览器不支持。WebGPU 用户吃到性能红利，老浏览器用户看到的画面一模一样——只是后端不同。这就是「渐进增强」。
:::

## 四、TSL 节点材质入门

TSL（Three.js Shading Language）是 r187 主推的着色器写法：**用 JS 拼装，Three.js 自动翻译成 WGSL 或 GLSL**。你不用再手写两套 shader。

### 4.1 核心概念

| 概念 | 作用 | 类比 |
|---|---|---|
| `Fn()` | 把一段 JS 函数变成可复用的节点函数 | 定义一个「着色器函数」 |
| `uniform()` | 从 JS 传给 shader 的可变参数 | 一个「实时可调的旋钮」 |
| `positionLocal` | 顶点的本地坐标 | 每个顶点的「原始位置」 |
| `colorNode` | 材质的颜色输出节点 | 决定「最终是什么颜色」 |
| `positionNode` | 材质的位置输出节点 | 可以「移动顶点」做形变 |
| `time` | 内置时间 uniform | 自动递增的时钟 |
| `vec3/float` | 构造向量/标量节点 | 声明「数据类型」 |

### 4.2 一个会波动的材质

```js
import * as THREE from 'three/webgpu';
import { Fn, uniform, positionLocal, color, sin, time, mix, float } from 'three/tsl';

// 1. 声明可调参数（uniform）
const uTime = uniform(0);
const uColorA = uniform(color(0x42b883));
const uColorB = uniform(color(0xff7b54));

// 2. 创建节点材质
const material = new THREE.MeshBasicNodeMaterial();

// 3. positionNode：让顶点上下起伏（用 Fn 包住，因为里面有变量赋值语句）
material.positionNode = Fn(() => {
  const p = positionLocal.toVar();          // toVar() 创建可修改的变量
  const wave = sin(p.x.mul(4).add(uTime.mul(2))).mul(0.25);
  p.y.addAssign(wave);                       // 修改 y 坐标
  return p;
})();

// 4. colorNode：根据高度在两种颜色间渐变
material.colorNode = mix(
  uColorA,
  uColorB,
  sin(positionLocal.y.mul(3).add(uTime)).mul(0.5).add(0.5)
);

// 5. 循环里更新 uniform 即可，不用重新编译 shader
renderer.setAnimationLoop(() => {
  uTime.value = performance.now() * 0.001; // 秒
  renderer.render(scene, camera);
});
```

::: tip 大白话时间
TSL 里 `uniform` 是「旋钮」，改 `uniform.value` 就能实时改效果，**不用重新编译着色器**——这比手写 GLSL 再传 uniform 直观多了。`Fn` 就是把一段逻辑打包成函数，`toVar()` 表示「我要改这个变量」。
:::

### 4.3 常用节点速查

| 节点 | 作用 |
|---|---|
| `positionLocal` / `positionWorld` | 本地 / 世界坐标 |
| `normalLocal` / `normalWorld` | 法线 |
| `uv()` | UV 坐标 |
| `color()` / `vec3()` / `vec4()` / `float()` | 构造颜色/向量/标量 |
| `sin()` `cos()` `abs()` `pow()` `mix()` `clamp()` | 数学函数 |
| `texture()` | 采样纹理 |
| `normalMap()` | 法线贴图节点 |
| `time` | 内置时间 |
| `Fn()` | 定义节点函数 |
| `uniform()` | 声明 uniform |

## 五、兼容性清单

| 环境 | WebGPU 支持情况 | 回退 WebGL2 |
|---|---|---|
| Chrome / Edge 113+（桌面） | 支持 | ✅ |
| Chrome Android 121+ | 支持 | ✅ |
| Safari（较新版本） | 逐步支持 | ✅ |
| Firefox（较新版本） | 逐步支持 | ✅ |
| 旧版浏览器 / iOS 旧版 | 不支持 | ✅ 自动回退 |

上线前检查：

- [ ] 用 `renderer.backend.isWebGPUBackend` 确认实际后端（可在控制台打印）
- [ ] 在不支持 WebGPU 的浏览器上测过回退路径（或 `forceWebGL: true` 强制测）
- [ ] 自定义 shader 已从 GLSL 迁到 TSL（WebGPU 后端不认 GLSL `ShaderMaterial`）
- [ ] 检查用到了 `compute` 的代码在回退时是否仍可运行
- [ ] 后期处理改用 `PostProcessing`（WebGPU 版）
- [ ] TS 项目安装了 `@webgpu/types` 并在 `tsconfig` 的 `types` 里加入
- [ ] 测过首帧 `await init()` 的等待体验（可加 loading）

::: warning 注意
**WebGPU 后端不支持传统的 `ShaderMaterial`（GLSL）。** 如果你项目里用了自定义 GLSL shader，迁移时必须把它们改写成 TSL 节点材质，或者让这部分物体继续走 WebGL 渲染器（混用两个渲染器较复杂，一般建议全量迁 TSL）。
:::

## 六、完整可运行示例

下面是一个完整的 HTML 文件——一个会上下起伏、颜色随时间渐变的球。把它存成 `index.html`，用 Vite 或任意静态服务器打开即可（不能直接双击 file:// 打开，importmap + 跨域模块需要 http 环境）。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>Three.js r187 WebGPU + TSL 示例</title>
  <style>
    body { margin: 0; overflow: hidden; background: #0f1020; }
    #info {
      position: fixed; top: 12px; left: 12px; color: #fff;
      font: 14px/1.5 sans-serif; z-index: 10;
      background: rgba(0,0,0,.45); padding: 8px 12px; border-radius: 8px;
    }
  </style>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
      "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.webgpu.js",
      "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.tsl.js"
    }
  }
  </script>
</head>
<body>
  <div id="info">初始化中…</div>

  <script type="module">
    import * as THREE from 'three/webgpu';
    import { Fn, uniform, positionLocal, color, sin, time, mix } from 'three/tsl';

    const info = document.getElementById('info');

    // 1. 创建 WebGPURenderer（不支持 WebGPU 时自动回退 WebGL2）
    const renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // 2. 关键：等待异步初始化完成
    await renderer.init();
    const backend = renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2（回退）';
    info.textContent = `当前后端：${backend}（改变窗口大小试试）`;

    // 3. 场景 + 相机
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1020);
    const camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 100
    );
    camera.position.z = 4;

    // 4. TSL 节点材质
    const uColorA = uniform(color(0x42b883));
    const uColorB = uniform(color(0xff7b54));

    const material = new THREE.MeshBasicNodeMaterial();

    // 顶点起伏：用 Fn 包住，因为里面有变量赋值
    material.positionNode = Fn(() => {
      const p = positionLocal.toVar();
      const wave = sin(p.x.mul(4).add(time.mul(2)))
        .mul(sin(p.z.mul(4).add(time.mul(2))))
        .mul(0.3);
      p.y.addAssign(wave);
      return p;
    })();

    // 颜色随时间在两色间渐变
    material.colorNode = mix(
      uColorA,
      uColorB,
      sin(time.mul(0.8)).mul(0.5).add(0.5)
    );

    // 5. 球体（顶点数多一点，起伏才平滑）
    const geometry = new THREE.SphereGeometry(1, 96, 96);
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 6. 响应窗口大小
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 7. 动画循环（time 是内置节点，会自动更新，无需手动赋值）
    renderer.setAnimationLoop(() => {
      sphere.rotation.y += 0.005;
      renderer.render(scene, camera);
    });
  </script>
</body>
</html>
```

::: tip 大白话时间
这个例子里，球面的「波浪起伏」和「颜色渐变」都是 **GPU 上算的**——你没写一行逐顶点的 JS 循环。TSL 把这些逻辑翻译成着色器，GPU 几百万个顶点同时算，快得飞起。这就是节点材质的威力。
:::

## 七、迁移建议

| 项目情况 | 建议 |
|---|---|
| 新项目、用户浏览器较新 | 直接用 WebGPURenderer + TSL |
| 老项目、大量 GLSL ShaderMaterial | 先保持 WebGL，逐步把 shader 迁成 TSL |
| 需要 compute shader（粒子/物理） | 值得为 WebGPU 单独迁移 |
| 兼容性要求极高（含旧 iOS） | 用 WebGPURenderer，靠自动回退兜底 |
| 只是想尝鲜 | 先用 `forceWebGL: true` 跑通，再切真 WebGPU 对比 |

::: tip 大白话时间
不用急着把所有项目一夜之间迁到 WebGPU。**新项目直接用**，**老项目慢慢迁**。反正有自动回退，就算用户暂时走的是 WebGL2，你的代码也是面向未来的——哪天浏览器都支持 WebGPU 了，用户什么都不用做就自动提速了。
:::
