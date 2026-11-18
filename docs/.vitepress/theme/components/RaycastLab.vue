<script setup>
/**
 * 射线拾取实验室：鼠标悬停高亮 + 点击选中，右侧实时显示 NDC 坐标，
 * 把「屏幕坐标 → NDC → 射线 → 命中物体」这条链路可视化。
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const showRay = ref(false)
const hitInfo = ref('把鼠标移到物体上')
const ndc = ref({ x: 0, y: 0 })
const { ready, onFrame, clearWorld, getWorld, getScene, getCamera, getRenderer, THREE } = useThreeStage(el, {
  cameraPos: [0, 4, 10],
  background: 0x1a1a2e,
})

let objects = []
let raycaster, pointer, hovered = null, selected = null
let rayLine = null

function build() {
  clearWorld()
  const world = getWorld()
  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2(2, 2) // 初始放在屏幕外
  objects = []
  const palette = [0x42b883, 0x42a5f5, 0xffa726, 0xef5350, 0xab47bc, 0x26c6da]
  for (let i = 0; i < 6; i++) {
    const geo = i % 2 ? new THREE.SphereGeometry(0.9, 32, 24) : new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: palette[i], roughness: 0.35, metalness: 0.3 }))
    m.position.set((i % 3 - 1) * 2.6, i < 3 ? 0.9 : -1.1, Math.floor(i / 3) * -1.5)
    m.userData.label = `物体 #${i + 1}`
    m.castShadow = true
    world.add(m)
    objects.push(m)
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), new THREE.MeshStandardMaterial({ color: 0x222b3a, roughness: 1 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -2
  floor.receiveShadow = true
  world.add(floor)

  rayLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: 0xffff00 })
  )
  rayLine.visible = false
  getScene().add(rayLine)
}

// 屏幕坐标 → NDC（-1~1），这是拾取最关键的一步
function updatePointer(e) {
  const canvas = getRenderer().domElement
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  ndc.value = { x: pointer.x, y: pointer.y }
}

function onMove(e) {
  if (!raycaster) return
  updatePointer(e)
  raycaster.setFromCamera(pointer, getCamera())
  const hits = raycaster.intersectObjects(objects, false)
  hovered = hits.length ? hits[0].object : null
  hitInfo.value = hovered ? `悬停：${hovered.userData.label}` : '把鼠标移到物体上'
  // 画射线
  if (showRay.value) {
    const pts = [raycaster.ray.origin.clone(), raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 30)]
    rayLine.geometry.setFromPoints(pts)
    rayLine.visible = true
  } else rayLine.visible = false
}

function onClick(e) {
  if (!raycaster) return
  updatePointer(e)
  raycaster.setFromCamera(pointer, getCamera())
  const hits = raycaster.intersectObjects(objects, false)
  selected = hits.length ? hits[0].object : null
  hitInfo.value = selected ? `已选中：${selected.userData.label}` : '点到了空白处'
}

watch(ready, v => {
  if (!v) return
  build()
  const canvas = getRenderer().domElement
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onClick)
})
watch(showRay, v => { if (rayLine) rayLine.visible = v })

// 卸载时摘事件监听（composable 管不到组件自己绑的）
onBeforeUnmount(() => {
  const canvas = getRenderer()?.domElement
  if (canvas) { canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onClick) }
})

onFrame(({ elapsed }) => {
  objects.forEach((m, i) => {
    if (m !== selected) m.rotation.y = elapsed * 0.4 + i
    const base = m.userData.label === selected?.userData.label ? 1.15 : 1
    m.scale.lerp(new THREE.Vector3(base, base, base), 0.12)
    // 悬停用发光描边的廉价替代：提亮 emissive
    if (m.material.emissive) {
      const target = m === hovered ? 0x222222 : 0x000000
      m.material.emissive.lerp(new THREE.Color(target), 0.15)
    }
  })
})
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">射线拾取实验室</div>
      <p class="demo-panel-hint">鼠标移到方块/球上会高亮，点击选中放大。右侧实时显示换算出的 NDC 坐标。</p>
      <div class="demo-readout">🎯 {{ hitInfo }}</div>
      <div class="demo-readout demo-code">NDC  x = {{ ndc.x.toFixed(3) }}   y = {{ ndc.y.toFixed(3) }}</div>
      <label class="demo-check"><input v-model="showRay" type="checkbox" /> 显示射线（黄色）</label>
      <p class="demo-panel-hint">拾取三步：① 鼠标坐标换算成 NDC（-1~1）→ ② `raycaster.setFromCamera()` 发射射线 → ③ `intersectObjects()` 拿命中列表，第一个就是最前面的物体。</p>
    </div>
  </div>
</template>
