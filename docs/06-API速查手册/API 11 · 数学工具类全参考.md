# API 11 · 数学工具类全参考

## 什么时候用：快速决策

::: tip 大白话时间
把搭 3D 场景想成量房装修：`Vector3` 是量位置的卷尺，`Euler` 是量角度的量角器（但会"万向节死锁"卡住），`Quaternion` 是飞船用的陀螺仪、转起来不打结，`Matrix4` 把平移+旋转+缩放打包成一张货运单一次算完；`Box3` 和 `Sphere` 是给家具套的纸箱和气球，用来快速判断"碰没碰着"。
:::

| 你的需求 | 用哪个 | 别用哪个 & 为什么 |
| --- | --- | --- |
| 存一个位置/方向、做加减和归一化 | `Vector3`（`set` / `normalize` / `distanceTo`） | 别用 `Euler`——它存的是角度不是坐标，没有长度概念 |
| 绕轴旋转、要平滑插值不抖动 | `Quaternion.setFromAxisAngle(axis, angle)` + `slerp(qb, t)` | 别对 `Euler` 的 x/y/z 分别 lerp——三轴独立插值会走捷径、产生翻滚 |
| 第一人称相机，怕抬头低头时画面翻转 | `Euler` 用 `'YXZ'` 顺序，或相机直接用 `quaternion` | 别用默认 `'XYZ'`——俯仰接近 ±90° 会万向节死锁、突然翻面 |
| 一次性应用多个变换、给 shader 传矩阵 | `Matrix4`（`compose(pos, quat, scale)` / `makePerspective(...)`） | 别手动逐点算旋转——又慢又容易漏掉平移 |
| 碰撞检测、判断物体是否进相机视锥 | `Box3.setFromObject(obj).intersectsBox(...)`，或 `Frustum.setFromProjectionMatrix(m).intersectsObject(obj)` | 别逐三角比较——包围盒/包围球是粗筛，快几个数量级 |
| 帧率无关的平滑跟随 | `MathUtils.damp(x, y, lambda, delta)` | 别用固定系数的 `lerp(x, y, 0.1)`——不同帧率下移动速度会变 |

::: warning 一个高频误区
`Vector3` 的绝大多数方法（`normalize()`、`add()`、`multiplyScalar()` 等）都是**原地修改并返回自身**，不会新建向量。所以 `a = b.normalize()` 之后 `b` 也变成了单位向量；想保留原值要写 `a = b.clone().normalize()`。链式调用里尤其容易踩——后面以为还是"原向量"的变量其实早被改掉了。
:::

## 一、Vector2

```js
new THREE.Vector2(x, y)
```

### 属性

| 属性 | 说明 |
|---|---|
| `x` / `y` | 分量 |

### 方法

| 方法 | 说明 |
|---|---|
| `set(x,y)` / `setX(x)` / `setY(y)` | 设置 |
| `copy(v)` / `clone()` | 复制 / 克隆 |
| `add(v)` / `addScalar(s)` / `addVectors(a,b)` | 加法 |
| `sub(v)` / `subVectors(a,b)` | 减法 |
| `multiply(v)` / `multiplyScalar(s)` | 乘法 |
| `divide(v)` / `divideScalar(s)` | 除法 |
| `negate()` | 取反 |
| `dot(v)` | 点积 |
| `cross(v)` | 叉积（返回标量） |
| `length()` / `lengthSq()` | 长度 |
| `normalize()` | 归一化长度为 1 |
| `distanceTo(v)` / `distanceToSq(v)` | 距离 |
| `angleTo(v)` | 夹角（弧度） |
| `lerp(v, alpha)` / `lerpVectors(v1,v2,alpha)` | 线性插值 |
| `clamp(min, max)` | 限制范围 |
| `min(v)` / `max(v)` | 逐分量取小/大 |
| `abs()` | 绝对值 |
| `round()` / `floor()` / `ceil()` | 取整 |
| `equals(v)` | 比较 |
| `fromArray(arr, offset)` / `toArray(arr, offset)` | 数组转换 |
| `setFromPoints(points)` | 从点集找极值 |

## 二、Vector3（最常用）

```js
new THREE.Vector3(x, y, z)
```

### 属性

