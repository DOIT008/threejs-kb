<script setup>
/**
 * 代码 Playground：编辑 JS，点「运行」立即在当前 3D 舞台里执行。
 * 提供给用户代码的变量：THREE / scene / world / camera / renderer / onFrame
 * 只执行用户自己写的代码，用 new Function 在浏览器端运行（非 SSR 阶段）。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const runtimeFrameCbs = []
const errorMsg = ref('')
const runCount = ref(0)
const { ready, onFrame, clearWorld, getWorld, getScene, getCamera, getRenderer, THREE } = useThreeStage(el, {
  cameraPos: [0, 1, 5],
  background: 0x1a1a2e,
})

const templates = {
  cube: {
    label: '旋转立方体',
    code: `// 可用变量: THREE, scene, world, camera, renderer, onFrame
const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6)
const mat = new THREE.MeshStandardMaterial({
  color: 0x42b883, roughness: 0.3, metalness: 0.4
})
const cube = new THREE.Mesh(geo, mat)
world.add(cube)

onFrame(({ dt }) => {
  cube.rotation.x += dt
  cube.rotation.y += dt * 1.3
})`,
  },
  particles: {
    label: '粒子星空',
    code: `// 生成 2000 个随机点
const N = 2000
const positions = new Float32Array(N * 3)
for (let i = 0; i < N; i++) {
  positions[i*3]   = (Math.random() - 0.5) * 12
  positions[i*3+1] = (Math.random() - 0.5) * 12
  positions[i*3+2] = (Math.random() - 0.5) * 12
}
const geo = new THREE.BufferGeometry()
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
const mat = new THREE.PointsMaterial({ color: 0x42d392, size: 0.06 })
const pts = new THREE.Points(geo, mat)
world.add(pts)

onFrame(({ dt }) => { pts.rotation.y += dt * 0.15 })`,
  },
  wave: {
    label: '顶点波浪',
    code: `// 修改平面顶点做波浪
const geo = new THREE.PlaneGeometry(6, 6, 48, 48)
const mat = new THREE.MeshStandardMaterial({
  color: 0x42b883, wireframe: true, side: THREE.DoubleSide
})
const plane = new THREE.Mesh(geo, mat)
plane.rotation.x = -Math.PI / 2
world.add(plane)

const base = geo.attributes.position.array.slice()
onFrame(({ elapsed }) => {
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = base[i*3], y = base[i*3+1]
    pos.setZ(i, Math.sin(x * 2 + elapsed) * 0.3 * Math.cos(y * 2 + elapsed))
  }
  pos.needsUpdate = true
})`,
  },
}

const activeTemplate = ref('cube')
const code = ref(templates.cube.code)

function loadTemplate(key) {
  activeTemplate.value = key
  code.value = templates[key].code
  if (ready.value) run()
}

function run() {
  if (!ready.value) return
  errorMsg.value = ''
  // 清掉上一次运行产生的每帧回调和物体
  runtimeFrameCbs.length = 0
  clearWorld()
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      'THREE', 'scene', 'world', 'camera', 'renderer', 'onFrame',
      `"use strict";\n${code.value}`
    )
    fn(
      THREE,
      getScene(),
      getWorld(),
      getCamera(),
      getRenderer(),
      (cb) => runtimeFrameCbs.push(cb)
    )
    runCount.value++
  } catch (e) {
    errorMsg.value = String(e && e.message ? e.message : e)
  }
}

// 把用户注册的每帧回调接到舞台循环上（只注册一次）
onFrame((timer) => {
  for (const cb of runtimeFrameCbs) {
    try { cb(timer) } catch (e) { errorMsg.value = String(e && e.message ? e.message : e) }
  }
})

watch(ready, (v) => { if (v) run() })
</script>

<template>
  <div class="demo-box demo-playground">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">代码 playground</div>
      <p class="demo-panel-hint">改代码，点运行，立刻看效果。出错会在下面提示。</p>
      <div class="demo-tpls">
        <button
          v-for="(t, key) in templates"
          :key="key"
          :class="{ active: activeTemplate === key }"
          @click="loadTemplate(key)"
        >{{ t.label }}</button>
      </div>
      <textarea v-model="code" class="demo-editor" spellcheck="false"></textarea>
      <div class="demo-actions">
        <button class="demo-run" @click="run">▶ 运行代码</button>
        <span class="demo-run-count">已运行 {{ runCount }} 次</span>
      </div>
      <p v-if="errorMsg" class="demo-error">✗ {{ errorMsg }}</p>
      <p class="demo-panel-hint">可用变量：THREE / scene / world / camera / renderer / onFrame(fn)</p>
    </div>
  </div>
</template>
