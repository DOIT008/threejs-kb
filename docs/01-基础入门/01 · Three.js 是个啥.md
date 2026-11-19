# Three.js 是个啥？

一句话：**它是一个让你用 JavaScript 在网页里画 3D 的「工具箱」。**

你平时看到的网页，不管多花哨，本质都是一张**平面的画**——只有宽和高，没有「深度」。想在网页里搞出能转来转去、有立体感的东西，就得靠 3D 图形技术。

## 先说人话版本

浏览器自带一套画 3D 的底层接口，叫 **WebGL**。它很强，但特别难写：矩阵、向量、着色器（shader）全都要你自己算。写个会转的立方体，可能先掉一半头发。

::: tip 大白话时间
WebGL 给你的是一堆**最原始的零件**：齿轮、螺丝、弹簧。理论上啥都能造，但想直接拿它拼台车？先练五年手艺。

**Three.js 就是把这些零件提前装成了「发动机」「车轮」「方向盘」——你拿来拼就行。**

它帮你把矩阵运算、着色器编译、灯光计算这些脏活累活全包了，你只要说「这里放个球，给它红色，让它转」，它就给你画出来。
:::

### 深一层：从 WebGL 到 Three.js，中间到底省了什么

「Three.js 封装了 WebGL」这句话人人会说，但很多人并不清楚省掉的**具体是哪几坨代码**。看懂下面这段对比，你以后遇到诡异问题时就知道该往哪一层找。

用原生 WebGL 画一个三角形，你得亲手做这些事：

```js
// 原生 WebGL 的简化版（真实代码远不止这些）
const gl = canvas.getContext('webgl2');

const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, vertexSource);
gl.compileShader(vs);
const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, fragmentSource);
gl.compileShader(fs);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
const loc = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);

gl.drawArrays(gl.TRIANGLES, 0, 3);
```

换成 Three.js：

```js
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x42b883 }));
scene.add(mesh);
```

省掉的不是「几行代码」，而是**四类固定的脏活**：

| 层次 | 原生 WebGL 你要做 | Three.js 帮你做 |
| --- | --- | --- |
| 着色器 | 手写 GLSL、编译、链接、报错排查 | 内置材质自动管理；要自定义时也有 `ShaderMaterial` |
| 矩阵数学 | 自己算 MVP 矩阵、法线矩阵、视图矩阵 | `camera` / `Object3D` 自动算，`updateMatrixWorld()` 统一更新 |
| 状态机 | 手动绑定 buffer、切换 program、管纹理单元 | `renderer.render()` 内部按物体状态自动切换 |
| 资源生命周期 | 自己管 GPU buffer / texture 的创建与释放 | `geometry.dispose()` / `material.dispose()` 统一入口 |

::: tip 大白话时间
原生 WebGL 像**开手动挡**：离合、换挡、油门全靠脚，开熟了很爽，但新手上路先熄火十次。

Three.js 像**自动挡**：你想加速就踩油门，换挡它自己来。只有当你想玩漂移（自定义 Shader）时，才需要手动介入。
:::

**知道这一层有什么用？** 出问题时你能分层定位：

- **物体不见了** → 多半在「矩阵/相机」层（位置、near/far、包围球剔除）
- **颜色不对** → 多半在「着色器/色彩管理」层（贴图 colorSpace、toneMapping）
- **画面卡** → 多半在「状态机」层（draw call 太多、材质频繁切换）
- **越跑越卡** → 多半在「资源生命周期」层（忘了 dispose）

后面每一章其实都在讲这四层中的某一层。

## 它能做什么？

- **3D 产品展示**：一颗能 360° 旋转的球鞋，比九张静态图有说服力
- **数据可视化**：把表格里冰冷的数字，变成会动的立体图表
- **网页小游戏**：不用下载安装，点开链接就玩
- **建筑 / 室内预览**：装修前先在房子里「走」一遍
- **数字孪生**：把工厂、城市搬进浏览器里实时监控
- **各种酷炫特效**：粒子、星空、流体、模型翻转……

::: tip 小贴士
你玩过的很多网页 3D 效果——比如苹果官网的产品展示、一些汽车官网的看车页面——背后大多是 Three.js（或同类库）在做。
:::

## 学习它要准备什么？

好消息：**不用装任何 3D 软件，也不用买服务器。**

