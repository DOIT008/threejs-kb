# API 10 · 纹理与加载器全参考

## 什么时候用：快速决策

::: tip 大白话时间
把 3D 物体想成一间空房子：`Texture` 是贴上去的墙纸；`CanvasTexture` 是当场用记号笔在透明胶片上画好再贴（随时能改字）；`DataTexture` 是按像素表一格格填色印出来的贴纸。各种 `Loader` 则是去不同仓库取货的快递——图片走 `TextureLoader`，模型走 `GLTFLoader`，HDR 环境走 `RGBELoader`。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 给模型贴一张 png/jpg 图片 | `TextureLoader.load(url)` 得到 `Texture`，赋给 `material.map` | 别用 `DataTexture`——它吃的是原始像素数组，不认识图片 URL |
| 动态文字标签、程序化棋盘格 | `CanvasTexture(canvas)`，改完 canvas 后设 `texture.needsUpdate = true` | 别用普通 `Texture`——它不会帮你同步 canvas 的更新 |
| 加载 HDR 环境贴图做 PBR 反射 | `RGBELoader` / `EXRLoader`，并设 `texture.mapping = THREE.EquirectangularReflectionMapping` | 别用 `TextureLoader`——8 位 LDR 装不下 HDR 的高动态范围，反射会灰 |
| 加载带动画的 glTF/GLB 模型 | `GLTFLoader.load`，返回的 `gltf.animations` 交给 `AnimationMixer` | 别用 `OBJLoader`——OBJ 不含动画、PBR 材质和场景层级 |
| 显示整体加载进度条 | 把同一个 `manager` 传给各 loader：`new THREE.TextureLoader(manager)`，监听 `manager.onProgress(url, loaded, total)` | 别在每个 loader 自己的 `onProgress` 里各算各的——多资源进度无法汇总 |
| 斜视地面/墙面时纹理发糊 | 设 `texture.anisotropy = renderer.capabilities.getMaxAnisotropy()` | 别只调 `magFilter`——各向异性过滤才是解决斜视模糊的关键 |

::: warning 一个高频误区
颜色贴图（`material.map`、`emissiveMap`）必须设 `texture.colorSpace = THREE.SRGBColorSpace`；而法线贴图、粗糙度贴图这类**数据贴图**必须保持默认的 `NoColorSpace`。把 sRGB 错设到法线贴图上会让光照算错、出现塑料般的明暗错误；反过来颜色贴图漏设 sRGB，整体会偏暗发灰。
:::

## 一、Texture（纹理基类）

### 构造

```js
new THREE.Texture(image, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace)
```

### 核心属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `image` | `Image \| Canvas \| Video` | `null` | 图像源 |
| `mapping` | `constant` | `UVMapping` | 映射方式 |
| `wrapS` | `constant` | `ClampToEdgeWrapping` | 水平包裹 |
| `wrapT` | `constant` | `ClampToEdgeWrapping` | 垂直包裹 |
| `magFilter` | `constant` | `LinearFilter` | 放大过滤 |
| `minFilter` | `constant` | `LinearMipmapLinearFilter` | 缩小过滤 |
| `generateMipmaps` | `boolean` | `true` | 是否生成 mipmap |
| `flipY` | `boolean` | `true` | 是否垂直翻转（GLTF 模型贴图常设 false） |
| `premultiplyAlpha` | `boolean` | `false` | 预乘 alpha |
| `unpackAlignment` | `number` | `4` | 内存对齐 |
| `colorSpace` | `string` | `NoColorSpace` | 颜色空间（颜色贴图设 SRGBColorSpace） |
| `repeat` | `Vector2` | `(1,1)` | 重复次数 |
| `offset` | `Vector2` | `(0,0)` | 偏移 |
| `center` | `Vector2` | `(0,0)` | 旋转中心 |
| `rotation` | `number` | `0` | 旋转弧度 |
| `matrixAutoUpdate` | `boolean` | `true` | 自动更新 UV 变换矩阵 |
| `matrix` | `Matrix3` | — | UV 变换矩阵 |
| `anisotropy` | `number` | `1` | 各向异性过滤级别（斜视更清晰） |
| `format` | `constant` | `RGBAFormat` | 像素格式 |
| `type` | `constant` | `UnsignedByteType` | 数据类型 |
| `mipmaps` | `Array` | `[]` | mipmap 数组 |
| `mipmapsAutoUpdate` | `boolean` | `true` | r187 新增，自动更新 mipmap |
| `userData` | `object` | `{}` | 自定义数据（GLTF 用） |
| `version` | `number` | 0 | 只读，needsUpdate 后 +1 |

### 方法

| 方法 | 说明 |
|---|---|
| `needsUpdate = true` | 上传/更新纹理到 GPU |
| `clone()` | 克隆（共享 image） |
| `copy(source)` | 复制 |
| `dispose()` | 释放 GPU 资源 |
| `toJSON(meta)` | 序列化 |
| `updateMatrix()` | 手动更新 UV 矩阵 |

### 像素格式 format

`AlphaFormat`、`RGBFormat`、`RGBAFormat`（默认）、`LuminanceFormat`、`RedFormat`、`RGFormat`、`RedIntegerFormat`、`DepthFormat`、`DepthStencilFormat`

