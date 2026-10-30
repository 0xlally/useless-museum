# 参赛记录与演示准备

核验日期：2026-10-29，北京时间 UTC+8。本文记录可验证的规则、技术契约与待完成材料；不是已提交证明。社交文案仅供审阅，未发布。

## 官方来源与核验边界

- [赛事官网](https://www.aholo3d.cn/hackathon)：原始 HTML 的 description 明确为 2026.10.19–11.19；SPA 正文通过[渲染文本抽取](https://r.jina.ai/https://www.aholo3d.cn/hackathon)核对。抽取服务是第三方，规则归属于官网。更细的来源、歧义、授权边界见 [规则核验记录](competition-rules.md)。
- [Lux3D 原文档入口](https://lux3d.aholo3d.cn/docs)：当日 HTTP 200，但页面为 SPA，直接文本读取只有标题。没有从这个标题猜造 API。
- [Aholo 官方开放平台简介](https://labs.aholo3d.cn/api-docs/intro)、[API 参考页](https://labs.aholo3d.cn/api-docs/api-reference)、[Lux3D 单服务 OpenAPI YAML](https://labs.aholo3d.cn/api-docs/specifications/services/lux3d/openapi.yaml)：本实现的端点、认证、入参、响应与格式依据。单服务规范 `info.version: 2.0`。
- [官方 Lux3D 使用说明](https://labs.aholo3d.cn/api-docs/skills/lux3d)：说明异步创建、轮询、下载以及临时 URL 约两小时有效。该页部分风格与图片字段叙述较旧，字段以单服务 OpenAPI 为准。

## 已确认的硬性要求与日期

1. 作品必须使用 Aholo Lux3D，让它参与核心 3D 内容或关键创作流程。Aholo API、LuxReal 和其他工具可选。没有公开最低资产数量或最低调用次数。
2. 线上全球参赛，每队 1–3 人；单人也要创建团队，每个账号同时只能加入一队。
3. 报名开启为 **2026-10-19**。作品提交截止与成员锁定均为 **2026-11-19 19:00 UTC+8**。评审为 11 月 20–30 日，结果为 12 月初，未公布准确日时。
4. 必交项目报告书，包含过程截图、资产迭代对比或关键效果截图；必交完整 Demo，视频必须包含真实运行画面。官网标题“链接或视频”与正文同时提及链接和视频存在歧义，建议两项都准备，并以实际提交表单为准。
5. 小红书发布带 **#Aholo黑客松** 的项目介绍及对应链接属于加分项，需在结果公布前保持公开；源码属于加分项。当前未授权对外发布，本文仅提供草稿。
6. 确保代码、模型、图片、音乐等第三方内容有合法授权。原创权利由参赛者依法保留，展示传播和获奖使用的详细范围以最终报名条款为准，不能宣称已经核实全部授权。

评分：群核技术栈 30%、有趣程度 25%、创新性 20%、完成度 20%、传播 5%；总分由专家评委 70% 与玩家评委 30% 组成。

## 当前作品的 Lux3D 核心流程

用户提出日常困扰，服务器将原始文字保存在 `question`，构造一个单件荒诞科学仪器的造型描述作为生成 `prompt`。基于关键词的规则规划器有六种不同造型：影子对应环形测量框，哈欠对应收集容器与喇叭口，咖啡对应锅炉与杯托，灰尘对应标本抽屉与罩体，时间对应沙漏与螺旋轴，周一对应弹簧缓冲器。未知需求交给 Lux3D 根据具体问题设计连通单件，明确要求避免通用环形造型。整体材料方向为黄铜、象牙白珐琅，要求单件连通物体，减少背景和文字。它是确定性艺术指导规则，不宣称调用了语言模型，也不保证机械可制造或语义完全理解。

调用 Lux3D 文生 3D → 官方任务 ID → 真实异步状态 → GLB 本地缓存 → 浏览器交互展品。对于预先写好的完整造型提示，传入 `question` 和 `title` 时直接使用 `prompt`，保留原始问题与作品名。

六件常设展品已全部由真实 G1 任务生成并缓存：

| 展品 | 官方任务 | 原始 GLB | 浏览版 | 三角面 |
| --- | --- | --- | --- | --- |
| 影子限长器 | #4477428 | 7,731,300 B | 621,804 B | 96,729 |
| 哈欠收纳罐 | #4505646 | 6,939,068 B | 797,792 B | 99,360 |
| 冷咖啡二次杯套 | #4506067 | 6,972,536 B | 685,024 B | 96,851 |
| 灰尘队列整理机 | #4506171 | 7,115,492 B | 446,848 B | 99,039 |
| 马上到等待计时器 | #4506245 | 9,890,356 B | 918,560 B | 94,391 |
| 周一暂停按钮 | #4506327 | 9,711,020 B | 801,404 B | 97,556 |

原始资产合计 48,359,772 B，浏览版合计 4,271,432 B（约 11.3× 压缩），583,926 个三角面。浏览版使用 Meshopt 几何压缩、WebP 与 1024px 贴图；原始 GLB 保留，可通过 `/api/generations/<id>/download?format=glb` 下载。逐件 SHA-256、缓存时间与完整核验结果见 `data/provenance.json`、`/api/provenance` 与 `node scripts/verify-assets.mjs`。

后台 `data/audit.jsonl` 保存创建意图、实际请求字段、任务 ID、状态变化及模型缓存字节数；`data/generations.json` 保存任务恢复状态；`data/models/<id>.glb` 保存原始官方生成模型；`data/models/web/<id>.glb` 保存浏览版；`data/provenance.json` 保存校验清单。凭据、Authorization 头不写入审计，不返回浏览器。

真实任务曾观察到进行中 `outputs` 中含 null；适配器已增加 null 防护。当前六件资产均已用 `scripts/verify-assets.mjs` 从磁盘重新校验文件头与 SHA-256，不把 mock 测试当成官方资产证据。

## 核实后的官方 API

生产网关 `https://api.aholo3d.cn`。HTTP 头为 `Authorization: <API key>`，**不加 Bearer**。创建 POST 不自动重试，避免网络不确定性导致重复付费任务。

```http
POST /lux3d/v1/generate/text-to-3d/task/create
Content-Type: application/json
Authorization: <server-side key>
```

```json
{
  "prompt": "a single whimsical brass scientific instrument...",
  "style": "photorealistic",
  "version": "G1",
  "faceCount": 100000,
  "outputFormat": ["zip", "glb"],
  "enablePbr": true
}
```

创建成功响应 `{"c":"0","d":1256173,...}`。必须判断业务码 `c`，HTTP 200 并不代表业务成功。

```http
GET /lux3d/v1/generate/task/get?taskid=1256173
Authorization: <server-side key>
```

查询成功 `{"c":"0","d":{"taskId":1256173,"status":3,"outputs":[{"content":"https://.../result.zip"},{"content":"https://.../result.glb"}]}}`。0 初始化、1 运行、3 成功、4 失败、6 取消。0/1 继续轮询，查询业务成功不能直接当生成成功。运行中可能只有部分结果或 null 项，`NOT_REQUESTED` 不是 URL。

G1 返回 ZIP、GLB；请求 PLY 时另外返回 PLY。G1-Turbo 返回指定格式，省略/空格式默认为 ZIP。面数范围 10000–300000。GLB 为二进制 glTF 2.0，ZIP 可含 GLB、PBR 贴图等；规范没有承诺 GLB 是否使用 Draco、Meshopt、KTX2，浏览器必须用实际模型验证加载，不能预先宣称无压缩依赖。临时 URL 约两小时有效，服务端成功后缓存 GLB。

官方支持当前认证账号的分页任务历史 `GET /lux3d/v1/generate/task/list`，但本项目的本地列表只返回本机保存的生成记录，避免意外暴露账号中的其他项目。

## 本地服务契约

| 方法与路径 | 行为 |
| --- | --- |
| `GET /api/health` | `{ok,configured,provider,adapter,pollAfterMs}`；`configured` 只表示本机存在密钥，不能当成密钥有效或官方可达证明 |
| `POST /api/generations` | 接受 `{prompt,question?,title?}`；202 返回任务；默认一个活跃任务，重复并发 429 |
| `GET /api/generations` | `{generations:[...]}`，从本地审计状态恢复 |
| `GET /api/generations/:id` | 查询真实官方状态，公开字段含 `id,prompt,question,title,status,modelUrl,downloadUrl,assetBytes,assetSha256,cachedAt,error` |
| `GET /api/provenance` | 机器可读的资产清单：任务号、原始字节数、SHA-256、缓存时间与下载地址 |
| `GET /models/:id.glb` | 返回本地已缓存 GLB；存在浏览版时优先返回浏览版，并带 `immutable` 缓存头 |
| `GET /api/generations/:id/download` | `?format=glb` 下载原始 GLB；`?format=zip` 代理官方 ZIP |

状态为 `queued / processing / succeeded / failed / cancelled`。`modelUrl` 仅在 GLB 缓存成功后为 `/models/<id>.glb`，否则 null；官方成功但模型无法下载时保留错误解释。每 6 秒后台轮询，查询去重并设置 5 秒最短间隔。未配置返回 503 与 `LUX3D_NOT_CONFIGURED`，不会返回演示假结果。错误结构 `{error:{code,message}}`。

配置参考 [环境变量示例](../.env.example)。`LUX3D_API_KEY` 只在服务器读取，禁止 `VITE_*`、前端 localStorage、客户端 bundle 或公开仓库。`LUX3D_BASE_URL` 默认为官方网关；覆盖值仅由运维配置。模型域名采用允许列表且拒绝重定向，不允许客户端提交任意下载 URL。下载上限 180MB。

开发时由 Vite 将 `/api` 和 `/models` 代理到 `http://127.0.0.1:8787`。运行 `node server.mjs`；服务端会读取项目 `.env`。前端构建后，此服务也可托管 `dist`，静态文件限制在构建目录内，拒绝隐藏文件和越界路径。默认只监听 127.0.0.1；公开部署前需添加用户访问控制和费用配额，并通过 HTTPS 反向代理部署。当前实现为本机单进程演示，不支持多个进程同时写同一数据目录。

验证命令：`node --check server.mjs`、`node --test server.test.mjs`、`node scripts/verify-assets.mjs`、`npm run build`。集成测试使用虚假凭据和官方格式 mock，验证配置错误、鉴权字段、创建/轮询、null 产物项、GLB 缓存、SHA-256、provenance、恢复列表、并发、跨域、隐藏路径与无密钥审计；它不访问官方、不计费。

## 30 秒真实演示脚本

此处为拍摄脚本，30 秒是作品展示长度，**不是生成耗时承诺**。预先生成且缓存的展品需标明“此前使用 Aholo Lux3D 生成”。

| 时间 | 真实运行画面 | 旁白/字幕 |
| --- | --- | --- |
| 0–4 秒 | 首页与问题输入框 | “如果影子总是比自己先到场，能不能给它装一个限长器？” |
| 4–9 秒 | 输入问题，点击生成，展示真实排队状态 | “把一个小困扰，变成一件荒诞科学仪器。核心模型由 Aholo Lux3D 生成。” |
| 9–13 秒 | 明示“生成等待已剪辑”，展示后台任务记录 | “服务器保存真实任务与生成记录，生成需要等待。” |
| 13–23 秒 | 打开此前已完成展品，拖拽旋转、缩放和观察黄铜材质 | “这是一台影子限长器：一个没什么用，却想认真研究的发明。” |
| 23–27 秒 | 下载 GLB，展示已生成列表 | “它是真实可下载的三维模型，也可以继续成为新的创作素材。” |
| 27–30 秒 | 完整主画面与片尾 | “让无解的小事，长成能转一圈的怪点子。#Aholo黑客松” |

录屏必须为实际运行画面，不能把效果图或未完成任务剪辑成即时生成。只为演示创建一个新任务即可，避免重复消耗额度；也可仅展示已完成任务的完整证据链。

## 小红书文案草稿：未发布

标题：我给影子做了一台限长器，结果它真的变成了 3D

正文：

有些问题，可能根本不需要解决。但如果给它做一台仪器呢？

这次我想做一个荒诞科学仪器的小展厅：输入一个日常困扰，用 Aholo Lux3D 把它变成一件能旋转观察、能下载的三维展品。黄铜框架、指针和小旋钮，认真得像实验室里的古怪收藏。

录屏里会展示真实生成任务和实际模型。等待过程会明确剪辑，生成时间与造型结果都以真实运行情况为准。

你最想给哪个小麻烦发明一台毫无必要的机器？

#Aholo黑客松 #3D创作 #AI创作 #交互设计

发布前需要替换为实测画面、核对资产授权、确认公开可访问 Demo 链接；帖子链接现在不存在，不得将本文地址当成已发布证明。

## 提交前仍须完成

- [ ] 留存实际报名、组队和选题提交成功记录；本开发任务没有代替用户报名。
- [x] 六件常设展品均为真实官方任务：**#4477428 / #4505646 / #4506067 / #4506171 / #4506245 / #4506327**；原始 GLB 共 48,359,772 字节，全部缓存并加载。
- [x] `node scripts/verify-assets.mjs` 从磁盘重新校验 6/6 件 GLB 与 SHA-256；`data/provenance.json` 与 `/api/provenance` 给出同一组证据。
- [x] 浏览器确认空间总览 6/6 真实模型、单件检视、旋转、缩放、试用和投票正常；浏览器检查无脚本错误。
- [x] 已从 `docs/project-report.html` 重新导出 `artifacts/无用需求博物馆-项目报告草稿.pdf`，包含六件资产与 provenance 证据。
- [ ] 部署可公开体验的访问地址，配置凭据隔离、访问控制和调用额度；本机 localhost 不能当公开演示链接。
- [ ] 按脚本拍摄真实运行视频；在最终提交表单确认文件格式、大小、时长、Demo 链接与视频要求。
- [ ] 用户审阅社交草稿后才可对外发布；记录真实帖子链接并保持公开到结果公布。
- [ ] 下载并核对最终报名授权条款，确保第三方代码与资产授权记录完整。
- [ ] 在 2026-11-19 19:00 UTC+8 前完成官网提交，保存成功凭证。本文不代表已经参赛提交。
