# API 速查总表

写代码时最烦的就是「这玩意儿叫啥来着、参数咋传」。这篇就是把 Three.js 常用的类**按类别塞进一张大表**里：每一类一行，告诉你它干啥、怎么 new、常用方法有哪些、去哪查详细手册。

不用背——用到时回来搜一下就行。

::: tip 大白话时间
这张表就像厨房里的「调料架」。你不用记住每瓶调料的具体配方，只要知道「盐在左边第三格、糖在右边第二格」，做菜时伸手就够得着。
:::

## 一、核心骨架类

| 类 | 作用（大白话） | 构造参数 | 常用方法 / 属性 | 手册链接 |
|---|---|---|---|---|
| `Object3D` | 所有物体的「老祖宗」，提供位置/旋转/缩放和父子关系 | `new THREE.Object3D()` | `.add()` `.remove()` `.position` `.rotation` `.scale` `.visible` `.traverse()` `.lookAt()` | [API 02](</06-API速查手册/API 02 · Object3D 全参考>) |
| `Scene` | 场景，装所有东西的「大盒子」 | `new THREE.Scene()` | `.add()` `.background` `.fog` `.environment` `.traverse()` | [API 03](</06-API速查手册/API 03 · Scene - Group - Layers>) |
| `Group` | 分组容器，把一堆物体「打包」一起动 | `new THREE.Group()` | 同 Object3D，无渲染实体 | [API 03](</06-API速查手册/API 03 · Scene - Group - Layers>) |
| `PerspectiveCamera` | 透视相机，近大远小，最常用的「眼睛」 | `(fov, aspect, near, far)` | `.position` `.lookAt()` `.updateProjectionMatrix()` | [API 04](</06-API速查手册/API 04 · 相机全参考>) |
| `OrthographicCamera` | 正交相机，没有透视，画 2D / 工程图用 | `(left, right, top, bottom, near, far)` | 同上 | [API 04](</06-API速查手册/API 04 · 相机全参考>) |
| `WebGLRenderer` | 渲染器，把 3D 算成 2D 图画到 canvas 上 | `({ antialias, alpha, ... })` | `.setSize()` `.render()` `.setAnimationLoop()` `.dispose()` `.setPixelRatio()` `.shadowMap` `.info` | [API 05](</06-API速查手册/API 05 · WebGLRenderer 全参数>) |

## 二、几何体与网格类

| 类 | 作用（大白话） | 构造参数 | 常用方法 / 属性 | 手册链接 |
|---|---|---|---|---|
| `BufferGeometry` | 几何体基类，存顶点、法线、UV 等数据 | `new THREE.BufferGeometry()` | `.setAttribute()` `.setIndex()` `.computeVertexNormals()` `.dispose()` | [API 06](</06-API速查手册/API 06 · 几何体全参考>) |
| `BoxGeometry` | 立方体 | `(width, height, depth, wSeg, hSeg, dSeg)` | 继承 BufferGeometry | [API 06](</06-API速查手册/API 06 · 几何体全参考>) |
| `SphereGeometry` | 球体 | `(radius, widthSeg, heightSeg, phiStart, phiLength, thetaStart, thetaLength)` | 继承 BufferGeometry | [API 06](</06-API速查手册/API 06 · 几何体全参考>) |
| `PlaneGeometry` | 平面（地板、墙面） | `(width, height, wSeg, hSeg)` | 继承 BufferGeometry | [API 06](</06-API速查手册/API 06 · 几何体全参考>) |
| `CylinderGeometry` | 圆柱 / 圆锥 | `(rTop, rBottom, height, radialSeg, heightSeg)` | 继承 BufferGeometry | [API 06](</06-API速查手册/API 06 · 几何体全参考>) |
| `TorusGeometry` | 圆环（甜甜圈） | `(radius, tube, radialSeg, tubularSeg)` | 继承 BufferGeometry | [API 06](</06-API速查手册/API 06 · 几何体全参考>) |
| `Mesh` | 网格 = 几何体 + 材质，一个能显示的物体 | `(geometry, material)` | `.position` `.material` `.geometry` `.castShadow` `.receiveShadow` | [API 15](</06-API速查手册/API 15 · 物体类型全参考>) |
| `InstancedMesh` | 实例化网格，一次画很多个相同物体，省 draw call | `(geometry, material, count)` | `.setMatrixAt()` `.instanceMatrix` `.setColorAt()` | [API 15](</06-API速查手册/API 15 · 物体类型全参考>) |
| `Line` / `Points` | 线 / 点云 | `(geometry, material)` | 继承 Object3D | [API 15](</06-API速查手册/API 15 · 物体类型全参考>) |
| `LOD` | 多细节层级，远处的物体自动用低模 | `()` | `.addLevel(object, distance)` | [API 15](</06-API速查手册/API 15 · 物体类型全参考>) |

