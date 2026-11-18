<script setup>
/**
 * 动画缓动实验室：同一个立方体用不同缓动函数从 A 走到 B，
 * 直观理解「线性 / 缓入缓出 / 回弹 / 弹性」的区别。对应动画循环章节。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const ease = ref('linear')
const duration = ref(2)
const loop = ref(true)
const { ready, onFrame, clearWorld, getWorld, THREE } = useThreeStage(el, {
  cameraPos: [0, 2, 11],
  background: 0x1a1a2e,
  grid: false,
})

let cube, startX = -5, endX = 5
let clock = 0

// 常见缓动函数（t: 0~1）
const fns = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => 1 - (1 - t) * (1 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) },
  elastic: t => {
    if (t === 0 || t === 1) return t
    const p = 0.3
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
  },
  bounce: t => {
    const n = 7.5625, d = 2.75
    if (t < 1 / d) return n * t * t
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
    return n * (t -= 2.625 / d) * t + 0.984375
  },
}
const labels = {
  linear: '线性 linear', easeIn: '缓入 easeIn', easeOut: '缓出 easeOut',
  easeInOut: '缓入缓出 easeInOut', back: '回弹 back', elastic: '弹性 elastic', bounce: '弹跳 bounce',
}

function build() {
  clearWorld()
  const world = getWorld()
  cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x42b883, roughness: 0.3, metalness: 0.4 })
  )
  cube.castShadow = true
  world.add(cube)
  // A / B 两个标记点
  const markerGeo = new THREE.TorusGeometry(0.7, 0.04, 8, 32)
  ;[startX, endX].forEach((x, i) => {
    const m = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: i ? 0xffa726 : 0x42a5f5 }))
    m.position.set(x, -0.58, 0)
    m.rotation.x = Math.PI / 2
    world.add(m)
  })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), new THREE.MeshStandardMaterial({ color: 0x222b3a, roughness: 1 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.6
  floor.receiveShadow = true
  world.add(floor)
  clock = 0
}

watch(ready, v => { if (v) build() })
watch(ease, () => { clock = 0 })

onFrame(({ dt }) => {
  if (!cube) return
  clock += dt
  let t = (clock % duration.value) / duration.value
  if (!loop.value && clock >= duration.value) t = 1
  const k = (fns[ease.value] || fns.linear)(t)
  cube.position.x = startX + (endX - startX) * k
  cube.rotation.x = cube.rotation.y = elapsedRotation(t)
  cube.position.y = Math.abs(Math.sin(t * Math.PI)) * 0.4
})
function elapsedRotation(t) { return t * Math.PI * 2 }
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">动画缓动实验室</div>
      <p class="demo-panel-hint">同一个方块、同样时长，只换缓动函数，运动「手感」完全不同。蓝圈是起点，橙圈是终点。</p>
      <div class="demo-presets">
        <button v-for="(label, key) in labels" :key="key" :class="{ active: ease === key }" @click="ease = key">{{ key }}</button>
      </div>
      <div class="demo-readout">当前：{{ labels[ease] }}</div>
      <label>时长 <b>{{ duration.toFixed(1) }}s</b><input v-model.number="duration" type="range" min="0.5" max="5" step="0.1" /></label>
      <label class="demo-check"><input v-model="loop" type="checkbox" /> 循环播放</label>
      <p class="demo-panel-hint">缓动本质是一个把 0~1 映射成 0~1 的函数。Three.js 的 `Tween`、CSS 的 `transition-timing-function` 都是这个原理。动画循环里用 `t = 已用时间 / 总时长` 算出进度，再丢给缓动函数。</p>
    </div>
  </div>
</template>
