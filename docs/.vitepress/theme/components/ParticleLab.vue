<script setup>
/**
 * 粒子系统实验室：实时调粒子数量/大小/形状/运动模式，
 * 理解 BufferGeometry + Points 以及「逐帧改顶点」的成本。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const count = ref(2000)
const size = ref(0.09)
const mode = ref('galaxy')
const color = ref('#42d392')
const { ready, onFrame, clearWorld, getWorld, THREE } = useThreeStage(el, {
  cameraPos: [0, 6, 14],
  background: 0x0d1117,
  grid: false,
})

let points, geometry, positions, velocities, baseRadii

function build() {
  clearWorld()
  const world = getWorld()
  const n = count.value
  positions = new Float32Array(n * 3)
  velocities = new Float32Array(n)
  baseRadii = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    place(i, true)
  }
  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(color.value),
    size: size.value,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  points = new THREE.Points(geometry, mat)
  world.add(points)
}

function place(i, init = false) {
  const r = Math.random(), a = Math.random() * Math.PI * 2
  const k = i * 3
  if (mode.value === 'galaxy') {
    const radius = 1 + r * 7
    baseRadii[i] = radius
    positions[k] = Math.cos(a) * radius
    positions[k + 1] = (Math.random() - 0.5) * 1.2 * (1 - r * 0.6)
    positions[k + 2] = Math.sin(a) * radius
    velocities[i] = 0.3 + (1 - r) * 0.5
  } else if (mode.value === 'fountain') {
    positions[k] = (Math.random() - 0.5) * 10
    positions[k + 1] = init ? Math.random() * 8 : 0
    positions[k + 2] = (Math.random() - 0.5) * 10
    velocities[i] = 2 + Math.random() * 3
  } else { // sphere
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u), radius = 5
    positions[k] = s * Math.cos(th) * radius
    positions[k + 1] = u * radius
    positions[k + 2] = s * Math.sin(th) * radius
    velocities[i] = 0.2 + Math.random() * 0.4
  }
}

watch(ready, v => { if (v) build() })
watch([count, mode], () => { if (ready.value) build() })
watch(size, v => { if (points) points.material.size = v })
watch(color, v => { if (points) points.material.color.set(v) })

onFrame(({ dt, elapsed }) => {
  if (!points) return
  const pos = geometry.attributes.position
  const n = count.value
  for (let i = 0; i < n; i++) {
    const k = i * 3
    if (mode.value === 'galaxy') {
      const a = Math.atan2(pos.array[k + 2], pos.array[k]) + dt * velocities[i] * 0.4
      const radius = baseRadii[i]
      pos.array[k] = Math.cos(a) * radius
      pos.array[k + 2] = Math.sin(a) * radius
    } else if (mode.value === 'fountain') {
      pos.array[k + 1] += velocities[i] * dt
      if (pos.array[k + 1] > 9) place(i)
    } else {
      const a = dt * velocities[i]
      const x = pos.array[k], z = pos.array[k + 2]
      pos.array[k] = x * Math.cos(a) - z * Math.sin(a)
      pos.array[k + 2] = x * Math.sin(a) + z * Math.cos(a)
    }
  }
  pos.needsUpdate = true
  points.rotation.y = elapsed * 0.05
})
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">粒子系统实验室</div>
      <p class="demo-panel-hint">同一种 Points，换运动模式就成了星空、喷泉、星云。粒子数拉到 2 万试试——这就是 BufferGeometry 的威力。</p>
      <div class="demo-presets">
        <button v-for="m in ['galaxy','fountain','sphere']" :key="m" :class="{ active: mode === m }" @click="mode = m">{{ m === 'galaxy' ? '星系' : m === 'fountain' ? '喷泉' : '球壳' }}</button>
      </div>
      <label>粒子数 <b>{{ count }}</b><input v-model.number="count" type="range" min="500" max="20000" step="500" /></label>
      <label>点大小 <b>{{ size.toFixed(3) }}</b><input v-model.number="size" type="range" min="0.01" max="0.3" step="0.005" /></label>
      <label>颜色 <input v-model="color" type="color" class="demo-color" /></label>
      <p class="demo-panel-hint">粒子本质是一堆顶点：`BufferGeometry` 存位置数组，`PointsMaterial` 决定每个点长啥样。想让它们动，就在每帧改数组里的值并置 `needsUpdate = true`。粒子越多，每帧的计算和上传成本越高——这是性能优化的重点。</p>
    </div>
  </div>
</template>
