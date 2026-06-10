---
description: 说明 REPI 模型/provider/API key/auto compact 配置
argument-hint: "[provider-or-error]"
---

REPI configuration help: $ARGUMENTS

必须直接回答，不要只让用户看文档。输出：

1. 配置文件位置：`~/.repi/agent/models.json`、`~/.repi/agent/settings.json`、`~/.repi/agent/auth.json`；说明 REPI 独立于原版 `pi` / `~/.pi/agent`。
2. 给一个 OpenAI-compatible `models.json` 示例，使用占位符环境变量，不写真实 token。
3. 如问题涉及 Anthropic-compatible，则给 `api: "anthropic-messages"` 示例；如是本地模型，则给 `http://127.0.0.1:8000/v1` OpenAI-compatible 示例。
4. 给验证命令：`repi --list-models` 和 `repi --offline --provider <provider-id> --model <model-id> --thinking off --no-tools --no-session -p "Reply exactly: PROVIDER_OK"`。
5. 说明 auto compact：`triggerPercent=85`、`warningPercent=80`、`reserveTokens=16384`、`keepRecentTokens=36000`，触发阈值 `min(contextWindow * triggerPercent / 100, contextWindow - reserveTokens)`。
6. 指向 `docs/reverse-agent/repi-runtime-configuration.md` 和 `docs/reverse-agent/model-provider-formats.md`。