## 三、材质类

| 类 | 作用（大白话） | 构造参数 | 常用属性 | 手册链接 |
|---|---|---|---|---|
| `Material` | 材质基类 | `({ ...params })` | `.color` `.transparent` `.opacity` `.side` `.depthWrite` `.dispose()` | [API 07](</06-API速查手册/API 07 · Material 基类与基础材质>) |
| `MeshBasicMaterial` | 不受光影响，纯色/贴图，最省 | `({ color, map, wireframe })` | `.map` `.wireframe` | [API 07](</06-API速查手册/API 07 · Material 基类与基础材质>) |
| `MeshLambertMaterial` | 便宜的受光材质（逐顶点） | `({ color, map })` | `.emissive` | [API 07](</06-API速查手册/API 07 · Material 基类与基础材质>) |
| `MeshPhongMaterial` | 有高光的受光材质 | `({ color, shininess })` | `.shininess` `.specular` | [API 07](</06-API速查手册/API 07 · Material 基类与基础材质>) |
| `MeshStandardMaterial` | PBR 物理材质，最常用 | `({ color, roughness, metalness })` | `.roughness` `.metalness` `.normalMap` `.envMap` | [API 08](</06-API速查手册/API 08 · PBR 与特殊材质>) |
| `MeshPhysicalMaterial` | Standard 的加强版（清漆、透射） | `({ clearcoat, transmission })` | `.clearcoat` `.transmission` `.ior` | [API 08](</06-API速查手册/API 08 · PBR 与特殊材质>) |
| `ShaderMaterial` | 自己写 GLSL 着色器的材质 | `({ vertexShader, fragmentShader, uniforms })` | `.uniforms` | [14 · 着色器入门](</04-进阶特性/14 · 着色器入门>) |
| `SpriteMaterial` | 永远面向相机的平面（精灵） | `({ map, color })` | `.map` | [API 15](</06-API速查手册/API 15 · 物体类型全参考>) |

## 四、光照类

| 类 | 作用（大白话） | 构造参数 | 常用属性 | 手册链接 |
|---|---|---|---|---|
| `AmbientLight` | 环境光，均匀照亮所有物体，没影子 | `(color, intensity)` | `.intensity` | [API 09](</06-API速查手册/API 09 · 光照与阴影全参考>) |
| `DirectionalLight` | 平行光，像太阳，能投影 | `(color, intensity)` | `.position` `.castShadow` `.shadow.mapSize` | [API 09](</06-API速查手册/API 09 · 光照与阴影全参考>) |
| `PointLight` | 点光，像灯泡，向四面八方照 | `(color, intensity, distance, decay)` | `.distance` `.decay` | [API 09](</06-API速查手册/API 09 · 光照与阴影全参考>) |
| `SpotLight` | 聚光灯，像手电筒，有锥形范围 | `(color, intensity, distance, angle, penumbra, decay)` | `.angle` `.penumbra` `.target` | [API 09](</06-API速查手册/API 09 · 光照与阴影全参考>) |
| `HemisphereLight` | 半球光，天空/地面两种颜色 | `(skyColor, groundColor, intensity)` | `.groundColor` | [API 09](</06-API速查手册/API 09 · 光照与阴影全参考>) |

