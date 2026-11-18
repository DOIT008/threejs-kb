# API 15 · 物体类型全参考

## 什么时候用：快速决策

::: tip 大白话时间
挑物体类型像「画画选工具」：`Mesh` 是实心模型（立方体、人物），`Line` 是铅笔画的线（网格、轨迹），`Points` 是撒出去的星星点（粒子），`Sprite` 是永远正对你的便利贴（标签、火焰）。`InstancedMesh` 像印章——一次盖出成千上万个一模一样的（草、树）；`BatchedMesh` 是高级印章——一次能盖不同图案（一座城的各种建筑）。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 显示常规实心模型（Box/Sphere/GLTF） | `Mesh(geometry, material)` | 别用 `Points`——它只把顶点画成点，根本没有面 |
| 画网格线、轨迹、坐标轴线 | `Line` / `LineSegments` / `LineLoop`（虚线材质要先 `computeLineDistances()`） | 别用 `Mesh` 拼细长圆柱——线段更省，线宽交给材质控制 |
| 星星、雨滴、粒子系统 | `Points` + `PointsMaterial`（`size`、`sizeAttenuation`） | 别用一堆 `Sprite`——上千个 sprite 就是上千个 draw call |
| 永远朝向相机的标签/图标/火焰 | `Sprite(material)`，`center` 可调对齐点 | 别用 `Mesh` + 每帧 `lookAt(camera)`——sprite 自动面向相机，更省事 |
| 大量相同物体（1 万棵树、草） | `InstancedMesh(geometry, material, count)` + `setMatrixAt`，改完设 `instanceMatrix.needsUpdate = true` | 别建一万个 `Mesh`——draw call 爆炸，帧率直接崩 |
| 大量不同几何体/材质（城市里各种楼） | `BatchedMesh(maxInstanceCount, maxVertexCount, maxIndexCount, material)`，`addGeometry` + `addInstance` | 别用 `InstancedMesh`——它只能渲染同一种几何体+材质 |

::: warning 一个高频误区
改完 `InstancedMesh` 的 `setMatrixAt()` / `setColorAt()` 后，必须设 `instanced.instanceMatrix.needsUpdate = true`（颜色则 `instanceColor.needsUpdate = true`），否则 GPU 不知道数据变了，实例纹丝不动。另一个坑：实例矩阵要用 `dummy.updateMatrix()` 生成再 `setMatrixAt(i, dummy.matrix)`——直接改 `mesh.position` 不会自动同步到实例矩阵上。
:::

## 一、Mesh（网格）

