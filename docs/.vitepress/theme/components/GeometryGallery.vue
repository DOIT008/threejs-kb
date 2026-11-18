<script setup>
/**
 * 几何体画廊：一排内置几何体同时旋转，点击可切换「线框/实体」，
 * 对应「API 06 几何体全参考」章节，直观看到每种几何体长啥样。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const wireframe = ref(false)
const spin = ref(true)
const { ready, onFrame, clearWorld, getWorld, THREE } = useThreeStage(el, {
  cameraPos: [0, 1, 9],
  background: 0x1a1a2e,
  fog: false,
})

let meshes = []

function build() {
  clearWorld()
  const world = getWorld()
  meshes = []
  const defs = [
    { g: () => new THREE.BoxGeometry(1.4, 1.4, 1.4), name: 'Box' },
    { g: () => new THREE.SphereGeometry(0.9, 32, 24), name: 'Sphere' },
    { g: () => new THREE.CylinderGeometry(0.7, 0.7, 1.6, 32), name: 'Cylinder' },
    { g: () => new THREE.ConeGeometry(0.85, 1.6, 32), name: 'Cone' },
    { g: () => new THREE.TorusGeometry(0.75, 0.28, 16, 48), name: 'Torus' },
    { g: () => new THREE.TorusKnotGeometry(0.65, 0.22, 96, 16), name: 'TorusKnot' },
    { g: () => new THREE.IcosahedronGeometry(0.95, 0), name: 'Icosahedron' },
    { g: () => new THREE.DodecahedronGeometry(0.95), name: 'Dodecahedron' },
    { g: () => new THREE.OctahedronGeometry(1), name: 'Octahedron' },
  ]
  const palette = [0x42b883, 0x35495e, 0xffcc33, 0x42a5f5, 0xef5350, 0xab47bc, 0x26c6da, 0x8bc34a, 0xffa726]
  const cols = 5
  defs.forEach((d, i) => {
    const mat = new THREE.MeshStandardMaterial({
      color: palette[i % palette.length],
      roughness: 0.35,
      metalness: 0.35,
      wireframe: wireframe.value,
      flatShading: i >= 6,
    })
    const mesh = new THREE.Mesh(d.g(), mat)
    const row = Math.floor(i / cols), col = i % cols
    mesh.position.set((col - (cols - 1) / 2) * 2.2, 1 - row * 2.3, 0)
    mesh.userData.baseY = mesh.position.y
    mesh.userData.phase = i * 0.5
    mesh.castShadow = true
    world.add(mesh)
    meshes.push(mesh)
  })
}

watch(ready, (v) => { if (v) build() })
watch(wireframe, (v) => { meshes.forEach((m) => { m.material.wireframe = v }) })
onFrame(({ elapsed }) => {
  if (!spin.value) return
  meshes.forEach((m) => {
    m.rotation.y = elapsed * 0.5 + m.userData.phase
    m.rotation.x = elapsed * 0.2
    m.position.y = m.userData.baseY + Math.sin(elapsed * 1.5 + m.userData.phase) * 0.12
  })
})
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas demo-canvas-tall"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">内置几何体画廊</div>
      <p class="demo-panel-hint">九个常用几何体一起转。鼠标拖动可换角度看，滚轮缩放。</p>
      <label class="demo-check"><input v-model="wireframe" type="checkbox" /> 线框模式（看顶点结构）</label>
      <label class="demo-check"><input v-model="spin" type="checkbox" /> 自动旋转</label>
      <p class="demo-panel-hint">对应章节：API 06 · 几何体全参考，里面有每个几何体的完整参数表。</p>
    </div>
  </div>
</template>