## 五、纹理与加载器类

| 类 | 作用（大白话） | 构造参数 | 常用方法 / 属性 | 手册链接 |
|---|---|---|---|---|
| `Texture` | 纹理（图片），贴到材质上 | `(image, mapping, wrapS, wrapT, ...)` | `.colorSpace` `.wrapS/T` `.repeat` `.needsUpdate` `.dispose()` | [API 10](</06-API速查手册/API 10 · 纹理与加载器全参考>) |
| `TextureLoader` | 加载图片当纹理 | `()` | `.load(url, onLoad)` | [11 · 纹理贴图](</04-进阶特性/11 · 纹理贴图>) |
| `DataTexture` | 用数组数据造纹理（程序生成） | `(data, w, h, format, type)` | `.needsUpdate` | [API 10](</06-API速查手册/API 10 · 纹理与加载器全参考>) |
| `CubeTexture` | 立方体贴图，做天空盒/环境贴图 | `(images)` | `.mapping` | [API 10](</06-API速查手册/API 10 · 纹理与加载器全参考>) |
| `Loader` | 加载器基类 | `()` | `.load()` `.loadAsync()` `.setPath()` | [API 10](</06-API速查手册/API 10 · 纹理与加载器全参考>) |
| `FileLoader` | 通用文件加载（底层） | `(manager)` | `.load()` | [API 10](</06-API速查手册/API 10 · 纹理与加载器全参考>) |
| `GLTFLoader` | 加载 glTF / GLB 模型 | `(manager)` | `.load(url, onLoad, onProgress, onError)` | [12 · 加载外部模型](</04-进阶特性/12 · 加载外部模型>) |
| `DRACOLoader` | Draco 压缩模型解码 | `()` | `.setDecoderPath()` `.preload()` | [02 · glTF 优化管线](</09-生产级专题/02 · glTF 优化管线>) |
| `KTX2Loader` | 加载 KTX2 压缩纹理 | `(manager)` | `.setTranscoderPath()` `.detectSupport()` | [02 · glTF 优化管线](</09-生产级专题/02 · glTF 优化管线>) |

## 六、数学工具类

| 类 | 作用（大白话） | 构造参数 | 常用方法 | 手册链接 |
|---|---|---|---|---|
| `Vector2` | 二维向量（UV、屏幕坐标） | `(x, y)` | `.set()` `.add()` `.copy()` `.lerp()` | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |
| `Vector3` | 三维向量（位置、方向、法线） | `(x, y, z)` | `.set()` `.add()` `.sub()` `.normalize()` `.distanceTo()` `.lerp()` `.applyMatrix4()` | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |
| `Vector4` | 四维向量（四元数分量、颜色） | `(x, y, z, w)` | 同 Vector3 | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |
| `Euler` | 欧拉角，用三个角表示旋转 | `(x, y, z, order)` | `.set()` `.reorder()` | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |
| `Quaternion` | 四元数，另一种旋转表示，不万向锁 | `(x, y, z, w)` | `.setFromAxisAngle()` `.slerp()` `.multiply()` | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |
| `Matrix4` | 4×4 矩阵，变换的底层表示 | `(...)` 或 `()` | `.makeRotationY()` `.multiply()` `.invert()` `.compose()` | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |
| `Color` | 颜色 | `(r, g, b)` 或 `0xff0000` 或 `'#f00'` | `.setHex()` `.setRGB()` `.lerp()` | [API 01](</06-API速查手册/API 01 · 全局约定与常量>) |
| `Box3` | 包围盒，算物体占的空间范围 | `(min, max)` | `.setFromObject()` `.intersectsBox()` | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |
| `Sphere` | 包围球 | `(center, radius)` | `.intersectsSphere()` | [API 11](</06-API速查手册/API 11 · 数学工具类全参考>) |

## 七、交互与动画类