| 属性 | 说明 |
|---|---|
| `x` / `y` / `z` | 分量 |

### 方法（在 Vector2 基础上）

| 方法 | 说明 |
|---|---|
| `cross(v)` | 叉积（返回 Vector3） |
| `crossVectors(a,b)` | 叉积到自身 |
| `applyMatrix3(m)` / `applyMatrix4(m)` | 应用矩阵变换 |
| `applyQuaternion(q)` | 应用四元数旋转 |
| `project(camera)` | 投影到 NDC（-1~1 屏幕坐标） |
| `unproject(camera)` | 从 NDC 反投影到世界 |
| `transformDirection(m)` | 变换方向（不含平移） |
| `setFromMatrixPosition(m)` / `setFromMatrixScale(m)` / `setFromMatrixColumn(m,i)` | 从矩阵提取 |
| `setFromCylindricalCoords(radius,theta,y)` | 柱坐标 |
| `setFromSphericalCoords(radius,phi,theta)` | 球坐标 |
| `setFromEuler(e)` | 从欧拉角 |
| `setFromQuaternion(q)` | 从四元数 |
| `setLength(l)` | 设置长度 |
| `setScalar(s)` | 三分量都设为 s |

```js
const v = new THREE.Vector3(1, 0, 0);
v.normalize();                    // 单位向量
v.applyQuaternion(mesh.quaternion); // 按物体旋转
const screen = v.clone().project(camera); // 转屏幕坐标
```

::: tip 大白话时间
`applyMatrix4` 用于**位置**变换（含平移旋转缩放），`transformDirection` 用于**方向**变换（只旋转缩放，不平移）。法线向量用后者。
:::

## 三、Vector4

```js
new THREE.Vector4(x, y, z, w)
```

方法同 Vector3，多了 `w` 分量（齐次坐标、四元数存储）。常用于着色器 uniform、四元数分量。

## 四、Color（颜色）

```js
new THREE.Color(r, g, b)  // 或 0xRRGGBB、'#rrggbb'、'rgb()'、颜色名
```

### 属性

| 属性 | 说明 |
|---|---|
| `r` / `g` / `b` | 分量，0~1 |

### 方法

| 方法 | 说明 |
|---|---|
| `set(value)` | 万能设置（数字/字符串/Color） |
| `setHex(hex, colorSpace)` | 十六进制 |
| `setRGB(r,g,b, colorSpace)` | RGB 浮点 |
| `setHSL(h,s,l, colorSpace)` | HSL |
| `setStyle(style, colorSpace)` | CSS 字符串 |
| `getHex(colorSpace)` | 取十六进制整数 |
| `getHexString(colorSpace)` | 取十六进制字符串 |
| `getStyle(colorSpace)` | 取 CSS 字符串 |
| `getHSL(target, colorSpace)` | 取 HSL |
| `offsetHSL(h,s,l)` | 偏移 HSL |
| `lerp(color, alpha)` / `lerpColors(c1,c2,alpha)` | 插值 |
| `multiply(c)` / `multiplyScalar(s)` | 乘法 |
| `add(c)` / `addColors(a,b)` / `sub(c)` | 加减 |
| `setScalar(s)` / `addScalar(s)` | 标量操作 |
| `clone()` / `copy(c)` / `equals(c)` | 克隆/复制/比较 |
| `convertSRGBToLinear()` / `convertLinearToSRGB()` | 颜色空间转换 |
| `toArray()` / `fromArray()` | 数组转换 |

```js
const c = new THREE.Color(0x42b883);
c.offsetHSL(0, 0, 0.1);      // 亮 10%
const hex = c.getHexString(); // '42b883'
```

## 五、Euler（欧拉角）

```js
new THREE.Euler(x, y, z, order)
```

### 属性

| 属性 | 说明 |
|---|---|
| `x` / `y` / `z` | 弧度 |
| `order` | 旋转顺序，默认 `'XYZ'`，可选 `'YXZ'`、`'ZYX'` 等 12 种 |
| `isEuler` | `true` |

### 方法

