<script setup>
/**
 * 后期辉光实验室：EffectComposer + UnrealBloomPass，
 * 实时调 threshold / strength / radius，理解「为什么我的辉光没效果」。
 */
import { ref, watch } from 'vue'
import { useThreeStage } from '../composables/useThreeStage.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const el = ref(null)
const enabled = ref(true)
const threshold = ref(0.6)
const strength = ref(1.2)
const radius = ref(0.4)
const emissive = ref(2.5)
const { ready, onFrame, onResize, setRenderOverride, clearWorld, getWorld, getScene, getCamera, getRenderer, THREE } = useThreeStage(el, {
  cameraPos: [0, 1, 8],
  background: 0x05060a,
  environment: false,
})

let composer, bloomPass, outputPass, meshes = []

function build() {
  clearWorld()
  const world = getWorld()
  meshes = []
  const geo = new THREE.IcosahedronGeometry(0.7, 1)
  const colors = [0x42b883, 0x42a5f5, 0xff4081, 0xffc107]
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: colors[i], emissive: colors[i], emissiveIntensity: emissive.value, roughness: 0.3,
    }))
    m.position.set((i - 1.5) * 2.2, 0, 0)
    world.add(m)
    meshes.push(m)
  }
  // 一个不发光的暗物体，用来对比「辉光只作用于高亮部分」
  const dark = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.9 }))
  dark.position.set(0, -1.8, 0)
  world.add(dark)

  const renderer = getRenderer()
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(getScene(), getCamera()))
  bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), strength.value, radius.value, threshold.value)
  composer.addPass(bloomPass)
  outputPass = new OutputPass()
  composer.addPass(outputPass)

  onResize((w, h) => { composer.setSize(w, h); bloomPass.setSize(w, h) })
  // 关键：用 composer.render 替换掉默认的 renderer.render，辉光才会生效。
  // 开关只切 bloomPass.enabled，始终走 composer——否则关掉时绕过 OutputPass，
  // 色调映射和 sRGB 转换会缺失，开关前后颜色会跳变。
  setRenderOverride(() => { composer.render() })
  sync()
}

function sync() {
  if (!bloomPass) return
  bloomPass.enabled = enabled.value
  bloomPass.threshold = threshold.value
  bloomPass.strength = strength.value
  bloomPass.radius = radius.value
  meshes.forEach(m => { m.material.emissiveIntensity = emissive.value })
}

watch(ready, v => { if (v) build() })
watch([threshold, strength, radius, emissive, enabled], sync)
onFrame(({ elapsed }) => {
  meshes.forEach((m, i) => { m.rotation.x = elapsed * 0.3; m.rotation.y = elapsed * 0.5 + i })
})
</script>

<template>
  <div class="demo-box">
    <div ref="el" class="demo-canvas"></div>
    <div class="demo-panel">
      <div class="demo-panel-title">后期辉光实验室</div>
      <p class="demo-panel-hint">调 threshold（亮度门槛）看辉光如何「只挑亮的部分发光」；下方暗方块始终不发光，方便对比。</p>
      <label>阈值 threshold <b>{{ threshold.toFixed(2) }}</b><input v-model.number="threshold" type="range" min="0" max="1" step="0.01" /></label>
      <label>强度 strength <b>{{ strength.toFixed(2) }}</b><input v-model.number="strength" type="range" min="0" max="3" step="0.05" /></label>
      <label>半径 radius <b>{{ radius.toFixed(2) }}</b><input v-model.number="radius" type="range" min="0" max="1" step="0.01" /></label>
      <label>自发光强度 <b>{{ emissive.toFixed(1) }}</b><input v-model.number="emissive" type="range" min="0" max="6" step="0.1" /></label>
      <p class="demo-panel-hint">「辉光没效果」九成是阈值太高——物体亮度没过门槛。把 threshold 拉到 0、emissive 拉高就能看到。真实项目里阈值通常 0.6~0.9，只让灯光和屏幕发光。</p>
      <p class="demo-error" v-if="!enabled">辉光已关闭（示例保留开关）</p>
    </div>
  </div>
</template>
