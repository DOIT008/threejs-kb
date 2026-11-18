<script setup>
/**
 * 材质参数实验室：拖动滑块实时改 roughness / metalness / 颜色，
 * 直观感受 PBR 两大参数。对应「API 08 PBR 材质」章节。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const roughness = ref(0.35)
const metalness = ref(0.6)
const color = ref('#42b883')
const wireframe = ref(false)
const { ready, onFrame, clearWorld, getWorld, THREE } = useThreeStage(el, {
  cameraPos: [0, 0.5, 4.2],
  background: 0x1a1a2e,
})

let mesh, material

function build() {
  clearWorld()
  const world = getWorld()
  material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color.value),
    roughness: roughness.value,
    metalness: metalness.value,
    wireframe: wireframe.value,
  })
  mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.34, 160, 32), material)
  mesh.castShadow = true
  world.add(mesh)
  // 一圈小球，方便观察反射
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.7 })
    )
    s.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0)
    world.add(s)
  }
}

watch(ready, (v) => { if (v) build() })
watch([roughness, metalness, color, wireframe], () => {
  if (!material) return
  material.roughness = roughness.value
  material.metalness = metalness.value
  material.wireframe = wireframe.value
  material.color.set(color.value)
})
onFrame(({ dt }) => { if (mesh) { mesh.rotation.y += dt * 0.4; mesh.rotation.x += dt * 0.15 } })

const presets = [
  { name: '塑料', r: 0.85, m: 0.0, c: '#42b883' },
  { name: '金属', r: 0.15, m: 1.0, c: '#c9d1d9' },
  { name: '陶瓷', r: 0.1, m: 0.1, c: '#ffffff' },
  { name: '黄金', r: 0.25, m: 1.0, c: '#ffcc33' },
]
function applyPreset(p) {
  roughness.value = p.r; metalness.value = p.m; color.value = p.c; wireframe.value = false
}
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">材质实验室</div>
      <p class="demo-panel-hint">拖动滑块，实时看 PBR 两大参数怎么改变质感。</p>
      <label>粗糙度 roughness <b>{{ roughness.toFixed(2) }}</b>
        <input v-model.number="roughness" type="range" min="0" max="1" step="0.01" />
      </label>
      <label>金属度 metalness <b>{{ metalness.toFixed(2) }}</b>
        <input v-model.number="metalness" type="range" min="0" max="1" step="0.01" />
      </label>
      <label>颜色
        <input v-model="color" type="color" class="demo-color" />
      </label>
      <label class="demo-check"><input v-model="wireframe" type="checkbox" /> 线框模式</label>
      <div class="demo-presets">
        <button v-for="p in presets" :key="p.name" @click="applyPreset(p)">{{ p.name }}</button>
      </div>
      <p class="demo-perf">{{ ready ? '渲染中 · GPU 实时绘制' : '初始化中…' }}</p>
    </div>
  </div>
</template>
