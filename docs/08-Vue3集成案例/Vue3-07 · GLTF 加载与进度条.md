# Vue3-07：GLTF 模型加载 + 进度条

::: tip 大白话时间
加载一个 GLTF 模型，跟网购大件家具一个理：顶部那条进度条就是物流跟踪，0% 下单、50% 在途、100% 签收，货送到了才把家具摆进屋（场景）。物流信息（loading / progress / error）全是 Vue 拿来展示的，Three.js 只管把家具摆正、让它转。
核心一句：加载的三个回调分别去改 loading、progress、error 这几个 Vue 变量，界面自己就动起来了。
凡是要从外部加载模型、还得给用户看进度和报错的，照这个来。
:::

::: tip 效果长啥样
页面顶部一条进度条从 0% 走到 100%，加载完成后一个 GLTF 模型出现在场景中并自动旋转。加载状态、进度百分比、错误提示——全是 Vue 的响应式变量驱动，Three.js 只管把模型画出来。
:::

## 准备模型文件

把 `.glb` 模型放到 `public/models/` 下（比如 `public/models/robot.glb`），就能用 `/models/robot.glb` 访问。没有模型的话，可以从 Three.js 官方仓库下载示例模型，或者用在线转换工具把 `.obj` 转成 `.glb`。

::: tip GLB vs GLTF
`.gltf` 常配一个 `.bin` 和贴图文件夹，是多个文件；`.glb` 是把它们**打包成单个二进制文件**，更适合 Web。优先用 `.glb`。
:::

## 完整代码（`src/components/ModelViewer.vue`）

```vue
<template>
  <div class="wrap">
    <div v-if="loading" class="loading">
      <p>加载中... {{ progress }}%</p>
      <div class="bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
    </div>
    <div v-if="error" class="error">加载失败：{{ error }}</div>
    <div ref="container" class="canvas-box"></div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const container = ref(null)
const loading = ref(true)
const progress = ref(0)
const error = ref('')

const renderer = shallowRef(null)
let scene, camera, model, angle = 0, lastTime = 0

onMounted(() => {
  const w = container.value.clientWidth, h = container.value.clientHeight
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.set(0, 1, 4)

  scene.add(new THREE.AmbientLight(0xffffff, 1))
  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(3, 5, 4)
  scene.add(light)

  renderer.value = new THREE.WebGLRenderer({ antialias: true })
  renderer.value.setSize(w, h)
  renderer.value.toneMapping = THREE.ACESFilmicToneMapping
  container.value.appendChild(renderer.value.domElement)

  renderer.value.setAnimationLoop((time) => {
    const dt = Math.min((time - lastTime) / 1000, 0.05)
    lastTime = time
    angle += dt * 0.5
    if (model) model.rotation.y = angle
    renderer.value.render(scene, camera)
  })

  loadModel()
  window.addEventListener('resize', onResize)
})

function loadModel() {
  const loader = new GLTFLoader()
  loader.load(
    '/models/robot.glb',
    (gltf) => {                          // 成功
      model = gltf.scene
      // 自动缩放：把模型归一化到大约 2 个单位高
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const scale = 2 / (size.y || 1)
      model.scale.setScalar(scale)
      // 居中：让模型底部落在 y=0
      box.setFromObject(model)
      model.position.y -= box.min.y
      scene.add(model)
      loading.value = false              // ← Vue 状态更新，进度条消失
    },
    (xhr) => {                           // 进度
      if (xhr.total) progress.value = Math.round(xhr.loaded / xhr.total * 100)
    },
    (err) => {                           // 失败
      error.value = err.message || '未知错误'
      loading.value = false
    }
  )
}

function onResize() {
  const w = container.value.clientWidth, h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.value.setSize(w, h)
}

onUnmounted(() => {
  renderer.value.setAnimationLoop(null)
  window.removeEventListener('resize', onResize)
  scene.traverse(o => {
    o.geometry?.dispose()
    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose())
    else o.material?.dispose()
  })
  renderer.value.dispose()
  renderer.value.domElement.remove()
})
</script>

<style scoped>
.wrap { max-width: 700px; }
.canvas-box { width: 100%; height: 400px; }
.canvas-box :deep(canvas) { display: block; }
.loading { font: 14px sans-serif; margin-bottom: 8px; }
.bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: #42b883; transition: width 0.2s; }
.error { color: #e33; font: 14px sans-serif; }
</style>
```

## 关键点拆解

::: tip 三个回调对应三种状态
`GLTFLoader.load(url, onLoad, onProgress, onError)` 的第三、四个参数常被忽略，但它们正好是驱动 Vue UI 的关键：`onProgress` 里的 `xhr.loaded / xhr.total` 算百分比，`onError` 设置错误信息。把回调里改 Vue 的 `ref`，界面就自动更新了——**Three.js 负责加载，Vue 负责展示进度**。
:::

::: tip 大白话时间
loader.load 后面那三个回调别嫌多：头一个"货到了"，把模型塞进场景、收起进度条；第二个"走到哪了"，算个百分比喂给进度条；第三个"货丢了"，弹出错误。它们干的其实是同一件事——把 3D 世界的进度翻译成 Vue 能显示的字。
:::

::: tip 模型自动居中与缩放
不同来源的模型大小、原点位置千差万别：有的高 0.01，有的高 1000；有的原点在脚底，有的在中心。用 `Box3.setFromObject(model)` 拿到包围盒，算出高度统一缩放到 2 个单位，再把底部对齐到 y=0。这样不管什么模型都能稳稳站在画面中央。
:::

::: tip 大白话时间
网上的模型跟网购衣服一个理，尺寸完全没谱：有的巴掌大（高 0.01），有的两层楼高（高 1000），原点还乱放。用 Box3 先量它到底多大、脚底在哪，统一缩到 2 个单位高、底部贴地——不管什么来路的模型，都能稳稳站在画面正中间。
:::

::: tip 别忘了模型的材质也要 dispose
`scene.traverse()` 会遍历到模型内部的所有 Mesh，所以它们的几何体和材质都会被释放。但如果模型用了贴图，`material.map` 等纹理还需要单独 `texture.dispose()`。严谨的清理函数会遍历材质上的 `map`、`normalMap`、`roughnessMap` 等一一释放。
:::

::: tip 用 useGLTF 风格的 composable 封装
如果项目里多处加载模型，可以把上面的逻辑抽成 `useGLTF(url)` composable，返回 `{ scene, progress, error }`。调用方 `const { scene, progress } = useGLTF('/models/robot.glb')` 即可，加载状态直接绑到模板。
:::
