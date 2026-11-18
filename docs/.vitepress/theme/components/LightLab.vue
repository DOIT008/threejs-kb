<script setup>
/**
 * 光照实验室：环境光 / 平行光 / 点光源独立开关与调参，
 * 直观看到「三种光分别负责什么」，对应 07 光照与阴影章节。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const hemiOn = ref(true)
const hemiIntensity = ref(1.2)
const dirOn = ref(true)
const dirIntensity = ref(2.2)
const dirX = ref(5)
const dirY = ref(8)
const pointOn = ref(false)
const pointIntensity = ref(30)
const shadows = ref(true)
const { ready, onFrame, clearWorld, getScene, getWorld, THREE } = useThreeStage(el, {
  cameraPos: [6, 5, 8],
  background: 0x1a1a2e,
  environment: false, // 关掉环境贴图，才能看清灯光本身的作用
})

let hemi, dir, point, group, meshes = []

function build() {
  clearWorld()
  const scene = getScene()
  const world = getWorld()

  hemi = new THREE.HemisphereLight(0xbfd8ff, 0x36304a, hemiIntensity.value)
  scene.add(hemi)
  dir = new THREE.DirectionalLight(0xffffff, dirIntensity.value)
  dir.position.set(dirX.value, dirY.value, 5)
  dir.castShadow = true
  dir.shadow.mapSize.set(1024, 1024)
  dir.shadow.camera.left = dir.shadow.camera.bottom = -10
  dir.shadow.camera.right = dir.shadow.camera.top = 10
  scene.add(dir)
  point = new THREE.PointLight(0xff7a45, pointIntensity.value, 30)
  point.position.set(-4, 3, 2)
  scene.add(point)

  // 地面 + 几个不同粗糙度的物体，方便观察光照和阴影
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x8892a0, roughness: 0.9 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.2
  floor.receiveShadow = true
  world.add(floor)

  meshes = []
  const specs = [
    { g: () => new THREE.SphereGeometry(1.1, 40, 32), p: [-3, 0, 0], r: 0.15 },
    { g: () => new THREE.SphereGeometry(1.1, 40, 32), p: [0, 0, 0], r: 0.5 },
    { g: () => new THREE.SphereGeometry(1.1, 40, 32), p: [3, 0, 0], r: 0.95 },
  ]
  specs.forEach(s => {
    const m = new THREE.Mesh(s.g(), new THREE.MeshStandardMaterial({ color: 0x42b883, roughness: s.r }))
    m.position.set(...s.p)
    m.castShadow = true
    m.receiveShadow = true
    world.add(m)
    meshes.push(m)
  })
  sync()
}

function sync() {
  if (!hemi) return
  hemi.intensity = hemiOn.value ? hemiIntensity.value : 0
  dir.intensity = dirOn.value ? dirIntensity.value : 0
  dir.position.set(dirX.value, dirY.value, 5)
  dir.castShadow = shadows.value
  point.intensity = pointOn.value ? pointIntensity.value : 0
}

watch(ready, v => { if (v) build() })
watch([hemiOn, hemiIntensity, dirOn, dirIntensity, dirX, dirY, pointOn, pointIntensity, shadows], sync)
onFrame(({ elapsed }) => { meshes.forEach((m, i) => { m.rotation.y = elapsed * 0.3 + i }) })

function preset(kind) {
  if (kind === 'day') { hemiOn.value = true; hemiIntensity.value = 1.6; dirOn.value = true; dirIntensity.value = 2.6; pointOn.value = false }
  if (kind === 'night') { hemiOn.value = true; hemiIntensity.value = 0.25; dirOn.value = false; pointOn.value = true; pointIntensity.value = 40 }
  if (kind === 'studio') { hemiOn.value = true; hemiIntensity.value = 0.8; dirOn.value = true; dirIntensity.value = 2.2; pointOn.value = true; pointIntensity.value = 18 }
}
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">光照实验室</div>
      <p class="demo-panel-hint">三个球粗糙度依次 0.15 / 0.5 / 0.95。开关灯光、拖动滑块，看光怎么塑造立体感。</p>
      <div class="demo-presets">
        <button @click="preset('day')">白昼</button>
        <button @click="preset('night')">夜景</button>
        <button @click="preset('studio')">影棚</button>
      </div>
      <label class="demo-check"><input v-model="hemiOn" type="checkbox" /> 环境光 HemisphereLight</label>
      <label>环境光强度 <b>{{ hemiIntensity.toFixed(2) }}</b><input v-model.number="hemiIntensity" type="range" min="0" max="3" step="0.05" /></label>
      <label class="demo-check"><input v-model="dirOn" type="checkbox" /> 平行光 DirectionalLight（太阳）</label>
      <label>平行光强度 <b>{{ dirIntensity.toFixed(2) }}</b><input v-model.number="dirIntensity" type="range" min="0" max="5" step="0.05" /></label>
      <div class="demo-grid2">
        <label>光源 X <b>{{ dirX }}</b><input v-model.number="dirX" type="range" min="-10" max="10" step="1" /></label>
        <label>光源 Y <b>{{ dirY }}</b><input v-model.number="dirY" type="range" min="1" max="12" step="1" /></label>
      </div>
      <label class="demo-check"><input v-model="pointOn" type="checkbox" /> 点光源 PointLight（暖色）</label>
      <label>点光强度 <b>{{ pointIntensity }}</b><input v-model.number="pointIntensity" type="range" min="0" max="80" step="1" /></label>
      <label class="demo-check"><input v-model="shadows" type="checkbox" /> 开启阴影</label>
    </div>
  </div>
</template>
