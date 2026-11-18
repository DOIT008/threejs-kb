# Vue3-06：用 Pinia 管理场景状态

::: tip 大白话时间
控件在 A 组件、画布在 B 组件、信息面板在 C 组件，仨人互相不认识，怎么同步？Pinia 就像办公室墙上那块公共白板——谁都能上去写"改红色、转速 2"，谁都能抬头看。不用再一层层传纸条（props/emit），抬头看板就行。
核心一句：白板上只写"纯数据便签"（颜色字符串、数字、开关），绝不把 3D 机器本身搬上去——那玩意儿一被登记就变形失效。
中大型应用里控件和画布分了家的，基本都靠它。
:::

::: tip 效果长啥样
左侧一个组件放控制面板（改颜色、改转速、切换形状），右侧另一个组件显示 3D 画面。两个组件互不认识，却通过 Pinia 这个「共享小仓库」保持同步——你在左边点，右边立刻变。这是中大型 3D 应用的标配架构。
:::

## 为什么需要 Pinia

案例 02 里控件和画布写在一个组件，用 `watch` 直接连就行。但当控件在 A 组件、画布在 B 组件、信息面板在 C 组件时，`props`/`emit` 传来传去会很痛苦。**Pinia** 是 Vue3 官方状态管理库，把这些共享配置放进一个全局 store，谁需要谁读。

::: warning 还是那条铁律
Pinia store 里**只放普通配置**（颜色字符串、数字、布尔值），不要放 Three.js 对象！`THREE.Mesh`、`THREE.Scene` 一旦被 Pinia 的响应式包装，照样出事。3D 对象留在组件内用 `shallowRef` 管。
:::

::: tip 大白话时间
Pinia 会把放进白板的东西里里外外都"登记造册"（响应式代理）。纯数据（颜色字符串、数字）登记了没事；可你要是把 THREE.Mesh 这种精密机器塞进去，被它一登记就认不出原样了。所以白板上只许贴便签，机器留在组件里用 shallowRef 单独藏着。
:::

## 文件 1：`src/stores/scene.js`

```js
import { defineStore } from 'pinia'

export const useSceneStore = defineStore('scene', {
  state: () => ({
    color: '#42b883',    // 颜色
    speed: 1,            // 转速
    shape: 'box',        // 'box' | 'sphere' | 'torus'
    visible: true        // 显示/隐藏
  }),
  actions: {
    setColor(c) { this.color = c },
    reset() { this.$reset() }        // Pinia 内置：恢复初始值
  }
})
```

## 文件 2：`src/components/ControlPanel.vue`（控制方）

```vue
<template>
  <div class="panel">
    <h3>控制面板</h3>
    <label>颜色 <input type="color" :value="store.color" @input="store.setColor($event.target.value)"></label>
    <label>转速 <input type="range" v-model.number="store.speed" min="0" max="4" step="0.1"></label>
    <label>形状
      <select v-model="store.shape">
        <option value="box">立方体</option>
        <option value="sphere">球</option>
        <option value="torus">圆环</option>
      </select>
    </label>
    <label><input type="checkbox" v-model="store.visible"> 显示物体</label>
    <button @click="store.reset()">重置</button>
  </div>
</template>

<script setup>
import { useSceneStore } from '../stores/scene'
const store = useSceneStore()   // 直接拿到全局 store，不用 provide/inject
</script>

<style scoped>
.panel { font: 14px sans-serif; display: flex; flex-direction: column; gap: 10px; }
.panel label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
</style>
```

## 文件 3：`src/components/SceneView.vue`（显示方）

```vue
<template>
  <div ref="container" class="canvas-box"></div>
</template>

<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { storeToRefs } from 'pinia'
import { useSceneStore } from '../stores/scene'

const store = useSceneStore()
const { color, speed, shape, visible } = storeToRefs(store)  // 解构后仍是响应式

const container = ref(null)
let scene, camera, renderer, mesh, angle = 0, lastTime = 0

const geometries = {
  box:    () => new THREE.BoxGeometry(1.8, 1.8, 1.8),
  sphere: () => new THREE.SphereGeometry(1.2, 48, 32),
  torus:  () => new THREE.TorusGeometry(1.1, 0.45, 32, 100)
}

onMounted(() => {
  const w = container.value.clientWidth, h = container.value.clientHeight
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x101018)
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
  camera.position.z = 5

  mesh = new THREE.Mesh(
    geometries[shape.value](),
    new THREE.MeshStandardMaterial({ color: color.value, roughness: 0.35 })
  )
  scene.add(mesh)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(3, 5, 4)
  scene.add(light)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  container.value.appendChild(renderer.domElement)

  renderer.setAnimationLoop((time) => {
    const dt = Math.min((time - lastTime) / 1000, 0.05)
    lastTime = time
    angle += dt * speed.value
    mesh.rotation.y = angle
    renderer.render(scene, camera)
  })
  window.addEventListener('resize', onResize)
})

// —— store 变化 → 更新 3D ——
watch(color, v => mesh?.material.color.set(v))
watch(visible, v => { if (mesh) mesh.visible = v })
watch(shape, v => {
  if (!mesh) return
  mesh.geometry.dispose()              // 换几何体：先释放旧的！
  mesh.geometry = geometries[v]()
})

function onResize() {
  const w = container.value.clientWidth, h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onUnmounted(() => {
  renderer.setAnimationLoop(null)
  window.removeEventListener('resize', onResize)
  scene.traverse(o => {
    o.geometry?.dispose()
    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose())
    else o.material?.dispose()
  })
  renderer.dispose()
  renderer.domElement.remove()
})
</script>

<style scoped>
.canvas-box { width: 100%; height: 400px; }
.canvas-box :deep(canvas) { display: block; }
</style>
```

## 关键点拆解

::: tip storeToRefs 是「保持连接的解构」
直接 `const { color } = store` 会把值取出来，丢失响应式——之后 store.color 变了，这里的 color 不会跟着变。`storeToRefs(store)` 解构出来的是 ref，**保持和 store 的连接**，watch 才能监听得到。这是 Pinia 最常用的辅助函数。
:::

::: tip 大白话时间
直接 `const { color } = store` 抄走的是一个死数值——白板后来改成蓝色，你手里这张旧纸条还是红的。`storeToRefs` 抄走的是一根"对讲机"，白板那头一喊，你这边立刻听见。所以想 watch 变化，就得用它来解构。
:::

::: tip 换几何体必须先 dispose
`watch(shape, ...)` 里换形状时，先 `mesh.geometry.dispose()` 把旧几何体的显存释放，再赋新的。如果不 dispose，每次切形状都泄漏一块显存，来回切几十次显存就爆了。这个习惯从案例 08 就强调过，这里再次印证它有多重要。
:::

::: tip speed  Again，不 watch
`store.speed` 在渲染循环里每帧读 `speed.value` 就行，不用 watch。再次体会那条原则：**连续量直接读，偶尔改的才 watch**。
:::

::: tip 用 Setup Store 写更简洁
Pinia 也支持组合式写法：`defineStore('scene', () => { const color = ref('#42b883'); const speed = ref(1); return { color, speed } })`。习惯了 Vue3 组合式 API 会觉得这种更顺手，两种写法功能等价。
:::
