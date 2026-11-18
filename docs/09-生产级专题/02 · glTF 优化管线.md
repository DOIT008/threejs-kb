# glTF 优化管线

一个美术给你的原始模型往往是几十 MB，直接丢到网页上，用户得盯着进度条看半天。生产项目里，模型上线前必须过一遍**优化管线**——就像出厂前的「瘦身流水线」，把体积压到原来的 1/10，画质还几乎不掉。

这篇把 glTF 优化的关键手段（Draco、Meshopt、KTX2、纹理尺寸、gltfpack/gltf-transform 工具）串成一条完整流程，最后给一份可以直接抄的加载器配置。

::: tip 大白话时间
模型优化就是**给行李箱打包**。原始模型像把所有衣服连衣架塞进去；优化后是把衣服卷起来、抽真空——同样的东西，体积大幅变小。Draco 压「形状」，KTX2 压「贴图」，两招组合效果最猛。
:::

## 一、优化手段全景

| 手段 | 压什么 | 典型收益 | 代价 | 适合场景 |
|---|---|---|---|---|
| Draco | 几何体（顶点/索引） | 体积 -50%~-90% | 解码耗时，需解码器 | 顶点多的模型 |
| Meshopt | 几何体 + 动画 | 体积 -30%~-70%，解码快 | 需扩展支持 | 追求解码速度 |
| KTX2 / Basis | 纹理 | 显存 -50%~-75% | 需转码器，转码有耗时 | 贴图多、显存吃紧 |
| 减小纹理尺寸 | 纹理 | 体积/显存 -75%（2048→1024） | 细节略降 | 移动端、小屏 |
| mipmap | 纹理 | 远处更稳、不闪 | 显存 +33% | 几乎所有 3D 场景 |
| gltfpack / gltf-transform | 综合 | 综合 -60%~-90% | 一条命令搞定 | 所有上线的模型 |
| 懒加载 + LOD | 整体 | 首屏加载大幅变快 | 实现稍复杂 | 大场景、多模型 |

## 二、Draco 压缩

Draco 是 Google 出的几何体压缩算法，对顶点数据压缩率极高。

### 2.1 命令行压缩（gltf-transform）

```bash
# 安装 CLI（一次性）
npm install -g @gltf-transform/cli

# 用 Draco 压缩几何体
gltf-transform draco input.glb output.glb

# 或者用 optimize 一键优化（含 Draco）
gltf-transform optimize input.glb output.glb --compress draco
```

