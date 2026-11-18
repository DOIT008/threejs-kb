import { nextTick } from 'vue'
import DefaultTheme from 'vitepress/theme'

// 首屏动画：DOM 未就绪时等 DOMContentLoaded，已就绪就直接下一帧执行
function renderOnInit(cb) {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', cb, { once: true })
  } else {
    cb()
  }
}
import './custom.css'
import './components.css'
import MaterialLab from './components/MaterialLab.vue'
import GeometryGallery from './components/GeometryGallery.vue'
import TransformLab from './components/TransformLab.vue'
import CodePlayground from './components/CodePlayground.vue'
import LightLab from './components/LightLab.vue'
import CameraLab from './components/CameraLab.vue'
import RaycastLab from './components/RaycastLab.vue'
import EasingLab from './components/EasingLab.vue'
import ParticleLab from './components/ParticleLab.vue'
import BloomLab from './components/BloomLab.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    // 在 Markdown 里直接写组件标签即可嵌入交互演示
    app.component('MaterialLab', MaterialLab)
    app.component('GeometryGallery', GeometryGallery)
    app.component('TransformLab', TransformLab)
    app.component('CodePlayground', CodePlayground)
    app.component('LightLab', LightLab)
    app.component('CameraLab', CameraLab)
    app.component('RaycastLab', RaycastLab)
    app.component('EasingLab', EasingLab)
    app.component('ParticleLab', ParticleLab)
    app.component('BloomLab', BloomLab)

    // 切换章节后给正文区重新挂一次淡入动画。
    // 用 class 移除→强制重排→加回的方式触发，保证连续切换也能每次重播。
    if (typeof window !== 'undefined') {
      const playEnter = () => {
        nextTick(() => {
          const main = document.querySelector('.VPDoc')
          if (!main) return
          main.classList.remove('page-enter')
          void main.offsetWidth // 强制重排，让动画能重新触发
          main.classList.add('page-enter')
        })
      }
      // onAfterRouteChanged 已废弃，用新版 onAfterRouteChange
      router.onAfterRouteChange = playEnter
      // 首屏也播一次（初始加载不经过路由钩子）
      renderOnInit(playEnter)
    }
  },
}
