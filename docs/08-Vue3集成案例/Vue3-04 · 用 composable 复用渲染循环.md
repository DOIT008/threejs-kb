# Vue3-04：用 composable 复用渲染循环

::: tip 大白话时间
前几篇每写一个组件，都要把"搭台、绑 resize、开循环、销毁时拆干净"抄一遍，抄三遍还行，抄十遍人得疯。composable 就是把这套流程录成一段"标准操作视频"，谁要开 3D 摊子，喊一声 useThree() 就全自动搞定。
核心一句：把重复的初始化和清理打包成一个函数，调用方只管拿现成的场景往里塞东西。
只要两个以上组件都要各自的 3D 画面，就该把这套流程抽出来。
:::

::: tip 效果长啥样
表面上是两个一模一样的旋转立方体，但这次我们不再把初始化/清理代码复制两遍，而是抽出一个 `useThree()` composable。以后任何组件想要 3D 场景，只要一行 `const { scene, camera } = useThree(containerRef)` 就够了。
:::

## 为什么需要 composable

前面案例 01~03，每个组件都在重复写同样的东西：创建场景/相机/渲染器、绑定 resize、动画循环、`onUnmounted` 里四大清理。复制粘贴三次还行，十次就是灾难。

Vue3 的 **composable**（组合式函数）就是把这一坨逻辑打包成一个函数，谁需要谁调用。这也是 Vue3 对比 Vue2 最大的进步之一。

## 文件 1：`src/composables/useThree.js`

```js
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

/**
 * 一个开箱即用的 Three.js 场景
 * @param {Ref} containerRef 装 canvas 的容器元素的 ref
 */
export function useThree(containerRef, options = {}) {
  const { background = 0x101018, cameraZ = 5 } = options

  const scene    = shallowRef(null)
  const camera   = shallowRef(null)
  const renderer = shallowRef(null)
  const ready    = ref(false)
  const frameCallbacks = []        // 各组件把自己的每帧回调登记到这里

  // 供外部登记「每帧要干的事」
  const onFrame = fn => frameCallbacks.push(fn)

  onMounted(() => {
    const el = containerRef.value
    const w = el.clientWidth, h = el.clientHeight

    scene.value = new THREE.Scene()
    scene.value.background = new THREE.Color(background)

    camera.value = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    camera.value.position.z = cameraZ

    renderer.value = new THREE.WebGLRenderer({ antialias: true })
    renderer.value.setSize(w, h)
    el.appendChild(renderer.value.domElement)

    renderer.value.setAnimationLoop(() => {
      frameCallbacks.forEach(fn => fn())       // 先更新各物体
      renderer.value.render(scene.value, camera.value)  // 再统一渲染
    })
    window.addEventListener('resize', onResize)
    ready.value = true
  })

  function onResize() {
    const el = containerRef.value
    if (!el || !renderer.value) return
    const w = el.clientWidth, h = el.clientHeight
    camera.value.aspect = w / h
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(w, h)
  }

  onUnmounted(() => {
    renderer.value?.setAnimationLoop(null)
    window.removeEventListener('resize', onResize)
    scene.value?.traverse(o => {
      o.geometry?.dispose()
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose())
      else o.material?.dispose()
    })
    renderer.value?.dispose()
    renderer.value?.domElement.remove()
  })

  // 提供几个常用便捷方法
  const add = obj => scene.value?.add(obj)
  const remove = obj => scene.value?.remove(obj)

  return { scene, camera, renderer, ready, onFrame, add, remove }
}
```

## 文件 2：`src/components/ReuseScene.vue`（使用方）

```vue
<template>
  <div class="row">
    <div ref="boxA" class="cell"></div>
    <div ref="boxB" class="cell"></div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import * as THREE from 'three'
import { useThree } from '../composables/useThree'

const boxA = ref(null)
const boxB = ref(null)

// 两行代码 = 两个完整的 3D 场景，初始化和清理全包了
const a = useThree(boxA, { background: 0x1a1a2e })
const b = useThree(boxB, { background: 0x2e1a1a, cameraZ: 6 })

// ready 变 true 时（useThree 的 onMounted 跑完），场景已经就绪，再往里加东西
watch(a.ready, v => { if (v) addCube(a) })
watch(b.ready, v => { if (v) addCube(b) })

function addCube(ctx) {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshNormalMaterial()
  )
  ctx.add(cube)
  ctx.onFrame(() => { cube.rotation.x += 0.01; cube.rotation.y += 0.012 })
}
</script>

<style scoped>
.row { display: flex; gap: 12px; }
.cell { flex: 1; height: 300px; }
.cell :deep(canvas) { display: block; }
</style>
```

::: warning 为什么用 watch(ready) 而不是直接调用
`useThree()` 内部是在 `onMounted` 里才把 `scene` 建好的，而 `<script setup>` 顶层代码执行时还没到挂载阶段——那时直接 `a.add(...)` 会因为 `scene` 是 `null` 而静默失败。所以要用 `watch(ready, ...)` 等它变成 `true` 再加东西。这是 composable 封装异步初始化时的通用套路。
:::

::: tip 大白话时间
场景是 onMounted 之后才搭好的，而 setup 顶层代码跑得比那早——你这时候喊"往场景里加东西"，场景还是空的，东西就凭空蒸发了。所以得盯着 ready 这个信号，等它亮绿灯了再动手，这叫"等厨房热好了再下菜"。
:::

## 关键点拆解

::: tip composable 就是「带生命周期的工具函数」
普通工具函数不能写 `onMounted`/`onUnmounted`（会报错），但 composable 可以——因为它只在 `<script setup>` 或 `setup()` 里调用，天然处在组件上下文中。`useThree()` 把生命周期钩子藏在函数内部，调用方完全不用操心初始化和清理，只管拿到 `scene` 往里塞东西。
:::

::: tip 大白话时间
普通工具函数就像临时工——没资格进"组件生命周期"这个房间，你在里头写个 onMounted 它就报错。composable 不一样，它只在 setup 里被调用，天生就站在房间里，所以能把 onMounted/onUnmounted 这些钩子藏在肚子里。调用方啥都不用管，白拿一个配好的场景。
:::

::: tip onFrame 让「行为」和「渲染」解耦
每个物体把自己的每帧动作登记到 `onFrame`，渲染循环统一遍历执行、统一 `render()`。这样做的好处是：**永远只有一个渲染循环**，无论场景里有多少物体。多个渲染循环互相抢 GPU 是新手常见性能杀手。
:::

::: tip 继续扩展这个 composable
- 加轨道控制：`const controls = new OrbitControls(camera.value, renderer.value.domElement)`，在 `onFrame` 里 `controls.update()`。
- 加资源Tracker：把操作过的几何体/材质记录进数组，`onUnmounted` 统一 dispose。
- 加 `useThree()` 的 TS 版本：给返回值标注类型，配合 `shallowRef<THREE.Scene | null>`，开发体验更好。
:::

## 延伸阅读

- [Vue3 数字工厂完整实战](</10-数字孪生与数字工厂/07 · Vue3 数字工厂完整实战>) —— 把本章的 `useThree()` composable 放到真实的产线监控项目里，看它如何承载设备、数据和交互
