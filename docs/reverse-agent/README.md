# REPI Reverse/Pentest Agent Docs

REPI 的主题是逆向渗透执行，不是泛安全助手、通用 coding agent 或纯自研 agent 框架。开发时优先强化 reverse / pentest / pwn / web/API / mobile / firmware / DFIR / malware triage 的真实工具链、证据产物和 specialist/subagent 协作。

项目可以大改；方向比兼容旧形态更重要。保留 Pi / Claude Code 风格 runtime、插件、MCP、工具调用和 subagent 的成熟机制，删除或重塑不能服务逆向渗透执行的臃肿控制平面。

本目录只保留 REPI 的普通使用和运行时说明。通用验证入口是：

```bash
npm run check
node scripts/reverse-agent/repi-smoke.mjs . --json
npm run smoke:install-path -- --json
npm run smoke:release -- . --json
npm run smoke:extensions -- --json
```

Release workflow 在上传 GitHub Release tarball 前会跑 `npm run smoke:release -- . --skip-build --json`。这条 smoke 会把四个 workspace 包 pack 成 `.tgz`、装进 fresh project，然后验证 `repi` 命令、`/goal` print/json/RPC、fresh env-only 模型、旧默认模型覆盖和 `repi doctor`。不要发布只经过 build/check、没有经过 tarball 安装验证的资产。

核心文档：

- `mainline-overhaul.md`：REPI 主线大改方向、产品边界和迁移顺序。
- `model-provider-formats.md`：模型 provider、价格、缓存和兼容接口配置。
- `repi-runtime-configuration.md`：运行时配置、compact、profile、模型与诊断。

REPI 的原则是：按正常安装、正常模型配置、正常 `repi` 命令运行；不要依赖某台机器、某个私有 provider、某个特定 MCP 或一批特制测试脚本。
