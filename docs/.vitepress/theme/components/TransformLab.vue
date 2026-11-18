<script setup>
/**
 * 变换实验室：滑杆实时改 position / rotation / scale，
 * 旁边显示等价代码，把「参数 → 代码 → 画面」三者对上。
 */
import { ref, computed, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const px = ref(0), py = ref(0), pz = ref(0)
const rx = ref(0), ry = ref(0), rz = ref(0)
const scale = ref(1)
const showAxes = ref(true)
const { ready, onFrame, clearWorld, getWorld, getScene, THREE } = useThreeStage(el, {
  cameraPos: [3, 2.5, 5],
  background: 0x1a1a2e,
})

let mesh, axes

const code = computed(() => `mesh.position.set(${px.value}, ${py.value}, ${pz.value})
mesh.rotation.set(${(rx.value * Math.PI / 180).toFixed(2)}, ${(ry.value * Math.PI / 180).toFixed(2)}, ${(rz.value * Math.PI / 180).toFixed(2)})
mesh.scale.setScalar(${scale.value.toFixed(2)})`)

function build() {
  clearWorld()
  const world = getWorld()
  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x42b883, roughness: 0.3, metalness: 0.4 })
  )
  mesh.castShadow = true
  world.add(mesh)
  axes = new THREE.AxesHelper(3)
  getScene().add(axes)
  sync()
}

function sync() {
  if (!mesh) return
  mesh.position.set(px.value, py.value, pz.value)
  mesh.rotation.set(
    rx.value * Math.PI / 180,
    ry.value * Math.PI / 180,
    rz.value * Math.PI / 180
  )
  mesh.scale.setScalar(scale.value)
  if (axes) axes.visible = showAxes.value
}

watch(ready, (v) => { if (v) build() })
watch([px, py, pz, rx, ry, rz, scale, showAxes], sync)

function reset() {
  px.value = py.value = pz.value = 0
  rx.value = ry.value = rz.value = 0
  scale.value = 1
}
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">变换实验室</div>
      <p class="demo-panel-hint">拖下面的滑杆，看位置 / 旋转 / 缩放怎么影响物体。右边是等价代码。</p>
      <div class="demo-grid2">
        <label>位置 X <b>{{ px.toFixed(1) }}</b><input v-model.number="px" type="range" min="-3" max="3" step="0.1" /></label>
        <label>位置 Y <b>{{ py.toFixed(1) }}</b><input v-model.number="py" type="range" min="-3" max="3" step="0.1" /></label>
        <label>位置 Z <b>{{ pz.toFixed(1) }}</b><input v-model.number="pz" type="range" min="-3" max="3" step="0.1" /></label>
        <label>缩放 <b>{{ scale.toFixed(2) }}</b><input v-model.number="scale" type="range" min="0.2" max="2" step="0.01" /></label>
      </div>
      <label>旋转 X <b>{{ rx }}°</b><input v-model.number="rx" type="range" min="0" max="360" step="1" /></label>
      <label>旋转 Y <b>{{ ry }}°</b><input v-model.number="ry" type="range" min="0" max="360" step="1" /></label>
      <label>旋转 Z <b>{{ rz }}°</b><input v-model.number="rz" type="range" min="0" max="360" step="1" /></label>
      <label class="demo-check"><input v-model="showAxes" type="checkbox" /> 显示坐标轴（红X 绿Y 蓝Z）</label>
      <pre class="demo-code">{{ code }}</pre>
      <button class="demo-reset" @click="reset">重置</button>
    </div>
  </div>
</template>
