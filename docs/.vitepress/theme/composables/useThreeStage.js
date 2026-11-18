import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * 通用 3D 舞台 composable
 * ------------------------------------------------------------
 * 关键点：
 * 1. SSR 安全 —— Three.js / WebGL 只在 onMounted 之后初始化，
 *    VitePress 构建时在 Node 端渲染组件也不会碰到 window/document。
 * 2. 渲染循环用 renderer.setAnimationLoop()，符合 r187 新写法。
 * 3. 时间用 performance.now() 自己算，不依赖 Clock/Timer 的导入差异。
 * 4. 卸载时完整 dispose：几何体、材质、贴图、控制器、渲染器、canvas。
 *
 * 组件里这样用：
 *   const el = ref(null)
 *   const { ready, onFrame, clearWorld, getWorld, THREE } = useThreeStage(el, {...})
 *   watch(ready, v => { if (v) build() })   // ready 后才拿到 scene
 *   onFrame(({ dt, elapsed }) => { ... })    // 注册每帧任务
 */
export function useThreeStage(containerRef, options = {}) {
  const {
    background = 0x1a1a2e,
    cameraPos = [0, 1.6, 5],
    grid = true,
    gridColor = 0x42b883,
    autoRotate = false,
    environment = true,
    fog = true,
    lights = true,        // 关掉内置三点光，组件自己布光时用（如光照实验室）
    controlCamera = true, // 是否用 OrbitControls 接管相机（相机实验室用固定机位）
  } = options

  const ready = ref(false)
  const stats = ref({ fps: 0 })

  let renderer, scene, camera, controls, resizeObserver, world, envTexture
  let activeCamera = null  // 允许组件替换渲染用相机（透视/正交切换）
  let renderOverride = null // 允许组件替换渲染方式（如 EffectComposer）
  let prevTime = 0, frames = 0, lastFpsTime = 0
  const frameCallbacks = new Set()
  const resizeCallbacks = new Set()

  function onFrame(cb) {
    frameCallbacks.add(cb)
    return () => frameCallbacks.delete(cb)
  }

  function onResize(cb) {
    resizeCallbacks.add(cb)
    return () => resizeCallbacks.delete(cb)
  }

  function setActiveCamera(cam) { activeCamera = cam || null }
  function setRenderOverride(fn) { renderOverride = fn || null }

  function disposeObject(obj) {
    if (!obj || !obj.traverse) return
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        for (const m of mats) {
          for (const key in m) {
            const v = m[key]
            if (v && v.isTexture) v.dispose()
          }
          m.dispose()
        }
      }
    })
  }

  function clearWorld() {
    if (!world) return
    for (const child of [...world.children]) {
      world.remove(child)
      disposeObject(child)
    }
  }

  onMounted(() => {
    const el = containerRef.value
    if (!el) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(background)
    if (fog) scene.fog = new THREE.Fog(background, 14, 34)

    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.set(...cameraPos)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap // r186 起移除了 PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    el.appendChild(renderer.domElement)

    if (controlCamera) {
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.autoRotate = autoRotate
      controls.autoRotateSpeed = 1.2
    }

    // 环境贴图：让金属/PBR 材质有反射，不发黑
    if (environment) {
      const pmrem = new THREE.PMREMGenerator(renderer)
      const envScene = new RoomEnvironment()
      envTexture = pmrem.fromScene(envScene, 0.04).texture
      scene.environment = envTexture
      envScene.dispose?.()
      pmrem.dispose()
    }

    // 三点式布光，开箱即好看（组件自己布光时可关掉）
    if (lights) {
      const hemi = new THREE.HemisphereLight(0xffffff, 0x556677, 1.8)
      scene.add(hemi)
      const key = new THREE.DirectionalLight(0xffffff, 2.4)
      key.position.set(5, 9, 6)
      key.castShadow = true
      key.shadow.mapSize.set(1024, 1024)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x42b883, 1.1)
      rim.position.set(-6, 3, -5)
      scene.add(rim)
    }

    if (grid) {
      const g = new THREE.GridHelper(24, 24, gridColor, 0x445566)
      g.position.y = -1.5
      scene.add(g)
    }

    world = new THREE.Group()
    scene.add(world)

    prevTime = performance.now()
    lastFpsTime = prevTime
    renderer.setAnimationLoop(() => {
      const now = performance.now()
      const dt = Math.min((now - prevTime) / 1000, 0.1)
      prevTime = now
      const timer = { dt, elapsed: now / 1000 }
      for (const cb of frameCallbacks) {
        try { cb(timer) } catch (e) { console.error('[3D demo]', e) }
      }
      controls?.update()
      if (renderOverride) renderOverride({ renderer, scene, camera: activeCamera || camera })
      else renderer.render(scene, activeCamera || camera)
      frames++
      if (now - lastFpsTime >= 1000) {
        stats.value.fps = Math.round((frames * 1000) / (now - lastFpsTime))
        frames = 0
        lastFpsTime = now
      }
    })

    const resize = () => {
      const w = el.clientWidth || 640
      const h = el.clientHeight || 420
      if (camera.isPerspectiveCamera) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      renderer.setSize(w, h, false)
      for (const cb of resizeCallbacks) {
        try { cb(w, h) } catch (e) { console.error('[3D demo resize]', e) }
      }
    }
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(el)
    resize()
    ready.value = true
  })

  onBeforeUnmount(() => {
    frameCallbacks.clear()
    resizeCallbacks.clear()
    resizeObserver?.disconnect()
    renderer?.setAnimationLoop(null)
    controls?.dispose()
    if (scene) {
      disposeObject(scene)
      if (scene.environment) scene.environment = null
    }
    envTexture?.dispose()
    if (renderer) {
      renderer.dispose()
      const c = renderer.domElement
      if (c && c.parentNode) c.parentNode.removeChild(c)
    }
    ready.value = false
  })

  return {
    ready,
    stats,
    onFrame,
    onResize,
    setActiveCamera,
    setRenderOverride,
    clearWorld,
    getWorld: () => world,
    getScene: () => scene,
    getRenderer: () => renderer,
    getCamera: () => camera,
    getControls: () => controls,
    THREE,
  }
}
