# 无用需求博物馆

为一个从来不存在的问题，造一件看起来很专业的产品。

## 启动

需要 Node.js 22+。

```powershell
npm install
npm run build
npm start
```

浏览器打开 http://127.0.0.1:8787 。开发时用 `npm run dev`，浏览器打开 http://127.0.0.1:5173（同时启动 API 8787 与 Vite 5173）。

当前本机已配置服务器凭据。换机器时复制 `.env.example` 为 `.env`，填入 `LUX3D_API_KEY`。凭据不要提交到代码库或发送到浏览器。默认只监听本机；公开部署时设置 HOST=0.0.0.0，使用可信反向代理与 HTTPS，并限制调用权限和额度。

## 已实现

- 六件各具造型的 3D 概念装置，旋转、缩放、自动旋转、空间总览。
- 藏品分类、三档无用投票（仅本机）、叙事试用、展签链接分享和深链接。
- 需求输入 → 服务端造型提示词 → 真实 Lux3D G1 文生 3D → 异步查询 → 缓存 GLB → 展柜入藏。
- 生成失败提示、同一时间单任务、刷新恢复任务、GLB 下载、来源档案。
- 服务端持久化提示词、官方任务编号、状态变化、缓存记录；密钥不返回前端。

默认六件是 Three.js 程序化概念资产；只有明确标记“Lux3D 生成”的展品才来自 API。卡片图是概念示意，不冒充模型渲染。试用是幽默叙事，不是物理仿真。没有伪造全球投票数。

## 数据与备份

`data/generations.json` 保存生成任务，`data/audit.jsonl` 保存过程证据，`data/models/` 保存 GLB。这些文件默认不进 Git，应另外备份并带到部署机器。API 返回的原始产物地址会过期，GLB 已缓存后可离线展示；ZIP 下载仍依赖官方地址有效。

## 验证

```powershell
npm test
npm run build
node scripts/browser-check.mjs
```

浏览器测试使用本机 Microsoft Edge；若机器没有 Edge，可安装 Playwright 的 Chromium 并修改测试启动选项。测试不会调用收费生成接口，生成失败使用浏览器拦截模拟。服务端测试使用 mock 上游，不消耗额度。

## 参赛

详见 `docs/competition-rules.md`（已核验规则）、`docs/competition.md`（准备清单与演示脚本）、`docs/project-report.html`（可打印报告草稿）。

已核实截止：2026-11-19 19:00（北京时间）。报告和完整 Demo 为必交项；小红书 `#Aholo黑客松` 帖子链接及源码为加分项。最终以实际提交表单与报名协议为准。

本地可运行不等于已经提交。团队报名、公开部署、录制真实运行视频、确认报告并上传和社交发布均需参赛者完成。部署前请给生成接口增加登录或访问控制；当前版本适用于本机开发与受控展示，不宜把消耗额度的接口直接开放给陌生人。

## 第三方

Three.js (MIT)、Lucide (ISC)、Vite (MIT)、Playwright (Apache-2.0)，完整依赖见 lockfile。中文字体使用 Google Fonts Noto Sans/Serif SC（SIL OFL，可网络失败时回退系统字体）。生成模型权利及赛事传播范围须遵守 Aholo 服务条款、最终报名授权协议与第三方授权。
