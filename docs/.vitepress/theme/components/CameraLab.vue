<script setup>
/**
 * 相机实验室：透视 vs 正交切换、FOV / near / far / 正交缩放实时调节。
 * 直观看到「透视近大远小、正交没有」以及 near/far 裁切效果。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'

const el = ref(null)
const type = ref('perspective')
const fov = ref(50)
const near = ref(0.1)
const far = ref(60)
const orthoSize = ref(10)
const { ready, onFrame, onResize, setActiveCamera, clearWorld, getWorld, getCamera, THREE } = useThreeStage(el, {
  cameraPos: [10, 6, 14],
  background: 0x1a1a2e,
  controlCamera: false, // 固定机位，专门观察相机参数差异
})

let ortho, boxes = []
let aspect = 1.4

function build() {
  clearWorld()
  const world = getWorld()
  // 一排等间距方块——最能看出透视/正交的区别
  boxes = []
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.3, 1.3),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(i / 9, 0.6, 0.55), roughness: 0.4 })
    )
    m.position.set(-8 + i * 2, 0, 0)
    m.castShadow = true
    world.add(m)
    boxes.push(m)
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 6),
    new THREE.MeshStandardMaterial({ color: 0x222b3a, roughness: 1 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.75
  floor.receiveShadow = true
  world.add(floor)

  ortho = new THREE.OrthographicCamera(-orthoSize.value * aspect, orthoSize.value * aspect, orthoSize.value, -orthoSize.value, near.value, far.value)
  ortho.position.set(10, 6, 14)
  ortho.lookAt(0, 0, 0)
  sync()
}

function sync() {
  const cam = getCamera()
  if (!cam || !ortho) return
  cam.near = near.value
  cam.far = far.value
  cam.fov = fov.value
  cam.updateProjectionMatrix()
  ortho.left = -orthoSize.value * aspect
  ortho.right = orthoSize.value * aspect
  ortho.top = orthoSize.value
  ortho.bottom = -orthoSize.value
  ortho.near = near.value
  ortho.far = far.value
  ortho.updateProjectionMatrix()
  // 两台相机保持同一机位，切换才连续
  ortho.position.copy(cam.position)
  ortho.quaternion.copy(cam.quaternion)
  setActiveCamera(type.value === 'ortho' ? ortho : cam)
}

onResize((w, h) => { aspect = w / h; sync() })
watch(ready, v => { if (v) build() })
watch([type, fov, near, far, orthoSize], sync)
onFrame(({ elapsed }) => { boxes.forEach((m, i) => { m.position.y = Math.sin(elapsed * 1.2 + i * 0.5) * 0.3 }) })
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">相机实验室</div>
      <p class="demo-panel-hint">九个等距方块。切到正交看「近大远小」消失；缩小 far 看远处方块被裁掉。</p>
      <div class="demo-presets">
        <button :class="{ active: type === 'perspective' }" @click="type = 'perspective'">透视相机</button>
        <button :class="{ active: type === 'ortho' }" @click="type = 'ortho'">正交相机</button>
      </div>
      <template v-if="type === 'perspective'">
        <label>视角 FOV <b>{{ fov }}°</b><input v-model.number="fov" type="range" min="15" max="100" step="1" /></label>
        <p class="demo-panel-hint">FOV 越小越像长焦（压缩空间），越大越像广角（夸张透视）。</p>
      </template>
      <template v-else>
        <label>正交视野大小 <b>{{ orthoSize }}</b><input v-model.number="orthoSize" type="range" min="3" max="20" step="0.5" /></label>
        <p class="demo-panel-hint">正交没有 FOV——所有方块一样大，常用于工程图、等距游戏。</p>
      </template>
      <label>near 近裁面 <b>{{ near.toFixed(1) }}</b><input v-model.number="near" type="range" min="0.1" max="8" step="0.1" /></label>
      <label>far 远裁面 <b>{{ far }}</b><input v-model.number="far" type="range" min="5" max="60" step="1" /></label>
      <p class="demo-panel-hint">near 太大 → 贴脸的物体被切；far 太小 → 远处物体消失。两者比值还影响深度精度（z-fighting）。</p>
    </div>
  </div>
</template>