```js
new THREE.Mesh(geometry, material)
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `geometry` | `BufferGeometry` | 几何体 |
| `material` | `Material` | 材质（可以是数组，配合 geometry.groups） |

### 属性

| 属性 | 说明 |
|---|---|
| `geometry` | 几何体 |
| `material` | 材质或材质数组 |
| `isMesh` | `true` |

继承 Object3D 的所有属性（position/rotation/scale/visible/castShadow 等）。

### 方法

| 方法 | 说明 |
|---|---|
| `raycast(raycaster, intersects)` | 射线检测（内部用） |

## 二、Line / LineSegments / LineLoop

```js
new THREE.Line(geometry, material)
new THREE.LineSegments(geometry, material)
new THREE.LineLoop(geometry, material)
```

| 类 | 说明 |
|---|---|
| `Line` | 把顶点依次连成一条线 |
| `LineSegments` | 每两个顶点连一条独立线段 |
| `LineLoop` | 首尾相连的闭合线 |

| 方法 | 说明 |
|---|---|
| `computeLineDistances()` | 计算线距离（虚线材质必须调用） |

```js
const geo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(1,2,0),
  new THREE.Vector3(2,0,0)
]);
const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff0000 }));
line.computeLineDistances(); // 用 LineDashedMaterial 时
```

## 三、Points（点/粒子）

```js
new THREE.Points(geometry, material)
```

几何体的每个顶点渲染成一个点。材质用 `PointsMaterial`。

## 四、Sprite（精灵）

```js
new THREE.Sprite(material)
```

永远面向相机的平面，做标签、图标、火焰。

| 属性 | 默认值 | 说明 |
|---|---|---|
| `material` | `SpriteMaterial` | 材质 |
| `center` | `(0.5,0.5)` | 对齐中心点 |

## 五、InstancedMesh（实例化网格）

一次 draw call 渲染大量相同物体。

```js
new THREE.InstancedMesh(geometry, material, count)
```

| 参数 | 说明 |
|---|---|
| `count` | 实例数量 |

### 属性

| 属性 | 说明 |
|---|---|
| `count` | 实际渲染的实例数（可动态改，<= 初始 count） |
| `instanceMatrix` | `InstancedBufferAttribute`，所有实例的变换矩阵 |
| `instanceColor` | `InstancedBufferAttribute \| null`，所有实例的颜色 |
| `morphTexture` | morph 目标纹理 |

### 方法

| 方法 | 说明 |
|---|---|
| `setMatrixAt(index, matrix)` | 设置第 i 个实例的变换 |
| `getMatrixAt(index, matrix)` | 读取变换 |
| `setColorAt(index, color)` | 设置第 i 个实例的颜色 |
| `getColorAt(index, color)` | 读取颜色 |
| `setMorphAt(index, mesh)` | 设置 morph |
| `computeBoundingBox()` / `computeBoundingSphere()` | 计算包围体 |
| `dispose()` | 释放 |

```js
const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set(/* ... */);
  dummy.updateMatrix();
  instanced.setMatrixAt(i, dummy.matrix);
}
instanced.instanceMatrix.needsUpdate = true; // 关键！
```

::: warning 注意
改完 `instanceMatrix` 或 `instanceColor` 必须设 `needsUpdate = true`，否则 GPU 不知道数据变了。
:::

## 六、BatchedMesh（批处理网格，r165+）

比 InstancedMesh 更灵活——可以在一个 draw call 里渲染**不同几何体、不同材质**的物体。

```js
new THREE.BatchedMesh(maxInstanceCount, maxVertexCount, maxIndexCount, material)
```

| 方法 | 说明 |
|---|---|
| `addGeometry(geometry, reservedVertexCount, reservedIndexCount)` | 添加几何体，返回 geometryId |
| `addInstance(geometryId)` | 添加实例，返回 instanceId |
| `setMatrixAt(instanceId, matrix)` | 设置变换 |
| `setColorAt(instanceId, color)` | 设置颜色 |
| `setVisibleAt(instanceId, visible)` | 单独控制可见性 |
| `deleteInstance(instanceId)` | 删除实例 |

适合需要大量不同模型的场景（比如一座城市里各种建筑）。

## 七、LOD（细节层级）

```js
const lod = new THREE.LOD();
```

| 属性/方法 | 说明 |
|---|---|
| `levels` | 层级数组 |
| `autoUpdate` | 是否自动切换（默认 true） |
| `addLevel(object, distance, hysteresis)` | 添加层级：距离 >= distance 时显示 |
| `getCurrentLevel()` | 当前层级索引 |
| `getObjectForDistance(distance)` | 指定距离用哪个物体 |
| `raycast()` | 只对当前层级检测 |

```js
lod.addLevel(highMesh, 0);
lod.addLevel(midMesh, 20);
lod.addLevel(lowMesh, 50);
scene.add(lod);
```

## 八、SkinnedMesh / Bone（骨骼动画）

```js
const skeleton = new THREE.Skeleton(bones);
const mesh = new THREE.SkinnedMesh(geometry, material);
mesh.bind(skeleton);
```

| SkinnedMesh 属性/方法 | 说明 |
|---|---|
| `skeleton` | 骨骼系统 |
| `bindMode` | `'attached'` / `'detached'` |
| `bind(skeleton, bindMatrix)` | 绑定 |
| `normalizeSkinWeights()` | 归一化蒙皮权重 |
| `boneTransform(index, target)` | 骨骼变换 |

一般不需要手写——GLTFLoader 会自动创建。

## 九、Group / Object3D

见前面章节。

## 十、物体类型判断速查

| 判断属性 | 物体类型 |
|---|---|
| `isMesh` | Mesh / SkinnedMesh / InstancedMesh |
| `isInstancedMesh` | InstancedMesh |
| `isBatchedMesh` | BatchedMesh |
| `isLine` / `isLineSegments` / `isLineLoop` | 线 |
| `isPoints` | 粒子 |
| `isSprite` | 精灵 |
| `isLOD` | LOD |
| `isBone` | 骨骼 |
| `isSkinnedMesh` | 蒙皮网格 |
| `isLight` / `isCamera` / `isScene` | 灯 / 相机 / 场景 |
