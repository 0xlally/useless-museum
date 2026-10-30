# 服务端交接

实现与协议说明见 [参赛记录](competition.md)。

- [服务端](../server.mjs) 使用 Node 内置 HTTP、文件系统与 fetch，无运行依赖。
- 缓存完成时写入字节数与 SHA-256；启动时为旧缓存补齐证据。`/api/provenance` 与 `data/provenance.json` 提供逐件清单。
- `/models/<id>.glb` 优先返回 `data/models/web/` 下的 Meshopt + WebP 浏览版；原始 GLB 保留在 `data/models/`，通过 `?format=glb` 下载。
- [测试](../server.test.mjs) 隔离在系统临时目录，用虚假凭据验证官方格式、SHA-256 与 provenance，不触发付费调用。
- [配置示例](../.env.example) 不含密钥；真实密钥由主进程单独配置。

核验快照：2026-10-30 UTC+8。六件常设展品均已由真实创建任务生成并缓存；逐件任务号、字节数与 SHA-256 见 `data/provenance.json`。子代理未创建额外付费任务。

`node --test server.test.mjs` 已在本机执行通过（含 null 输出、生产根路径、六种造型规划、SHA-256 与 provenance 回归）。子代理 shell 的 ACL 设置曾返回 Win32 5，因此不宣称在子代理中执行过最终测试。
