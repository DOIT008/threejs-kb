# API 02 · Object3D 全参考

## 什么时候用：快速决策

::: tip 大白话时间
把 Object3D 想成「家具的通用说明书」——不管你是沙发（Mesh）、台灯（Light）还是一辆车（Group），都有位置、旋转、缩放，都能往里塞别的物体。吃透这一份说明书，场上所有物体你都会摆。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 摆一个能看见的球 | `new THREE.Mesh(geometry, material)` + `scene.add(mesh)` | 别直接 `new THREE.Object3D()`——没几何体和材质，渲染是空的 |
| 把一堆物体当整体搬动 / 转向 | `const car = new THREE.Group(); car.add(body, wheel); scene.add(car)` | 别逐个改每个 mesh 的 `position`——冗余且转向时容易漏 |
| 把物体挪到另一个组且屏幕位置不变 | `newParent.attach(mesh)` | 别用 `add(mesh)`——add 不改局部坐标，物体会跳位 |
| 遍历整棵树统一改材质 | `scene.traverse(obj => { if (obj.isMesh) obj.material = mat; })` | 别只遍历 `scene.children`——嵌套的子物体会漏掉 |
| 让飞船沿自身朝向前进 | `ship.translateZ(speed)` | 别用 `ship.position.z += speed`——后者是世界 Z 轴，转向后就走错方向 |
| 按名字找回某个物体 | `scene.getObjectByName('car')`（先设 `obj.name = 'car'`） | 别用 `getObjectById(id)`——id 是运行时自动分配的，写死不可靠 |

::: warning 一个高频误区
改完 `position` / `rotation` 后立刻读 `matrixWorld`，拿到的是**旧值**——矩阵默认要到渲染时才重算。要读世界坐标就用 `getWorldPosition(target)`（它内部会强制更新），或先手动调 `updateMatrixWorld(true)`。另外 `traverse` 会连隐藏物体一起遍历，只想处理看得见的要用 `traverseVisible`，否则隐藏的辅助物体也会被误改。
:::

`Object3D` 是**所有物体的基类**——Mesh、Group、Camera、Light、Points 全都继承它。下面这些属性和方法，任何物体都能用。

::: tip 大白话时间
把 Object3D 想成「所有 3D 物体的身份证」。不管它是球、是灯、还是相机，都有位置、旋转、缩放，都能 add 子物体——因为它们是一家人。
:::

## 一、构造

```js
const obj = new THREE.Object3D();
```

没有参数。通常不直接实例化，而是用它派生的类。

## 二、属性

### 身份与层级

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `id` | `number` | 自动递增 | 只读，全局唯一数字 ID |
| `uuid` | `string` | 自动生成 | 只读，UUID 字符串 |
| `name` | `string` | `''` | 名字，用于 `getObjectByName()` |
| `type` | `string` | `'Object3D'` | 只读，类类型标识 |
| `parent` | `Object3D` | `null` | 只读，父对象 |
| `children` | `Object3D[]` | `[]` | 只读，子对象数组 |

### 变换

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `position` | `Vector3` | `(0,0,0)` | 局部位置 |
| `rotation` | `Euler` | `(0,0,0)` | 局部旋转（**弧度**） |
| `quaternion` | `Quaternion` | `(0,0,0,1)` | 局部旋转（四元数），与 rotation 同步 |
| `scale` | `Vector3` | `(1,1,1)` | 局部缩放 |
| `up` | `Vector3` | `(0,1,0)` | 「上方」方向，`lookAt()` 用它 |
| `matrix` | `Matrix4` | 单位矩阵 | 局部变换矩阵 |
| `matrixWorld` | `Matrix4` | 单位矩阵 | 世界变换矩阵（含所有父级） |
| `matrixAutoUpdate` | `boolean` | `true` | 每帧自动由 position/rotation/scale 重算 matrix |
| `matrixWorldAutoUpdate` | `boolean` | `true` | 自动更新世界矩阵 |

### 可见性与渲染

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `visible` | `boolean` | `true` | `false` 时整个子树都不渲染 |
| `layers` | `Layers` | 第 0 层 | 渲染层，配合相机/射线的 layers |
| `renderOrder` | `number` | `0` | 同深度物体的绘制顺序（小的先画） |
| `frustumCulled` | `boolean` | `true` | 视锥外自动不渲染 |
| `castShadow` | `boolean` | `false` | 是否投射阴影 |
| `receiveShadow` | `boolean` | `false` | 是否接收阴影 |
| `userData` | `object` | `{}` | 任意自定义数据（不会被 JSON 序列化丢失） |

## 三、方法

### 添加 / 移除

| 方法 | 参数 | 返回 | 说明 |
|---|---|---|---|
| `add(...objects)` | `Object3D...` | `this` | 添加为子物体（可一次多个） |
| `remove(...objects)` | `Object3D...` | `this` | 移除子物体 |
| `clear()` | — | `this` | 移除所有子物体 |
| `attach(object)` | `Object3D` | `this` | 添加子物体但**保持世界变换不变** |

```js
group.add(mesh1, mesh2, mesh3);
group.remove(mesh1);
```

::: tip add vs attach
`add` 后子物体的 `position` 不变（相对父级），世界位置可能跳变。

`attach` 会自动调整局部坐标，让物体在屏幕上**原地不动**。做「把物体从一个组挪到另一个组」时用 `attach`。
:::

### 查找

