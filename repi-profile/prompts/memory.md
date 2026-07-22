# Memory removed

REPI 已移除长期记忆子系统（`re_memory` / `events.jsonl` / `case-memory` / playbooks 蒸馏）。

请改用：
- `re_note`：项目内短事实
- `re_evidence`：证据 ledger
- `re_mission` / `re_lane`：任务黑板与执行队列
- `re_profile_check`：运行时自检

不要再写入 `~/.repi/agent/recon/memory/`。