### 2.2 加载配置

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
// 解码器文件放在 CDN 或本地 public/draco/ 目录
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
draco.preload(); // 提前加载解码器，减少首次点击等待

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load('model-draco.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

::: warning 注意
解码器文件（wasm + js）要么放 CDN，要么拷贝到项目的 `public/draco/` 下。**路径写错会导致模型加载失败**——这是 Draco 最常见的坑。生产环境建议本地放一份，不依赖外网。
:::

## 三、Meshopt 压缩

Meshopt 是另一套压缩方案，最大优势是**解码快**（比 Draco 快好几倍），对动画压缩也更好。

```bash
# gltfpack 用 Meshopt 压缩
gltfpack -i input.glb -o output.glb -cc

# 或用 gltf-transform
gltf-transform optimize input.glb output.glb --compress meshopt
```

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('model-meshopt.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

| 对比项 | Draco | Meshopt |
|---|---|---|
| 压缩率 | 更高（尤其几何体） | 略低 |
| 解码速度 | 较慢 | 快 3~10 倍 |
| 动画压缩 | 一般 | 更好 |
| 解码器体积 | 较大（wasm） | 较小 |
| 选择建议 | 模型巨大、极致体积 | 移动端、要快速显示 |

## 四、KTX2 纹理与 Basis

纹理往往比几何体更占空间。KTX2 是一种**GPU 原生支持**的压缩纹理容器，配合 Basis Universal 编码，可以「一次压缩、跨设备用」。

### 4.1 压缩纹理

```bash
# gltf-transform：把模型里的纹理转成 KTX2（WebP 作为兜底格式）
gltf-transform uastc input.glb output-ktx2.glb \
  --level 2 --compress webp --keep-uastc
```

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const ktx2 = new KTX2Loader();
ktx2.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/libs/basis/');
ktx2.detectSupport(renderer); // 关键：告诉它当前 GPU 支持什么格式
loader.setKTX2Loader(ktx2);
```

::: danger 警告
**`detectSupport(renderer)` 必须在加载前调用**，而且要传入真实的 renderer。它检测当前 GPU 支持哪种压缩格式（ASTC / ETC2 / BC7…），转码器据此转成对应格式。漏了这行，纹理会加载失败或显示成纯色。
:::

### 4.2 纹理尺寸与 mipmap

| 纹理用途 | 推荐尺寸 | 说明 |
|---|---|---|
| 主颜色贴图（主角/近景） | 2048 | 桌面端近景够用 |
| 主颜色贴图（移动端） | 1024 | 手机屏小，2048 是浪费 |
| 法线贴图 | 1024~2048 | 细节敏感，可稍大 |
| 粗糙度/金属度 | 512~1024 | 低频信息，不用太大 |
| AO 贴图 | 512~1024 | 同上 |
| 小物件 / 远景 | 256~512 | 足够 |

```js
// mipmap：远处用自动生成的小图，避免闪烁、还更快
texture.generateMipmaps = true;               // 默认就是 true
texture.minFilter = THREE.LinearMipmapLinearFilter; // 默认就是这个
texture.magFilter = THREE.LinearFilter;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 斜看更清晰
```

::: tip 大白话时间
mipmap 就像**地图缩放**：你不会在世界地图上显示每栋楼，拉近了才显示细节。纹理也一样——远处用小图，又快又不闪。显存多花 1/3，换来稳定和性能，非常划算。
:::

## 五、gltfpack / gltf-transform 命令行

两个主力工具，选一个用就行：

### 5.1 gltf-transform（功能全、生态好）

```bash
# 查看模型信息（顶点数、纹理尺寸、体积）
gltf-transform inspect input.glb

# 一键优化（推荐入口）
gltf-transform optimize input.glb output.glb \
  --texture-compress webp \
  --texture-size 1024 \
  --compress draco

# 单独压缩几何体
gltf-transform draco input.glb out-draco.glb

# 单独压缩纹理为 KTX2
gltf-transform uastc input.glb out-ktx2.glb

# 精简：移除不需要的相机/灯光/动画
gltf-transform prune input.glb output.glb
```

### 5.2 gltfpack（快、一条命令搞定）

```bash
# 综合优化 + Meshopt 压缩纹理
gltfpack -i input.glb -o output.glb -cc -tc

# 常用参数：
#   -cc   压缩几何体（Meshopt）
#   -tc   压缩纹理
#   -si   简化网格（减三角形），如 -si 0.7 保留 70%
#   -noq  禁用量化
```

::: tip 大白话时间
不确定用哪个？**新手用 `gltf-transform optimize` 一条命令**，参数少、效果稳。等你熟悉了再玩 gltfpack 的细粒度参数。
:::

## 六、懒加载与 LOD

### 6.1 懒加载：用到才加载

```js
// 不在首屏的模型，等用户快滚到再加载
const loader = new GLTFLoader();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      loader.load('heavy-model.glb', (gltf) => {
        scene.add(gltf.scene);
      });
      observer.disconnect(); // 加载过就不再观察
    }
  });
});
observer.observe(document.querySelector('#model-slot'));
```

### 6.2 LOD：远处的用低模

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const lod = new THREE.LOD();
const loader = new GLTFLoader();

// 近处：高精度模型
loader.load('model-high.glb', (gltf) => {
  lod.addLevel(gltf.scene, 0); // 距离 0 开始显示
});

// 远处：低精度模型
loader.load('model-low.glb', (gltf) => {
  lod.addLevel(gltf.scene, 50); // 50 单位外切换到低模
});

scene.add(lod);
// LOD 会根据相机距离自动切换，无需手动干预
```