| 方法 | 参数 | 返回 | 说明 |
|---|---|---|---|
| `getObjectById(id)` | `number` | `Object3D` | 按 id 查（含后代） |
| `getObjectByName(name)` | `string` | `Object3D` | 按 name 查第一个匹配的 |
| `getObjectByProperty(name, value)` | `string, any` | `Object3D` | 按任意属性查 |
| `getObjectsByProperty(name, value)` | `string, any` | `Object3D[]` | 返回所有匹配的 |
| `getWorldPosition(target)` | `Vector3` | `Vector3` | 写入世界坐标 |
| `getWorldQuaternion(target)` | `Quaternion` | `Quaternion` | 写入世界旋转 |
| `getWorldScale(target)` | `Vector3` | `Vector3` | 写入世界缩放 |
| `getWorldDirection(target)` | `Vector3` | `Vector3` | 写入世界朝向（+Z 方向） |

```js
const p = new THREE.Vector3();
mesh.getWorldPosition(p); // p 现在是世界坐标
```

::: warning 注意
`getWorld*` 系列方法内部会调用 `updateWorldMatrix(true, false)`，所以不手动更新矩阵也能拿到正确值。但要传入一个 target 对象来接收结果，不是返回值本身。
:::

### 坐标转换

| 方法 | 参数 | 返回 | 说明 |
|---|---|---|---|
| `worldToLocal(vector)` | `Vector3` | `Vector3` | 世界坐标 → 局部坐标（原地修改向量） |
| `localToWorld(vector)` | `Vector3` | `Vector3` | 局部坐标 → 世界坐标 |

### 朝向与移动

| 方法 | 参数 | 说明 |
|---|---|---|
| `lookAt(x, y, z)` | 三个数或 `Vector3` | 让物体的 +Z 轴指向目标 |
| `translateX/Y/Z(d)` | `number` | 沿**自身局部轴**移动 d 距离 |
| `translateOnAxis(axis, d)` | `Vector3, number` | 沿任意局部轴移动 |
| `rotateX/Y/Z(angle)` | `number`（弧度） | 绕**自身局部轴**旋转 |
| `rotateOnAxis(axis, angle)` | `Vector3, number` | 绕任意局部轴旋转 |
| `rotateOnWorldAxis(axis, angle)` | `Vector3, number` | 绕**世界轴**旋转 |
| `setRotationFromAxisAngle(axis, angle)` | `Vector3, number` | 用轴角设置旋转 |
| `setRotationFromEuler(euler)` | `Euler` | 用欧拉角设置旋转 |
| `setRotationFromQuaternion(q)` | `Quaternion` | 用四元数设置旋转 |

::: tip 大白话时间
`translateX(1)` 和 `position.x += 1` 不一样！

- `position.x += 1` 是沿**世界 X 轴**移动
- `translateX(1)` 是沿**物体自己的 X 轴**移动

物体转了 90 度后，自己的 X 轴可能指向世界的 Z 方向——这时两者结果完全不同。做飞船、角色移动时用 `translateX` 更符合直觉。
:::

### 遍历

| 方法 | 参数 | 说明 |
|---|---|---|
| `traverse(callback)` | `(obj) => void` | 遍历自身 + 所有后代 |
| `traverseVisible(callback)` | `(obj) => void` | 只遍历可见的 |
| `traverseAncestors(callback)` | `(obj) => void` | 遍历所有父级（不含自身） |

```js
scene.traverse(obj => {
  if (obj.isMesh) {
    obj.castShadow = true; // 给所有网格开阴影
  }
});
```

### 矩阵更新

| 方法 | 参数 | 说明 |
|---|---|---|
| `updateMatrix()` | — | 从 position/rotation/scale 重算 `matrix` |
| `updateMatrixWorld(force)` | `boolean` | 更新自身及子级的 `matrixWorld` |
| `updateWorldMatrix(updateParents, updateChildren)` | `boolean, boolean` | 精确控制更新范围 |

### 克隆与序列化

| 方法 | 参数 | 返回 | 说明 |
|---|---|---|---|
| `clone(recursive)` | `boolean`（默认 `true`） | `Object3D` | 克隆，`recursive=true` 时连子物体一起 |
| `copy(source, recursive)` | `Object3D, boolean` | `this` | 从源复制 |
| `toJSON(meta)` | `object` | `object` | 序列化为 JSON |

::: warning 注意
`clone()` 的几何体和材质是**共享引用**（浅拷贝）！改克隆体的材质颜色，原物体也会变。要完全独立得手动 `clone()` 材质：

```js
const c = mesh.clone();
c.material = mesh.material.clone();
```
:::

### 类型判断属性

不用 `instanceof`，用这些布尔标记更快：

| 属性 | 说明 |
|---|---|
| `isObject3D` | 所有 Object3D 都有 |
| `isMesh` / `isLine` / `isPoints` / `isSprite` | 各类物体 |
| `isCamera` / `isLight` | 相机 / 灯光 |
| `isScene` / `isGroup` / `isBone` | 场景 / 组 / 骨骼 |

```js
obj.traverse(o => {
  if (o.isMesh) { /* ... */ }
});
```

## 四、事件

Object3D 继承自 `EventDispatcher`：

| 方法 | 说明 |
|---|---|
| `addEventListener(type, fn)` | 监听事件 |
| `removeEventListener(type, fn)` | 移除监听 |
| `dispatchEvent(event)` | 触发事件 |

内置事件：`'added'`（被 add 时）、`'removed'`（被 remove 时）、`'childadded'`、`'childremoved'`（r152+）。

```js
mesh.addEventListener('added', () => console.log('进场景了'));
```
