# API 06 · 几何体全参考

## 什么时候用：快速决策

::: tip 大白话时间
把几何体想成「积木的形状模具」——BufferGeometry 是能自己捏泥巴的散装零件（`position`、`normal`、`uv` 属性），内置几何体是现成的标准积木（盒子、球、圆柱），拿来即用。要重复摆一千个相同积木时，改用 InstancedMesh 一次提交，而不是造一千个 Mesh。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 摆标准方块 / 球 / 圆柱 | `new THREE.BoxGeometry(1,1,1)`、`SphereGeometry(1,32,16)` | 别手写 BufferGeometry 顶点——内置几何体已算好法线和 UV |
| 做自定义形状（地形 / 异形面） | `new THREE.BufferGeometry()` + `setAttribute('position', new THREE.BufferAttribute(arr, 3))` + `computeVertexNormals()` | 别硬套内置几何体——参数化形状表达不了任意拓扑 |
| 改了顶点数据要让 GPU 更新 | `attribute.needsUpdate = true` | 别只改 `attribute.array`——不设 needsUpdate，GPU 不会重传，画面不变 |
| 一个几何体分区域用不同材质 | `geometry.addGroup(start, count, materialIndex)` + `new Mesh(geo, [matA, matB])` | 别叠多个 Mesh——分组一次提交且共享同一几何体 |
| 只画外轮廓做描边 | `new THREE.EdgesGeometry(geometry, 1)` + `LineSegments` | 别用 `WireframeGeometry`——它连三角面的对角线都画，不是想要的外轮廓 |
| 摆几千个相同物体（草 / 星星） | `new THREE.InstancedMesh(geo, mat, count)`（详见 [API 15](</06-API速查手册/API 15 · 物体类型全参考>)） | 别 `new Mesh` 几千次——每次一个 draw call，帧率被拖垮；几何体各不相同时用 `BatchedMesh` |

::: warning 一个高频误区
两个常见坑：一是改了 `BufferAttribute.array` 里的数据却忘了设 `attribute.needsUpdate = true`，GPU 不会重新上传，画面毫无变化，让人以为 API 失效；二是切换场景时只 `scene.remove(mesh)` 而不调 `geometry.dispose()`，GPU 显存不会自动回收，反复切换会持续泄漏直到页面崩溃。另外内置几何体的分段数别无脑拉满——`SphereGeometry` 默认 32×16 通常够用，设成 128×64 会让三角形数暴涨。
:::

## 一、BufferGeometry（基类）

所有几何体的基类，也是自定义几何体的方式。

### 构造

```js
const geometry = new THREE.BufferGeometry();
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `attributes` | `object` | `{}` | 所有属性数据，如 `position`、`normal`、`uv` |
| `index` | `BufferAttribute \| null` | `null` | 索引数据（复用顶点） |
| `groups` | `Array` | `[]` | 分组，用于多材质 |
| `boundingBox` | `Box3 \| null` | `null` | 包围盒（需 compute 后才有效） |
| `boundingSphere` | `Sphere \| null` | `null` | 包围球（视锥剔除用） |
| `drawRange` | `object` | `{start:0, count:Infinity}` | 只绘制指定范围的顶点 |
| `userData` | `object` | `{}` | 自定义数据 |

### 方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `setAttribute(name, attribute)` | `string, BufferAttribute` | 设置顶点属性 |
| `getAttribute(name)` | `string` | 获取属性 |
| `deleteAttribute(name)` | `string` | 删除属性 |
| `hasAttribute(name)` | `string` | 是否存在某属性 |
| `setIndex(index)` | `BufferAttribute \| number[]` | 设置索引 |
| `getIndex()` | — | 获取索引 |
| `computeVertexNormals()` | — | 根据位置计算法线 |
| `computeBoundingBox()` | — | 计算包围盒 |
| `computeBoundingSphere()` | — | 计算包围球 |
| `computeTangents()` | — | 计算切线（法线贴图需要） |
| `center()` | — | 把几何体移到原点（居中） |
| `translate(x,y,z)` | `number...` | 平移所有顶点 |
| `rotateX/Y/Z(angle)` | `number` | 旋转所有顶点 |
| `scale(x,y,z)` | `number...` | 缩放所有顶点 |
| `applyMatrix4(matrix)` | `Matrix4` | 应用变换矩阵（原地修改顶点） |
| `addGroup(start, count, materialIndex)` | `number...` | 添加材质分组 |
| `clearGroups()` | — | 清空分组 |
| `setDrawRange(start, count)` | `number...` | 设置绘制范围 |
| `clone()` | — | 克隆几何体（深拷贝数据） |
| `copy(source)` | `BufferGeometry` | 复制 |
| `toJSON()` | — | 序列化 |
| `dispose()` | — | **释放 GPU 显存** |

### 内置属性名

| 名称 | 分量数 | 说明 |
|---|---|---|
| `position` | 3 | 顶点位置（必需） |
| `normal` | 3 | 法线（光照需要） |
| `uv` | 2 | 纹理坐标 |
| `uv1` / `uv2` / `uv3` | 2 | 多套 UV（aoMap 用 uv1） |
| `color` | 3 或 4 | 顶点颜色 |
| `tangent` | 4 | 切线（法线贴图） |

### 自定义几何体模板

```js
const geo = new THREE.BufferGeometry();
const positions = new Float32Array([
  -1,-1,0,  1,-1,0,  0,1,0  // 三角形的三个顶点
]);
const indices = [0, 1, 2];

geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setIndex(indices);
geo.computeVertexNormals();
geo.computeBoundingSphere();
```

::: warning 注意
删除/替换几何体时，务必调用旧几何体的 `dispose()` 释放显存，否则内存泄漏。
:::

## 二、BufferAttribute

```js
new THREE.BufferAttribute(array, itemSize, normalized)
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `array` | `TypedArray` | 数据数组（Float32Array 等） |
| `itemSize` | `number` | 每个顶点占几个分量（position=3, uv=2） |
| `normalized` | `boolean` | 是否归一化到 0~1（用于整数类型） |

| 方法 | 说明 |
|---|---|
| `setX/Y/Z/W(index, value)` | 设置分量 |
| `getX/Y/Z/W(index)` | 读取分量 |
| `setUsage(usage)` | 设置用途（StaticDrawUsage 等） |
| `needsUpdate = true` | **改数据后必须设**，通知 GPU 更新 |
| `clone()` / `copy()` | 克隆 / 复制 |
| `array` | 只读访问底层数组 |

## 三、内置几何体完整参数

### BoxGeometry（立方体）

```js
new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `width` | 1 | X 方向宽度 |
| `height` | 1 | Y 方向高度 |
| `depth` | 1 | Z 方向深度 |
| `widthSegments` | 1 | X 方向分段数 |
| `heightSegments` | 1 | Y 方向分段数 |
| `depthSegments` | 1 | Z 方向分段数 |

### SphereGeometry（球体）

```js
new THREE.SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `radius` | 1 | 半径 |
| `widthSegments` | 32 | 水平分段（经线数） |
| `heightSegments` | 16 | 垂直分段（纬线数） |
| `phiStart` | 0 | 水平起始角（弧度） |
| `phiLength` | `2π` | 水平跨度 |
| `thetaStart` | 0 | 垂直起始角 |
| `thetaLength` | `π` | 垂直跨度 |

::: tip 半球的画法
`new THREE.SphereGeometry(1, 32, 16, 0, Math.PI*2, 0, Math.PI/2)` —— thetaLength 设 π/2 就是上半球。
:::

### PlaneGeometry（平面）

```js
new THREE.PlaneGeometry(width, height, widthSegments, heightSegments)
```

默认 1×1，面朝 **+Z**。

### CylinderGeometry（圆柱）

```js
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `radiusTop` | 1 | 顶面半径 |
| `radiusBottom` | 1 | 底面半径 |
| `height` | 1 | 高 |
| `radialSegments` | 32 | 圆周分段 |
| `heightSegments` | 1 | 高度分段 |
| `openEnded` | `false` | 是否无顶底盖 |
| `thetaStart` / `thetaLength` | `0` / `2π` | 圆周起止角 |

::: tip 圆锥 / 圆台
顶面半径 0 = 圆锥；顶底半径不同 = 圆台。
:::

### ConeGeometry（圆锥）

```js
new THREE.ConeGeometry(radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)
```

等价于 `CylinderGeometry(0, radius, height, ...)`。默认半径 1、高 1。

### TorusGeometry（圆环/甜甜圈）

```js
new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `radius` | 1 | 环中心到管中心的距离 |
| `tube` | 0.4 | 管的半径 |
| `radialSegments` | 12 | 管截面分段 |
| `tubularSegments` | 48 | 环周分段 |
| `arc` | `2π` | 圆环跨度（可做部分环） |