## 七、完整加载器配置（可直接抄）

把 GLTFLoader + DRACOLoader + KTX2Loader 组合起来，带进度条和错误处理：

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

// 1. Draco 解码器
const draco = new DRACOLoader();
draco.setDecoderPath('/draco/'); // 本地 public/draco/ 目录
draco.preload();

// 2. KTX2 转码器
const ktx2 = new KTX2Loader();
ktx2.setTranscoderPath('/basis/'); // 本地 public/basis/ 目录
ktx2.detectSupport(renderer);

// 3. 组装 GLTFLoader
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
loader.setKTX2Loader(ktx2);

// 4. 加载（带进度和错误处理）
loader.load(
  '/models/product-optimized.glb',
  (gltf) => {
    const model = gltf.scene;

    // 自动居中并缩放到合适大小
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    const scale = 2 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);

    // 开启阴影
    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    scene.add(model);

    // 如果模型带动画
    if (gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      // 记得在渲染循环里 mixer.update(delta)
    }

    // 加载完成后可释放解码器（如果之后不再加载 Draco 模型）
    // draco.dispose();
    // ktx2.dispose();
  },
  (progress) => {
    if (progress.total) {
      const percent = (progress.loaded / progress.total) * 100;
      console.log(`加载进度：${percent.toFixed(1)}%`);
    }
  },
  (error) => {
    console.error('模型加载失败：', error);
  }
);
```

## 八、加载性能对比

假设一个典型产品模型：原始 50MB，包含 50 万三角形 + 4 张 2048 贴图。优化后效果：

| 方案 | 文件体积 | 首屏时间（4G） | 显存占用 | 综合推荐 |
|---|---|---|---|---|
| 原始 GLB | 50 MB | ~20 s | 高 | 不推荐 |
| 仅缩小纹理到 1024 | ~20 MB | ~8 s | 中 | 入门优化 |
| + Draco 几何体 | ~8 MB | ~3.5 s | 中 | 效果好 |
| + KTX2 纹理 | ~5 MB | ~2.5 s | 低 | **推荐组合** |
| + Meshopt（替代 Draco） | ~6 MB | ~2 s | 低 | 解码最快 |
| 全套 + LOD + 懒加载 | ~3 MB（首屏） | ~1.5 s | 低 | 大型场景 |

::: tip 大白话时间
优化是有**收益递减**的：从 50MB 压到 8MB 是巨大提升；从 5MB 压到 3MB 就只有一点点。别为了最后那点体积过度优化——先把「原始 → Draco + KTX2」这一步做了，已经解决 90% 的问题。
:::

## 九、上线前检查清单

- [ ] 用 `gltf-transform inspect` 看过模型的顶点数和纹理尺寸
- [ ] 纹理尺寸按用途调整过（移动端主贴图 ≤ 1024）
- [ ] 开启了 mipmap 和各向异性过滤
- [ ] 几何体用了 Draco 或 Meshopt 压缩
- [ ] 纹理用了 KTX2 / Basis 压缩
- [ ] 解码器/转码器文件路径正确，且本地有备份
- [ ] `KTX2Loader.detectSupport(renderer)` 在加载前调用了
- [ ] 模型做了居中/缩放，加载后能正确显示
- [ ] 大场景用了 LOD 和懒加载
- [ ] 测过真实网络环境（限速到 4G）下的加载时间

::: tip 大白话时间
模型优化不是「玄学调参」，就是老老实实做这几件事：**压形状、压贴图、缩尺寸、加 mipmap、用到才加载**。做完这几步，你的模型就达到了上线标准。去优化吧。
:::