| 方法 | 说明 |
|---|---|
| `set(x,y,z,order)` | 设置 |
| `setFromQuaternion(q, order, update)` | 从四元数转换 |
| `setFromRotationMatrix(m, order, update)` | 从矩阵转换 |
| `setFromVector3(v, order)` | 从 Vector3 |
| `reorder(newOrder)` | 改变顺序但保持朝向 |
| `copy()` / `clone()` / `equals()` | 复制等 |
| `toArray()` / `fromArray()` | 数组转换 |

::: tip 大白话时间
旋转顺序很重要：先绕 X 转再绕 Y，和反过来结果不同。做第一人称相机用 `'YXZ'`（先左右后上下），能避免万向节死锁导致的怪异翻转。
:::

## 六、Quaternion（四元数）

```js
new THREE.Quaternion(x, y, z, w)
```

### 属性

| 属性 | 说明 |
|---|---|
| `x` / `y` / `z` / `w` | 分量 |

### 方法

| 方法 | 说明 |
|---|---|
| `set(x,y,z,w)` / `identity()` | 设置/单位化 |
| `setFromAxisAngle(axis, angle)` | 轴角表示 |
| `setFromEuler(e)` | 从欧拉角 |
| `setFromRotationMatrix(m)` | 从旋转矩阵 |
| `setFromUnitVectors(vFrom, vTo)` | 从一个方向转到另一个 |
| `angleTo(q)` | 夹角 |
| `multiply(q)` / `premultiply(q)` | 乘法（复合旋转） |
| `multiplyQuaternions(a,b)` | 两四元数相乘 |
| `slerp(qb, t)` / `slerpQuaternions(qa,qb,t)` | **球面插值**（平滑旋转） |
| `normalize()` | 归一化 |
| `inverse()` / `conjugate()` | 逆 / 共轭 |
| `rotateTowards(q, step)` | 朝目标旋转有限步长 |

```js
// 平滑转向目标
mesh.quaternion.slerp(targetQuaternion, 0.1);
```

## 七、Matrix4（4×4 矩阵）

### 属性

| 属性 | 说明 |
|---|---|
| `elements` | `number[16]`，列主序存储 |

### 方法

| 方法 | 说明 |
|---|---|
| `identity()` | 单位矩阵 |
| `set(...)` / `fromArray(arr)` / `toArray()` | 设置/转换 |
| `copy(m)` / `clone()` / `equals(m)` | 复制等 |
| `multiply(m)` / `multiplyMatrices(a,b)` / `premultiply(m)` | 矩阵乘法 |
| `makeTranslation(x,y,z)` | 平移矩阵 |
| `makeRotationX/Y/Z(theta)` | 旋转矩阵 |
| `makeRotationAxis(axis, angle)` | 绕任意轴旋转 |
| `makeScale(x,y,z)` | 缩放矩阵 |
| `makeShear(xy,xz,yx,yz,zx,zy)` | 错切 |
| `makePerspective(left,right,top,bottom,near,far,coordinateSystem)` | 透视投影 |
| `makeOrthographic(left,right,top,bottom,near,far,coordinateSystem)` | 正交投影 |
| `lookAt(eye, target, up)` | 视图矩阵 |
| `invert()` | 求逆 |
| `transpose()` | 转置 |
| `determinant()` | 行列式 |
| `decompose(position, quaternion, scale)` | 分解变换 |
| `compose(position, quaternion, scale)` | 组合变换 |
| `extractPosition(m)` / `extractRotation(m)` / `extractScale(m)` | 提取变换 |
| `applyToBufferAttribute(attr)` | 应用到顶点数据 |

## 八、Matrix3

方法类似 Matrix4，用于法线变换（`normalMatrix` 是 3×3）。

## 九、Box3（包围盒）

```js
new THREE.Box3(min, max)
```

| 属性 | 说明 |
|---|---|
| `min` / `max` | `Vector3`，最小/最大点 |

| 方法 | 说明 |
|---|---|
| `setFromObject(object, precise)` | 从物体计算包围盒（含子物体） |
| `setFromPoints(points)` | 从点集 |
| `setFromCenterAndSize(center, size)` | 从中心+尺寸 |
| `getCenter(target)` / `getSize(target)` | 中心 / 尺寸 |
| `expandByPoint(p)` / `expandByVector(v)` / `expandByScalar(s)` | 扩展 |
| `containsPoint(p)` / `containsBox(box)` | 包含判断 |
| `intersectsBox(box)` / `intersectsSphere(sphere)` / `intersectsPlane(plane)` | 相交判断 |
| `clampPoint(point, target)` | 限制点在盒内 |
| `distanceToPoint(p)` | 距离 |
| `union(box)` / `intersect(box)` | 并集 / 交集 |
| `translate(offset)` / `applyMatrix4(m)` | 平移 / 变换 |