| 你需要 | 说明 |
|---|---|
| 一点点 JavaScript | 会写 `const a = 1`、会写函数就够了 |
| 一个现代浏览器 | Chrome / Edge / Firefox 都行 |
| 一个代码编辑器 | VS Code 推荐 |
| 一点点耐心 | 前 30 分钟可能全是黑屏，正常 |

::: warning 注意
不需要先学 WebGL，也不需要数学很好。初中几何知识（什么是坐标、什么是角度）就够起步了。线性代数那些东西，等你想深入着色器时再补也来得及。
:::

## 这本书怎么读？

本知识库按下面的 **4 阶段路线**走，建议按顺序来。每一步都配了能直接跑的代码——**别只看，一定要动手敲一遍**。

| 阶段 | 读什么 | 这一阶段要解决什么 |
|---|---|---|
| ① 学习路径起步 | [7 天学习路线图](</00-学习路径/01 · 7 天学习路线图>)、[API 速查总表](</00-学习路径/02 · API 速查总表>)、[术语表](</00-学习路径/04 · 术语表>)，再配合本书「基础入门」（环境搭建、第一个场景、三件套） | 先用路线图建立整体印象，遇到陌生术语回头查术语表，别一上来就啃 API |
| ② 核心与交互 | 「核心概念」（几何体、材质、坐标、光照）+「动画与交互」（动画循环、控制器、鼠标拾取） | 把场景搭起来、让它动起来、能响应鼠标——这是所有 3D 项目的地基 |
| ③ 进阶与 API 查阅 | 「进阶特性」（贴图、模型、后期、着色器、性能）+「API 速查手册」按需翻；卡住了翻[常见错误速查](</00-学习路径/03 · 常见错误速查>) | 做复杂效果时随查随用，不必从头背 API，报错了第一时间能定位 |
| ④ 实战方向分流 | 想做业务落地 → [数字孪生与数字工厂](</10-数字孪生与数字工厂/01 · 数字孪生是什么>)；想上线不踩坑 → [生产级专题](</09-生产级专题/01 · 内存管理与泄漏排查>)；想边玩边学 → [交互实验室](</11-交互实验室/01 · 交互演示总览>) | 按自己的目标选一条主线深入，把前三阶段的知识真正用起来 |

每一章都配了能直接跑的代码。**别只看，一定要动手敲一遍**——3D 这东西，看十遍不如跑一遍。

## 一个心理准备

刚开始你会遇到这些情况，都正常：

- 页面上什么都没有，一片黑
- 写得明明没错，物体却跑到屏幕外去了
- 加了灯但画面还是黑的
- 改了参数却没反应

这些坑后面[「排错手册」那一章](</05-实战与排错/18 · 常见问题排错>)会专门讲。现在你只需要知道：**每个人都这么过来的。**

不过前 30 分钟的黑屏，其实翻来覆去就四类。先记这张表，能省你一小时：

| 类型 | 典型症状 | 一眼自查 |
| --- | --- | --- |
| **没画出来** | 页面空白、F12 里找不到 `<canvas>` | 有没有 `document.body.appendChild(renderer.domElement)`？ |
| **画布是空的** | 有 canvas，纯黑一片 | 控制台有没有红字？是不是 `file://` 直接打开的？ |
| **画了但看不见** | 控制台没报错，物体就是不出现 | 相机是不是贴在物体脸上？把 `camera.position.z` 改成 5 试试 |
| **整个黑但物体该有颜色** | 有轮廓但全黑 | 材质是不是 `MeshStandardMaterial` 却一盏灯都没加？临时换成 `MeshBasicMaterial({ color: 0xff0000 })` |

::: tip 大白话时间
黑屏不是「你写错了」，而是**信息在某一层断了**。

画布没进页面 → 断在「显示」这层；canvas 里没东西 → 断在「渲染」这层；有东西但全黑 → 断在「光照/材质」这层。

按层查，比逐行读代码快十倍。完整流程见[常见问题排错](</05-实战与排错/18 · 常见问题排错>)。
:::

::: tip 大白话时间
学 Three.js 就像学开车：一开始你满脑子都是「离合、油门、方向盘」，手忙脚乱。但开多了，这些就变成肌肉记忆了。

Three.js 的「离合油门」就是**场景、相机、渲染器**——记住这三个词，你已经赢在起跑线上了。
:::