| 类 | 作用（大白话） | 构造参数 | 常用方法 / 属性 | 手册链接 |
|---|---|---|---|---|
| `Raycaster` | 射线拾取，从相机射一条线看打到谁 | `(origin, direction, near, far)` | `.setFromCamera()` `.intersectObjects()` `.intersectObject()` | [API 12](</06-API速查手册/API 12 · Raycaster 与交互>) |
| `AnimationMixer` | 动画混音器，驱动一个对象的所有动画 | `(root)` | `.clipAction()` `.update(delta)` `.stopAllAction()` | [API 13](</06-API速查手册/API 13 · 动画系统全参考>) |
| `AnimationClip` | 一段动画剪辑（关键帧集合） | `(name, duration, tracks)` | `.tracks` `.duration` | [API 13](</06-API速查手册/API 13 · 动画系统全参考>) |
| `AnimationAction` | 播放一段动画的「遥控器」 | 由 mixer.clipAction() 创建 | `.play()` `.pause()` `.stop()` `.fadeIn()` `.setLoop()` | [API 13](</06-API速查手册/API 13 · 动画系统全参考>) |
| `Timer` | r187 推荐的时间工具（替代废弃的 Clock） | `()` | `.update()` `.getDelta()` `.getElapsed()` | [08 · 动画循环](</03-动画与交互/08 · 动画循环（r187 新写法）>) |
| `OrbitControls` | 鼠标轨道控制器（addon） | `(camera, domElement)` | `.update()` `.enableDamping` `.target` | [API 14](</06-API速查手册/API 14 · 控制器全参考>) |

## 八、渲染增强类（addon）

| 类 | 作用（大白话） | 构造参数 | 常用方法 | 手册链接 |
|---|---|---|---|---|
| `EffectComposer` | 后期处理流水线（addon） | `(renderer)` | `.addPass()` `.render()` `.setSize()` | [API 16](</06-API速查手册/API 16 · 后期处理全参考>) |
| `RenderPass` | 把场景画进流水线的第一站 | `(scene, camera)` | — | [API 16](</06-API速查手册/API 16 · 后期处理全参考>) |
| `UnrealBloomPass` | 泛光/发光效果 | `(resolution, strength, radius, threshold)` | `.strength` `.threshold` | [13 · 后期处理](</04-进阶特性/13 · 后期处理>) |
| `WebGPURenderer` | WebGPU 渲染器（r187 较成熟） | `({ antialias, forceWebGL })` | `.init()` `.setAnimationLoop()` `.renderAsync()` | [04 · WebGPU 迁移实战](</09-生产级专题/04 · WebGPU 迁移实战>) |

## 九、最常用参数速记

记不住全部没关系，下面这几个是天天用的：

| 场景 | 常用写法 |
|---|---|
| 创建透视相机 | `new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)` |
| 颜色设置 | `new THREE.Color(0x42b883)` 或 `'#42b883'` |
| 让物体能投影 | `mesh.castShadow = true; mesh.receiveShadow = true` |
| 开阴影 | `renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap` |
| 动画循环 | `renderer.setAnimationLoop(() => { renderer.render(scene, camera) })` |
| 改尺寸自适应 | 监听 resize → `camera.aspect = w/h` → `camera.updateProjectionMatrix()` → `renderer.setSize()` |
| 清空场景 | `scene.clear()`（资源还要手动 dispose，见[内存管理](</09-生产级专题/01 · 内存管理与泄漏排查>)） |

::: warning 注意
**r187 已废弃写法别再用**：`new THREE.Clock()`（用 `Timer` 或自己算时间）、`PCFSoftShadowMap`（用 `PCFShadowMap`）、`outputEncoding`（用 `outputColorSpace`）、`Geometry`（用 `BufferGeometry`）、`encoding`（用 `colorSpace`）。写新代码时统一用新写法。
:::

::: tip 大白话时间
API 不用背，但也别每次都从零百度。**把这张表收藏**，写项目时「搜索关键词 → 复制构造参数 → 改吧改吧」，效率最高。真正记牢的，是那些你敲过十遍的东西。
:::