## 十、Sphere（包围球）

```js
new THREE.Sphere(center, radius)
```

| 方法 | 说明 |
|---|---|
| `set(center, radius)` | 设置 |
| `setFromPoints(points, optionalCenter)` | 从点集 |
| `getCenter(target)` / `getBoundingBox(target)` | 中心 / 包围盒 |
| `containsPoint(p)` / `intersectsSphere(s)` / `intersectsBox(box)` / `intersectsPlane(p)` | 判断 |
| `clampPoint(p, target)` / `distanceToPoint(p)` | 限制/距离 |
| `translate(offset)` / `applyMatrix4(m)` | 变换 |

## 十一、Ray / Plane / Frustum

### Ray（射线）

`origin`（起点）、`direction`（方向，单位向量）。

方法：`set(origin,direction)`、`at(t,target)`、`recast(t)`、`closestPointToPoint(point,target)`、`distanceToPoint(point)`、`intersectBox(box,target)`、`intersectSphere(sphere,target)`、`intersectPlane(plane,target)`、`intersectTriangle(a,b,c,backfaceCulling,target)`

### Plane（平面）

`normal`（法线）、`constant`（到原点距离）。

方法：`setFromNormalAndCoplanarPoint(normal,point)`、`setFromCoplanarPoints(a,b,c)`、`normalize()`、`distanceToPoint(point)`、`intersectLine(line,target)`、`projectPoint(point,target)`

### Frustum（视锥）

用于视锥剔除。方法：`setFromProjectionMatrix(m)`、`intersectsObject(object)`、`intersectsSphere(sphere)`、`intersectsBox(box)`、`containsPoint(point)`

## 十二、Cylindrical / Spherical（柱坐标/球坐标）

| Cylindrical | 说明 |
|---|---|
| `radius` / `theta` / `y` | 半径、角度、高度 |
| `setFromVector3(v)` / `setFromCartesianCoords(x,y,z)` | 转换 |

| Spherical | 说明 |
|---|---|
| `radius` / `phi` / `theta` | 半径、极角、方位角 |
| `setFromVector3(v)` / `setFromCartesianCoords(x,y,z)` | 转换 |

## 十三、MathUtils（数学工具）

全部是静态函数，无需实例化：

| 函数 | 说明 |
|---|---|
| `MathUtils.degToRad(deg)` | 度 → 弧度 |
| `MathUtils.radToDeg(rad)` | 弧度 → 度 |
| `MathUtils.lerp(x, y, t)` | 线性插值 |
| `MathUtils.clamp(value, min, max)` | 限制范围 |
| `MathUtils.euclideanModulo(n, m)` | 欧几里得取模（负数也对） |
| `MathUtils.mapLinear(x, a1, a2, b1, b2)` | 区间映射 |
| `MathUtils.smoothstep(x, min, max)` | 平滑过渡（0~1） |
| `MathUtils.smootherstep(x, min, max)` | 更平滑过渡 |
| `MathUtils.pingpong(x, length)` | 往返运动 |
| `MathUtils.randInt(low, high)` | 随机整数 |
| `MathUtils.randFloat(low, high)` | 随机浮点 |
| `MathUtils.randFloatSpread(range)` | `-range/2` ~ `range/2` |
| `MathUtils.seededRandom(s)` | 可重复的伪随机 |
| `MathUtils.ceilPowerOfTwo(x)` | 向上取 2 的幂 |
| `MathUtils.isPowerOfTwo(n)` | 是否 2 的幂 |
| `MathUtils.generateUUID()` | 生成 UUID |
| `MathUtils.damp(x, y, lambda, dt)` | 帧率无关的阻尼插值（很实用） |

```js
// 帧率无关的平滑跟随（推荐！）
camera.position.x = MathUtils.damp(camera.position.x, target.x, 5, delta);
```