### TorusKnotGeometry（环面扭结）

```js
new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q)
```

默认：`radius=1, tube=0.4, tubularSegments=64, radialSegments=8, p=2, q=3`。`p`、`q` 控制缠绕方式，改它能得到各种奇妙形状。

### 多面体家族

```js
new THREE.IcosahedronGeometry(radius, detail)   // 二十面体
new THREE.DodecahedronGeometry(radius, detail)  // 十二面体
new THREE.OctahedronGeometry(radius, detail)    // 八面体
new THREE.TetrahedronGeometry(radius, detail)   // 四面体
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `radius` | 1 | 外接球半径 |
| `detail` | 0 | 细分等级：0=棱角分明，1/2/3 越细分越接近球 |

### 圆与环

```js
new THREE.CircleGeometry(radius, segments, thetaStart, thetaLength)  // 实心圆盘
new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength) // 圆环
```

### CapsuleGeometry（胶囊体）

```js
new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments)
```

默认：`radius=1, length=1, capSegments=4, radialSegments=8`。

### LatheGeometry（旋转体）

```js
new THREE.LatheGeometry(points, segments, phiStart, phiLength)
```

| 参数 | 说明 |
|---|---|
| `points` | `Vector2[]`，轮廓线（旋转轴是 Y 轴） |
| `segments` | 旋转分段数，默认 12 |
| `phiStart` / `phiLength` | 起止角 |

```js
const points = [];
for (let i = 0; i < 10; i++) points.push(new THREE.Vector2(Math.sin(i*0.2)*2+2, i));
const vase = new THREE.Mesh(new THREE.LatheGeometry(points), material);
```

### ExtrudeGeometry（挤出）

```js
new THREE.ExtrudeGeometry(shapes, options)
```

| options | 默认值 | 说明 |
|---|---|---|
| `depth` | 1 | 挤出深度 |
| `bevelEnabled` | `true` | 是否倒角 |
| `bevelThickness` | 0.2 | 倒角厚度 |
| `bevelSize` | 0.1 | 倒角大小 |
| `bevelSegments` | 3 | 倒角分段 |
| `steps` | 1 | 挤出步数 |
| `curveSegments` | 12 | 曲线分段 |

### TubeGeometry（管道）

```js
new THREE.TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `path` | — | `Curve` 对象（如 CatmullRomCurve3） |
| `tubularSegments` | 64 | 沿路径分段 |
| `radius` | 1 | 管半径 |
| `radialSegments` | 8 | 截面分段 |
| `closed` | `false` | 是否闭合 |

### ShapeGeometry / TextGeometry

```js
new THREE.ShapeGeometry(shapes, curveSegments) // 2D 形状
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
new THREE.TextGeometry(text, { font, size, depth, curveSegments, bevelEnabled }) // 3D 文字（需先加载字体）
```

### EdgesGeometry / WireframeGeometry

```js
new THREE.EdgesGeometry(geometry, thresholdAngle) // 只保留夹角大于阈值的边
new THREE.WireframeGeometry(geometry)             // 所有边
```

配合 `LineSegments` 做描边效果。

## 四、几何体选择速查

| 想要 | 用这个 |
|---|---|
| 方块 / 盒子 | BoxGeometry |
| 球 / 半球 | SphereGeometry |
| 平面 / 地面 | PlaneGeometry |
| 柱子 / 圆锥 / 圆台 | CylinderGeometry / ConeGeometry |
| 甜甜圈 | TorusGeometry |
| 花瓶 / 旋转对称体 | LatheGeometry |
| 自定义 2D 形状挤出 | ExtrudeGeometry |
| 沿路径的管子 | TubeGeometry |
| 3D 文字 | TextGeometry |
| 只要边框 | EdgesGeometry |