## 二、纹理子类

| 类 | 用途 |
|---|---|
| `CanvasTexture(canvas)` | 从 canvas 生成（动态文字、程序化图案） |
| `VideoTexture(video)` | 视频帧作为纹理 |
| `DataTexture(data, w, h)` | 从原始数组数据创建 |
| `DataArrayTexture` | 2D 纹理数组 |
| `Data3DTexture` | 3D 纹理 |
| `CompressedTexture` | 压缩纹理（ASTC/ETC 等） |
| `CubeTexture(images)` | 6 面立方体贴图 |
| `WebGLCubeRenderTarget.texture` | 动态立方体贴图 |
| `DepthTexture` | 深度纹理 |
| `ExternalTexture` | 视频外部纹理（WebGPU） |

## 三、Loader 加载器基类

```js
const loader = new THREE.Loader();
```

| 方法 | 说明 |
|---|---|
| `load(url, onLoad, onProgress, onError)` | 加载资源 |
| `loadAsync(url, onProgress)` | Promise 版本 |
| `setCrossOrigin(value)` | 设置跨域（`'anonymous'` / `'use-credentials'`） |
| `setPath(path)` | 设置基础路径 |
| `setResourcePath(path)` | 设置资源路径（优先级高于 path） |
| `setRequestHeader(name, value)` | 设置请求头 |
| `setWithCredentials(value)` | 是否携带凭证 |

## 四、LoadingManager（加载管理器）

```js
const manager = new THREE.LoadingManager(onLoad, onProgress, onError, itemStart, itemEnd, itemError)
```

| 回调 | 参数 | 说明 |
|---|---|---|
| `onLoad` | — | 所有项加载完成 |
| `onProgress` | `(url, itemsLoaded, itemsTotal)` | 每项完成 |
| `onError` | `(url)` | 加载失败 |
| `onItemStart` | `(url)` | 开始加载某项 |
| `onItemEnd` | `(url)` | 某项结束 |

| 方法 | 说明 |
|---|---|
| `itemStart(url)` / `itemEnd(url)` / `itemError(url)` | 手动报告状态 |
| `resolveURL(url)` | 自定义 URL 解析（可重写） |
| `addHandler(regex, loader)` | 为特定文件类型指定加载器 |
| `removeHandler(regex)` | 移除处理器 |
| `setURLModifier(fn)` | 修改 URL |

```js
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => {
  console.log(`${loaded}/${total}`);
  updateProgressBar(loaded / total);
};
const texLoader = new THREE.TextureLoader(manager);
```

## 五、TextureLoader

```js
const loader = new THREE.TextureLoader(manager);
loader.load(url, onLoad, onProgress, onError);
```

`onLoad` 回调收到一个 `Texture` 对象。

## 六、其他常用加载器

| 加载器 | 导入路径 | 用途 |
|---|---|---|
| `CubeTextureLoader` | `three` | 加载 6 面立方体贴图 |
| `ImageBitmapLoader` | `three` | 用 ImageBitmap 异步解码（更快） |
| `FileLoader` | `three` | 通用二进制/文本 |
| `FontLoader` | `three/addons/loaders/FontLoader.js` | 字体（配合 TextGeometry） |
| `RGBELoader` | `three/addons/loaders/RGBELoader.js` | HDR 环境贴图（.hdr） |
| `EXRLoader` | `three/addons/loaders/EXRLoader.js` | EXR 环境贴图 |
| `GLTFLoader` | `three/addons/loaders/GLTFLoader.js` | GLTF/GLB 模型 |
| `DRACOLoader` | `three/addons/loaders/DRACOLoader.js` | DRACO 压缩解码 |
| `KTX2Loader` | `three/addons/loaders/KTX2Loader.js` | KTX2 压缩纹理 |
| `OBJLoader` / `MTLLoader` | `three/addons/loaders/...` | OBJ 模型 |
| `FBXLoader` | `three/addons/loaders/FBXLoader.js` | FBX 模型 |
| `STLLoader` | `three/addons/loaders/STLLoader.js` | STL 模型 |
| `SVGLoader` | `three/addons/loaders/SVGLoader.js` | SVG 转几何体 |

## 七、GLTFLoader 详解

```js
const loader = new THREE.GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);
loader.setKTX2Loader(ktx2Loader);
loader.setMeshoptDecoder(MeshoptDecoder);

loader.load(url, (gltf) => {
  // gltf 结构见下表
});
```

### gltf 返回对象

| 属性 | 说明 |
|---|---|
| `scene` | `Group`，场景根节点 |
| `scenes` | 所有场景数组 |
| `animations` | `AnimationClip[]` 动画片段 |
| `cameras` | 相机数组 |
| `asset` | 元数据（版本、生成器等） |
| `parser` | 解析器对象 |
| `userData` | 自定义数据 |

### 可重写方法

| 方法 | 说明 |
|---|---|
| `setDRACOLoader(loader)` | DRACO 压缩支持 |
| `setKTX2Loader(loader)` | KTX2 纹理支持 |
| `setMeshoptDecoder(decoder)` | Meshopt 压缩支持 |
| `setCrossOrigin(value)` | 跨域设置 |
| `parse(data, path, onLoad, onError)` | 手动解析 ArrayBuffer |
