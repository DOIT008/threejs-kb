# Vue3-03：组件化拆分与 provide/inject

::: tip 大白话时间
想象拍一台戏：一个组件是"搭舞台的"（场景、相机、渲染器），另一个是"往台上摆演员的"（立方体）。演员不用一层层托人传话问"舞台在哪儿"，直接在后台挂个内部电话（provide/inject）就能拿到舞台钥匙。
核心一句：搭台的只管搭台，唱戏的只管往台上放自己的角色，全场只用一套灯光和一部摄影机（一个渲染循环）。
场景里物体一多、各自的行为又想复用时，就该这么拆。
:::

::: tip 效果长啥样
场景容器和场景里的物体**分成两个组件**：`SceneCanvas.vue` 负责搭台（场景/相机/渲染器），`SpinningBox.vue` 负责唱戏（一个会转、能点、能换色的立方体）。点立方体会触发事件，父组件收到后在页面上显示「你点了立方体」。
:::

## 文件 1：`src/components/SceneCanvas.vue`（父·搭台）

```vue
<template>
  <div>
    <div ref="container" class="canvas-box">
      <SpinningBox :color="boxColor" @picked="onPicked" />
    </div>
    <p class="log">{{ log }}</p>
  </div>
</template>

<script setup>
import { ref, shallowRef, provide, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import SpinningBox from './SpinningBox.vue'

const container = ref(null)
const boxColor = ref('#42b883')
const log = ref('点一下立方体试试')

// 三个核心对象用 shallowRef 装进「上下文」，传给子孙组件
const scene = shallowRef(null)
const camera = shallowRef(null)
const renderer = shallowRef(null)
const frameCallbacks = []                          // 收集「每帧要做的事」
const onFrame = fn => frameCallbacks.push(fn)
provide('threeCtx', { scene, camera, renderer, onFrame })  // 关键：provide

onMounted(() => {
  const w = container.value.clientWidth, h = container.value.clientHeight
  scene.value = new THREE.Scene()
  scene.value.background = new THREE.Color(0x101018)
  camera.value = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
  camera.value.position.set(0, 0, 5)
  renderer.value = new THREE.WebGLRenderer({ antialias: true })
  renderer.value.setSize(w, h)
  container.value.appendChild(renderer.value.domElement)

  renderer.value.setAnimationLoop(() => {
    frameCallbacks.forEach(fn => fn())      // 先让各子组件更新自己
    renderer.value.render(scene.value, camera.value)  // 再统一画一遍
  })
  window.addEventListener('resize', onResize)
})

function onResize() {
  const w = container.value.clientWidth, h = container.value.clientHeight
  camera.value.aspect = w / h
  camera.value.updateProjectionMatrix()
  renderer.value.setSize(w, h)
}
function onPicked() { log.value = '🎉 你点到立方体了！' }

onUnmounted(() => {
  renderer.value.setAnimationLoop(null)
  window.removeEventListener('resize', onResize)
  scene.value.traverse(o => {
    o.geometry?.dispose()
    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose())
    else o.material?.dispose()
  })
  renderer.value.dispose()
  renderer.value.domElement.remove()
})
</script>

<style scoped>
.canvas-box { width: 100%; height: 400px; position: relative; }
.canvas-box :deep(canvas) { display: block; }
.log { font: 14px sans-serif; color: #42b883; }
</style>
```

## 文件 2：`src/components/SpinningBox.vue`（子·唱戏）

```vue
<template>
  <!-- 这是「逻辑组件」：不渲染 UI，只往父级场景里塞一个物体 -->
  <></>
</template>

<script setup>
import { inject, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const props = defineProps({ color: { type: String, default: '#42b883' } })
const emit = defineEmits(['picked'])
const ctx = inject('threeCtx')       // 关键：inject 拿到父级提供的场景
const mesh = shallowRef(null)
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

onMounted(() => {
  mesh.value = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshStandardMaterial({ color: props.color })
  )
  ctx.scene.value.add(mesh.value)    // 把物体加进父级场景

  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(3, 5, 4)
  ctx.scene.value.add(light)
  ctx.scene.value.add(new THREE.AmbientLight(0xffffff, 0.5))

  // 点击检测（绑在父级的 canvas 上）
  ctx.renderer.value.domElement.addEventListener('pointerdown', onClick)
  // 向父级登记「每帧要干的活」，旋转逻辑自己管，渲染循环交给父级
  ctx.onFrame(() => { if (mesh.value) mesh.value.rotation.y += 0.01 })
})

function onClick(e) {
  const rect = ctx.renderer.value.domElement.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, ctx.camera.value)
  if (raycaster.intersectObject(mesh.value).length) emit('picked')
}

watch(() => props.color, v => mesh.value?.material.color.set(v))

onUnmounted(() => {
  ctx.renderer.value?.domElement.removeEventListener('pointerdown', onClick)
  ctx.scene.value?.remove(mesh.value)
  mesh.value?.geometry.dispose()
  mesh.value?.material.dispose()
})
</script>
```

::: tip onFrame 是「任务登记处」
父组件 provide 了一个 `onFrame(fn)` 函数，子组件把「每帧要做的事」登记进去。父渲染循环统一执行所有登记的任务，再画一遍。这样每个物体各管各的行为，渲染循环却只有一份——比每个组件各开一个渲染循环优雅得多。案例 04 会把这套机制抽成可复用的 composable。
:::

::: tip 大白话时间
别让每个物体都自己开一部渲染循环——那就像一屋子人同时抢一个麦克风，画面打架还费显卡。物体只管登记"我每帧要转一下"，由搭台的那位统一喊"开拍"，一次把全体画完。全场永远只有一部摄影机在转。
:::

## 关键点拆解

::: tip provide/inject 是「直达电梯」
如果场景对象要传给孙组件，一层层 `props` 往下传会很累（父传子、子传孙……）。`provide('threeCtx', {...})` 像在父组件头顶挂了个公告板，任何后代组件用 `inject('threeCtx')` 就能直接拿到，不用管中间隔了几层。这里传的是三个 `shallowRef`，子组件通过 `.value` 访问同一份场景对象。
:::

::: tip 大白话时间
props 传数据是"一层层往下递纸条"，隔了三层就得递三回，中间人还容易把纸条弄丢。provide/inject 像在楼道里贴了张公共告示，任何后代路过都能直接抄走，管你隔了几层。这里抄走的是同一份场景对象，不是复印件。
:::

::: tip props 下去，emit 上来
这是 Vue 组件通信的黄金法则：**数据用 props 往下传，事件用 emit 往上抛**。父组件 `:color="boxColor"` 把颜色传下去；子组件点中立方体后 `emit('picked')` 告诉父组件；父组件 `@picked="onPicked"` 接住并更新页面文字。数据流清晰，单向可控。
:::

::: tip 逻辑组件为什么模板是空的
`SpinningBox` 不渲染任何可见的 Vue 元素，它的职责只是「在 3D 场景里放一个物体」。所以模板写个空标签占位即可，所有逻辑都在 `<script setup>` 里。这种模式在 3D 项目里很常见——组件代表场景中的一个「实体」。
:::

::: tip 什么时候用组件化
- 场景简单（就几个物体）：全塞一个组件里反而省事，别过度设计。
- 物体多、逻辑复杂、需要复用（比如几十个可交互零件）：拆组件 + provide/inject，代码清晰得多。
:::
