# Vue3-05：点击拾取联动 UI

::: tip 大白话时间
Raycaster 就像你手里的一根激光笔：从鼠标位置往 3D 世界里戳出一条光线，戳中哪个球哪个球亮一下。点中之后，把它胸前挂的名牌（userData）撕下来递给 Vue，右边的信息面板就自动写出"红球、红色"。
核心一句：3D 那边只管"戳中谁"，Vue 这边只管"把谁的信息写成字"，中间用 emit 递个纸条就行。
凡是点 3D 物体要在旁边普通网页界面上看详情的，都是这一套。
:::

::: tip 效果长啥样
场景里摆着三个不同颜色的球，鼠标划过会高亮，点中哪个，右侧 Vue 写的「信息面板」就显示它的名字和颜色。3D 里发生的事，实时反映到普通 DOM 界面上——这是 3D 应用最常见的交互模式。
:::

## 核心思路

Three.js 的 `Raycaster`（射线检测器）负责判断「鼠标点到哪个 3D 物体」，拿到结果后用 `emit` 把信息抛给 Vue，Vue 更新响应式变量，界面自动重渲染。**Two way，各司其职**。

## 完整代码（`src/components/PickScene.vue`）

```vue
<template>
  <div class="wrap">
    <div ref="container" class="canvas-box"></div>
    <aside class="panel">
      <h3>物体信息</h3>
      <template v-if="selected">
        <div class="swatch" :style="{ background: selected.color }"></div>
        <p><b>{{ selected.name }}</b></p>
        <p>颜色：{{ selected.color }}</p>
      </template>
      <p v-else class="hint">点一个球看看 👉</p>
    </aside>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref(null)
const selected = ref(null)          // Vue 状态：当前选中的物体信息
const renderer = shallowRef(null)
let scene, camera, balls = [], hovered = null

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

onMounted(() => {
  const w = container.value.clientWidth, h = container.value.clientHeight
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x101018)
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
  camera.position.z = 8

  const data = [
    { name: '红球', color: '#ff5555', x: -2.2 },
    { name: '绿球', color: '#42b883', x: 0 },
    { name: '蓝球', color: '#4499ff', x: 2.2 }
  ]
  data.forEach(d => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshStandardMaterial({ color: d.color, roughness: 0.4 })
    )
    mesh.position.x = d.x
    mesh.userData = { name: d.name, color: d.color }  // 把业务信息挂在物体上
    scene.add(mesh)
    balls.push(mesh)
  })
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(3, 5, 5)
  scene.add(light)

  renderer.value = new THREE.WebGLRenderer({ antialias: true })
  renderer.value.setSize(w, h)
  container.value.appendChild(renderer.value.domElement)
  const canvas = renderer.value.domElement
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onClick)

  renderer.value.setAnimationLoop(() => renderer.value.render(scene, camera))
})

// 屏幕坐标 → 标准设备坐标 (-1~1)
function updateMouse(e) {
  const rect = renderer.value.domElement.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}
function pick() {
  raycaster.setFromCamera(mouse, camera)
  return raycaster.intersectObjects(balls)[0]?.object || null
}
function onMove(e) {
  updateMouse(e)
  const hit = pick()
  if (hit !== hovered) {         // 只在「悬停目标变化」时才改，避免每帧重设
    if (hovered) hovered.material.emissive.set(0x000000)
    hovered = hit
    if (hovered) hovered.material.emissive.set(0x333333)  // 高亮
    renderer.value.domElement.style.cursor = hit ? 'pointer' : 'default'
  }
}
function onClick(e) {
  updateMouse(e)
  const hit = pick()
  if (hit) selected.value = { name: hit.userData.name, color: hit.userData.color }
}

onUnmounted(() => {
  renderer.value.setAnimationLoop(null)
  const canvas = renderer.value.domElement
  canvas.removeEventListener('pointermove', onMove)
  canvas.removeEventListener('pointerdown', onClick)
  scene.traverse(o => {
    o.geometry?.dispose()
    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose())
    else o.material?.dispose()
  })
  renderer.value.dispose()
  canvas.remove()
})
</script>

<style scoped>
.wrap { display: flex; gap: 16px; }
.canvas-box { flex: 1; height: 400px; }
.canvas-box :deep(canvas) { display: block; }
.panel { width: 180px; font: 14px sans-serif; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
.swatch { width: 48px; height: 48px; border-radius: 8px; margin-bottom: 8px; }
.hint { color: #999; }
</style>
```

## 关键点拆解

::: tip userData 是物体的「便利贴」
Three.js 的每个 Object3D 都有一个 `userData` 属性，专门给你挂自定义数据。这里把业务信息 `{ name, color }` 贴在球上，射线击中后直接 `hit.userData.name` 就能读出来，不用另外维护「物体↔数据」的映射表。做交互场景时非常好用。
:::

::: tip 大白话时间
名字、颜色这些业务信息，别另开一张表去记"哪个物体对应哪条数据"——直接在球身上贴张便利贴（userData），射线戳中它，低头一看便利贴就知道是谁。物体和数据绑一块儿，省心，还不会对错人。
:::

::: tip 悬停高亮为什么要判断「变化了才改」
`pointermove` 事件触发极其频繁（每秒上百次）。如果每次都重设材质颜色，纯属浪费。用 `if (hit !== hovered)` 判断只有**目标真的变了**才更新，这是事件处理的性能常识。
:::

::: tip 坐标转换为什么要 getBoundingClientRect
canvas 在页面里的位置不一定是 (0,0)——可能有边距、在 flex 容器里。`e.clientX` 是相对**整个窗口**的，要减去 canvas 的左上角偏移 `rect.left`，再除以 `rect.width` 换算到 -1~1，射线才打得准。忘了这一步，点击位置会整体偏移。
:::

::: tip 大白话时间
鼠标的 clientX 是量给整个浏览器窗口的，可 3D 画布往往不在窗口角落——它有边距、还挤在 flex 里。不减去画布左上角的位置就发射线，等于"照着地图的绝对坐标去点一张挪过位的照片"，肯定戳偏。getBoundingClientRect 就是先把照片摆正。
:::

::: tip 进阶
- 想支持拖拽物体：在 `pointerdown` 命中后记录物体，在 `pointermove` 里用射线和某个平面求交来更新位置。
- 想让高亮更炫：改 `material.emissiveIntensity` 做呼吸，或换 `OutlinePass`（见 API 手册后期处理章）。
:::
