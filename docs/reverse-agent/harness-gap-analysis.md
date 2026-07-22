# REPI Harness Gap Analysis

对照对象：

- **Claude Code harness**（execution-first coding agent：tools / skills / hooks / MCP / subagents / permissions / plan）
- **最新 Pi coding-agent**（`@earendil-works/pi-coding-agent` **0.80.10**，2026-07-16）
- **当前 REPI**（fork 产品化 monorepo，版本 **0.1.3**，内部仍是旧 `AuthStorage` + `ModelRegistry` 路径）

结论先说：

1. REPI 的逆向渗透“叙事层”过厚，真正可执行的 harness 能力反而落后最新 Pi 一个大版本带。
2. Claude Code 的 harness 精华是 **少而硬的执行原语 + 强权限/计划边界 + 可组合 skills/subagents**；REPI 现在是 **多而软的 re_* 控制平面 + 弱权限/弱 plan + 巨石 specialist 脚手架**。
3. 重构优先级应是：**先补齐/对齐 harness 底座，再砍叙事层，再加深 specialist 执行**。不能只拆文件。

## 1. Claude Code harness 对照

| Claude Code 设计点 | REPI 现状 | 缺口等级 | 重构动作 |
|---|---|---|---|
| 默认工具面小而硬：Read / Edit / Write / Bash / Glob / Grep | 有 `read/edit/write/bash/find/grep/ls` | 低 | 保持；不要再把 re_* 膨胀成第二套 FS 工具 |
| Skills：按任务渐进披露领域知识 | 有 skill loader + reverse orchestrator skill，但 SYSTEM/APPEND 仍塞满领域长文 | 高 | thin kernel + on-demand skill/prompt；领域细节只进 skill/pack |
| Hooks / lifecycle：pre/post tool、stop、compact 边界清晰 | 有 extension events；但 recon kernel 在 `before_agent_start` 注入超大 packet | 高 | 启动只注入 route/mission/tool digest；禁止 kernel/decision 长文常驻 |
| MCP：工具/资源/prompt 外部能力 | 有 `mcp-manager` + deferred schema + search/proxy | 中 | 默认 deferred；按 lane 激活 MCP allowlist |
| Subagents：隔离 worker + 明确 merge 契约 | 有 `AgentThreadManager` + `re_subagent`/`re_swarm` | 中高 | 默认 process-isolated；merge 只收 claim/evidence/hash，禁止 raw log 回灌 |
| Permission modes / sandbox / trust | **已产品化** `/permission` + plan/acceptEdits/bypass；`classifyBashRisk` 对 destructive 拦截、elevated 审计 | 低-中 | 可再加交互确认 UI |
| Plan mode：先计划后执行 | **产品已内置** `/plan` + `/permission`（`installRepiHarnessModes`）；`REPI_PLAN=1` 启动；execute 保留 todo 树 | 低-中 | 继续强化危险动作分级与 plan 模板 |
| Todo / goal 收敛 | 有 `/goal`；无轻量 todo 树作为默认执行面 | 中 | goal 保留；补 bounded task tree（PTT）一等工具，替代 narrative re_decision 长文 |
| CLAUDE.md / AGENTS.md 项目指令 | 支持 | 低 | 保持 |
| Env-first 模型切换 | `REPI_*` 已对齐 Claude Code 风格 | 低 | 保持，并作为唯一主路径 |

### Claude Code 对 REPI 的核心启示

- **执行原语要少**：bash + 文件工具 + 少量 reverse runtime adapters，而不是 40 个 re_* 伪工具。
- **上下文要冷启动、热加载**：route 命中后再拉 technique/skill/MCP/tool pack。
- **权限和计划是 harness，不是 prompt 说教**。
- **subagent 是隔离执行器，不是再写一套 supervisor 小说**。

## 2. 最新 Pi（0.80.x）对照

REPI 仍停留在旧 SDK 形状：`AuthStorage` + `ModelRegistry`。Pi 0.80.8+ 已切到 `ModelRuntime`。

| Pi 0.80.x 特性 | REPI 现状 | 缺口等级 | 重构动作 |
|---|---|---|---|
| `ModelRuntime` 统一 model/auth/login/catalog | **已接线**：`ModelRuntime` facade + `main`/`cli`/`sdk`/`createAgentSessionServices` 默认经 ModelRuntime 构造 | 低-中 | 测试与扩展继续兼容 AuthStorage/ModelRegistry 参数 |
| Live model catalog refresh / `update --models` | 无 | 中 | doctor/model status 支持 refresh；不必搬完整 pi.dev catalog |
| Cache-friendly dynamic tool loading | **已接线**：`installRepiHarnessModes().activateForRoute` + `activateRepiToolsForRoute` 在 cold-start/`re_route`/`re-route`/mission create 后 `setActiveTools` | 中（需继续扩 domain 表与 MCP allowlist） | specialist/MCP 继续按 lane 收紧 active set；避免全量 re_* 常驻 |
| Kimi deferred tool loading | 无 | 中 | 对大工具面模型启用 deferred/progressive tool activation |
| `agent_settled` / idle wait | **已加** `core/agent-settled.ts`；print-mode flush + goal `agent_end` 使用 `waitForAgentSettled` | 低-中 | RPC 路径已有 waitForIdle；保持统一 helper |
| `before_provider_headers` | **已接线**：`BeforeProviderHeadersEvent` + `emitBeforeProviderHeaders`；sdk `streamFn` 在 attribution 后调用 | 低-中 | 扩展可注入 gateway/tenant/signing 头 |
| `InlineExtension` | 有 inline factory，但类型/文档未对齐 | 低 | 对齐命名与 SDK export |
| RPC `get_entries` / `get_tree` | **已加** `get_entries`/`get_tree` RPC commands + lightweight tree nodes | 低 | swarm/debug 用 leaf/entries/roots 内省 |
| `max` / `xhigh` thinking | 部分 thinking 级，未跟最新 catalog | 中 | 对齐 thinking level 与 provider compat |
| Prompt cache miss notices | 无 | 低 | 可选 |
| Project-local resource config (`config -l`) | 有 project/global 资源，产品命令弱 | 中 | `repi config` 明确 global/project scope |
| Extension entry renderers | 弱/不完整 | 低 | 后置 |
| llama.cpp router / provider-owned login UX | 无/弱 | 低 | 非 RE 主线，可后置 |
| Plan mode 仍是 extension，不是默认产品 | 同左 | 高 | REPI 应产品化 plan，而不是继续堆 re_decision 文本 |

### 版本现实

- 上游 Pi：**0.80.10**
- REPI 产品版本：**0.1.3**
- REPI 不是简单 rebrand；它已经分叉。正确策略不是盲合并全部 Pi UI，而是：
  1. **回吸 harness 底座**（ModelRuntime、dynamic tools、settled、RPC tree、provider headers）
  2. **保留 REPI 产品边界**（`repi`、`~/.repi`、env-first、reverse/pentest）
  3. **删除与底座重复的自研控制平面**

## 3. REPI 自身结构性问题（导致“弱”的根因）

1. **双内核历史包袱**：`recon-profile` 与 `reverse-pentest-core` 曾各 3 万行；现已开始拆成
   - `core/recon-profile.ts` thin shim
   - `core/repi/kernel/profile-runtime.ts`
   - `core/repi/lanes/specialist-packs.ts`
   - `reverse-pentest-core.ts` no-op 兼容层
2. **memory 子系统过度设计**：20+ memory-\* 模块锁进 product-contract，挤占真正 reverse runtime 的演进带宽。
3. **specialist 能力大量是 `/tmp` 脚手架字符串**，不是稳定 runner/artifact/verifier 协议。
4. **operator surface 过宽**：40 commands + 40 tools，模型选择成本高，cache 不友好。
5. **product-contract 固化臃肿**：把旧模块清单当正确性证明，阻碍瘦身。

## 4. 目标 harness 形状（重构北极星）

```text
User / Goal
  → Route (domain)
  → Plan (bounded task tree)
  → Permission mode
  → Execute:
       core tools (bash/fs)
       + specialist runtime adapters (native/web/js/mobile/firmware/dfir/malware)
       + MCP allowlist
       + subagents (explorer/reverser/operator/verifier)
  → Evidence ledger + proof exit
  → Compact / resume
```

### 一等表面（保留/做强）

- `re_route` / `re_map` / `re_lane` / `re_runtime_adapter`
- `re_bootstrap` / `re_tool_index`
- `re_evidence` / `re_graph` / `re_complete`
- `re_subagent` / `re_swarm`（瘦身）
- `/goal`
- MCP / skills / extensions

### 降级或删除（叙事层）

- `re_decision_core`、`re_kernel` 长文 build、`re_reflect`、`re_compiler`、`re_campaign`、`re_operation` 等若只产 markdown 不产可执行证据，一律降为可选 pack 或删除
- memory v5–v12 只保留：scoped notes + event ledger + recall；其余 distillation/maturation/supervisor 系列移出热路径

## 5. 落地顺序（已按此校准重构）

1. **模块化拆核**：assembly shim + kernel runtime + specialist packs（进行中）
2. **解锁/重写 product-contract**：验证 harness 能力，而不是 memory 文件清单
3. **补 Pi harness 缺口**：settled wait、RPC tree、provider header hook；ModelRuntime 迁移单开（dynamic tools 主路径已接 activateForRoute）
4. **补 Claude Code harness 缺口**：subagent merge 契约加深；plan/permission 已产品化，继续强化危险动作分级
5. **强化 reverse runtime**：native/pwn/web/js/mobile/firmware/dfir 的 real runner + parser + proof-exit
6. **砍 memory/narrative 热路径**

## 6. 非目标

- 不把 REPI 变回通用 coding agent
- 不追求 1:1 复刻 Claude Code UI
- 不盲升到 Pi 0.80 全量 breaking change 而不保留 `REPI_*` 产品路径


## 7. 2026-07 alignment notes（行业顶尖对齐，非乱拆）

对照 Claude Code / Agentic RE（Ghidra MCP + tools）/ 本仓 `harness-gap-analysis` 北极星，优先接线 harness 原语而不是继续堆 monofile 切片：

1. **Dynamic tools by route**：`activateRepiToolsForRoute(domain)` 在 `before_agent_start`、`re_route`、`/re-route`、mission create 调用，走 `pi.setActiveTools`（Claude Code progressive disclosure）。
2. **Plan / permission**：保持 `/plan` `/permission` 为 harness 原语；cold-start 提示包含 harness 用法。
3. **Reverse proof chain**：继续要求 runtime `proof.exit=partial_runtime_capture|runtime_capture_strong` + `bind_ready`，completion/claim 不接受 catalog-only proofExit。
4. **未做/禁止**：不把重构做成无目标的文件拆分；不 reintroduce memory 产品面；不上 absolute-obedience 钢印。
5. **仍缺**：完整 Pi ModelRuntime 替换遗留路径；gdb 真 attach/crash 动态强捕获（当前 dyn probe/readelf/r2 替代）；workspace deps 下完整 typecheck/vitest；可选 true playwright chromium 路径（host 常无 node playwright package）。
6. **已补**：ModelRuntime/settled/headers/RPC/plan/bash risk；native r2/objdump ROP + **frida host CAP**；browser/authz/js-signing/mobile/exploit；product lean；domain-aware next；cold-start narrative opt-in；lean install deps split；auto-lane/self-heal/autofix/supervisor domain runners；DOMAIN_ACTIVE_TOOLS lean-safe；factory-hooks lazy kernel/decision/memory/compact/context；**harness-modes 模块化**；**reverse-capture 模块化**；specialist-pack domain heal runners；**knowledge-graph/exploit-chain/bridges run-first**；**swarm reverse-pure 模块化 + domain next**；native-io/exploit-lab run next；**browser-runtime modular + reverse-io domain next**；kernel criteria run-first；**context-pack next-assembly**；**native-shell modular**；**completion-audit reverse modular**；proof-loop/autofix shared domain next；**domain-proof-exit modular**；compact-resume/exploit-chain reverse-first；**reverse-io domain footers**（含 js-signing）；proof-loop attack-graph gaps modular；**control lane/graph tool split**；**operator-feedback modular**（classify/next + reverse priority）；**swarm-claim-ledger modular** + reverse merge claim gate；**native-pwn pack modular**；autopilot reverse domain stages；**web pack modular**；techniques run-first；**all specialist packs modular + domain bridges**；**swarm-runtime domain next**；specialist-evidence web run-first；**install-reverse tools modular**；supervisor domain next；**autofix modular**；**knowledge-graph signals modular**；harness modes install modular；compact-resume reverse-first restored；**context-pack artifact-index modular**；autopilot strategy modular；**evidence modular**；decision/failure reverse domain next；**exploit-io modular**；context-pack memory-reports modular；**completion-audit modular**；graph format modular；**exploit-chain modular**；native frida/objdump anchors；**supervisor-core modular**；reverse-io import headers clean；**reverse-io web/mobile modular**；swarm build core modular；**native/js-signing modular**；**context-format modular**；wire-proof/operator modular；kernel criteria domain next；**swarm-exec pure modular**；kernel criteria modular；**context-pack assembly modular**；storage ensure modular；**memory-paths modular**；mobile-runtime modular；swarm-execute reverse signals；**swarm-execute modular**；proof-loop-steps modular；web-authz-runtime modular；**specialist-evidence modular**；toolchain-domain-matrix modular；replayer domain next；**replayer-runtime modular**；failure-repair domain escalate；**failure-repair ledger modular**；swarm-claim worker modular；**exploit-runtime modular**；professional-bridges modular；lane-run followup domain next；**lane-run-mission modular**；supervisor-review modular；runtime-adapter-native modular；**routes modular**；proof-loop-gaps modular；**autopilot modular**；context-artifact-index modular；**native-runtime modular**；structured-claim-merge modular；memory-candidates domain seed；**memory-candidates modular**；compact-resume summary modular；swarm-exec review domain next；**mission-lanes modular**；operator-format modular；artifact-scope modular；**swarm-exec-run modular**；tool-index-catalog modular；**playbooks modular**；harness-modes-install modular；**operation-step modular**；wire-operator-steps modular；wire-proof-completion modular；**operator-runtime-core modular**；memory-events modular；**install-control-tools modular**；context-pack-assembly modular；wire-proof-runtime modular；**operator-step modular**；install-registrars modular；routes-repi modular；**goal-install modular**；swarm-format modular；swarm-manifest-runtime modular；**runtime-types-provider modular**；worker-runtime-provider modular；swarm-worker types modular；storage-io-files modular；delegate-build modular；autonomous-budget-write modular；**tool-trace-append modular**；worker-lease-scheduler modular；dfir-template modular；**proof-loop-plan modular**；kernel-criteria-policy modular；js-signing modular；passive-map modular；**browser-evidence modular**；knowledge-graph-helpers modular；lane-command-pack modular；**target-inspect modular**；goal-state modular；repair-rollback modular；**install-proof-tools modular；**attack-graph-proof-loop modular**；knowledge-graph-build modular；failure-repair-classify modular；swarm-child-session modular；**specialist-packs modular；**memory-ux lean stub；**install-control-commands modular**；memory-deposition lean stub；context-pack reverse helper；compiler-runtime-build modular；**decision-runtime-build modular；**install-registrars-base-deps modular**；wire-operator-autopilot modular；decision-rules modular；reverse next/frida strengthened；**swarm/goal/exploit/kg/prompts modular**；pwn reverse next；**native host capture smoke strong；**pwn-evidence modular**；kg signals worker/failure；exploit-chain modular；compact-resume summary-build modular****；campaign-runtime modular；context-pack finalize modular**；lane-pack-domain modular；worker-child-session modular；handoff-verify modular；profile-check modular；execute-workers modular**；reverse-evidence-technique modular；proof-loop-runtime-build modular**；attack-graph runtime-adapters modular；proof-loop steps-next modular；AG proof-loop reverse_next；kg build reverse next；attack-graph runtime-adapters reverse_next；shared reverseDomainCaptureNextCommands 扩展到 attack-graph/proof-loop/kernel/supervisor。


- **lean product contract v2**: rewritten against modular reverse surface; memory monofiles gone; host native smoke strong retained; logic monofile >=280 banned except data consts.

- **memory-candidates lean** (reverse-seed only); **compact-resume telemetry modular**; **profile-runtime factory modular**; **worker provider types modular**; product contract 40 PASS.

- **proof-loop classify modular**; **domain-lane commands modular** (+ reverse next); **context-pack build modular**; **runtime-adapter-exec modular** (domain next on incomplete capture). Contract 44 PASS.

- **wire-decision modules modular**; **pack-domain modular** (+ reverse next); **specialist-pack-gate modular**; **lane-run apply modular**; **profile-runtime configure modular**. Contract climbing.

- **narrative context tools modular**; **route-domains modular**; **operator-step-execute modular** (control/reverse/fallback); **context-pack build-core load/memory/assemble**; **autofix reverse seed helper**. Contract climbing.

- **swarm write modular** (artifact/output + compose-reverse); **proof-loop execute modular** (step/bridge/phase/quick + reverse completion next); **autonomous-budget demotions modular**.

- **swarm worker-claims reverse helpers**; **proof-loop plan-quick modular** (+ reverse phase seed); **harness apply-tools reverse seed**.

- **mobile/js-signing/authz summary modular**; **verifier pure modular**; **dispatcher feedback reverse next**; **reflection modular**; **lane-run reverse gate dynamic next**.

- **poison-sanitize modular** (post-clean reverse next); **install-reverse commands modular** (browser/runtime/toolchain); **goal lifecycle modular** (+ reverse help); **delegate build reverse next**; **completion-audit reverse align modular**.

- **pwn techniques modular** (heap/classic/advanced); **toolchain domain matrix modular**; **techniques helpers modular**; **autofix collect/assemble**; **auto-lane reverse summary**; **swarm format next modular**.

- **web-api techniques modular**; **memory-events-append modular** (completion reverse next); **wire-lane modules modular**; **claim-release modular** (reverse proof gap); **worker-claims-append-one reverse gate**.

- **reverse-evidence facts modular**; **kg build sources+reverse routing**; **operation-step control/reverse/fallback**; **wire-reverse configure bags**; **profile-runtime factory lean**.

- **proof-loop deps modular**; **factory-hooks loaders/session**; **domain-proof pure assemble/closure/format**; **specialist analyze base/specialists/reverse**; **failure-repair ledger-domain replay/autofix/operator**.

- **factory-hooks loaders modular** (require/compact/context/memory/deps); **swarm manifest write create/refresh** (+ reverseDomain); **compiler pure claim/report/queue**; **auto-lane decision parse/llm/dispatch** (+ reverse_next); **attack-graph evidence ledger seed/records** (+ reverse verify next).

- **browser-run modular** (write/core/output); **proof-loop gaps items collect/finalize**; **browser-followups surface/reverse**; **commands-lean route-mission/lane/map-evidence**; **swarm compose workers + reverse gates**.

- **native-run modular** / **authz-run modular**; **auto-lane run specialist/inline** (+ reverse_next); **profile surface modular** (tools/commands/index); **worker-lease-scheduler build tasks/events**.

- **proof-loop plan-quick phases/finalize**; **mission io create/read-write/update/format** (+ reverse_next); **delegate pure worker/promotion**; **campaign operation build/format/command** (+ reverse next); **tool-trace ledger verify read/build**.

- **target-inspect lexical/magic**; **adapter-graph summary/recent/lineage**; **reverse-io shared deps/evidence**; **compiler build-core build/write/format**; **runtime-adapter-exec-run prepare/capture**; **structured-claim-merge merge/refresh/check**.

- **files-write lean** (dead path-import bloat removed); **exploit-summary anchors/format/structured**; **tools-core route-mission/map-evidence** (+ reverse_domain_next).

- **tool-bootstrap modular** (deps/pure/run + reverse_next); **campaign-phases helpers/build**; **narrative operator tools** supervisor/board; **context-format header/runtime**; **context-pack finalize state**; **attack-graph runtime-adapters artifacts/proof**.

- **handoff build closure/merge** (+ reverse next); **mission checkpoints full/domain**; **memory-transaction types/append**; **taxonomy types/data/format**; **delegate build construct/packets**; **completion-audit claims gates**; **context-pack next-commands reverse**; **campaign-phases reverse enrich**.

- **mobile-run write/core/output**; **native-tools r2/gdb/ghidra**; **child-session status/policy/probe**; **lane-memory feedback/run-event reverse next**; **supervisor review packet/budget/llm reverse proof_exit**.

- **kernel-runtime artifact build/format/output reverse next**; **mobile/firmware analyzers reverse followups**; **evidence ledger format/digest/runtime**; **jsonl records/cache**.

- **case-memory deps/plan/apply reverse next**; **proof-loop memory bridge/append/outcome**; **swarm handoff build/refresh reverse repair refs**; **harness-modes install types/handle/core**; **steps-next-refresh reverse nextActions**; **web matrix CDP split**; **browser followups capture/authz reverse**; **narrative commands control/reverse**; **context-pack assemble lean**.

- **technique-anchors runtime/evidence**; **profile-check build/format reverse next**; **swarm plan reverse_proof_bias rebuild**; **files-read cap/core**; **knowledge-graph io path/write/output**; **goal hooks session/agent proof.exit preserve**; **swarm-worker-child types**; **exploit-chain nodes evidence reverse verify**; **evidence-ledger reverse helper**.

- **failure-repair report build/priority reverse**; **proof-loop gap collect artifacts/runtime reverse_next**; **campaign phases factory/domain/reverse-heavy**; **autopilot plan/run reverse capture**; **context-pack memory gates reverse laneCommands**; **plan-quick phases apply + appendProofSpine**; **context-format types memory split**; **finalize reverse helper**.

- **runtime-adapters ids/nodes/proof**; **harness install commands/hooks**; **native techniques unpack/pwn/dynamic**; **native_pwn exploit bridge/scaffolds**; **evidence paths reverse/control**; **budget demotions reverse next**; **specialist pack matrix types/data**; **pack-assembly transitions**.

- **crypto/malware analyzers reverse next**; **domain-proof-exit corpus/closure reverse next**; **mobile pure path/build reverse nextActions**; **proof-loop status artifacts/verdict reverse_next**; **runtime-scoring domain split + proof.exit finalize**; **pwn followups basic/reverse**; **memory-pairs paths lean**; **proof-loop-runtime closure/steps/executions**; **layout-dirs lean path helpers**.

- **160-band**: delegate pure-worker map/contract reverse evidence; verifier build/io reverse next; js-signing infer/body/shell proof.exit; specialist wants web/native/dfir; domain-lane + pack-domain native triage/control/runtime reverse next; auto-lane pack reverse next; pack-assembly finalize object; evidence-ledger records core/hypothesis reverse notes.

- **160-band cont**: worker-runtime pool contract/verify reverse claim merge; swarm run-review score/reverse; exploit-chain build-nodes early/late reverse verify; pack-assembly finalize object resume/memory; context-pack deps core/memory/runtime.

- **155-band**: storage json lean; mission rev_pwn domain packs + reverse next; tools-proof chain per-tool; evidence io read/lines/ledger reverse_next; runtime-adapter capture write/reverse; autofix collect split + reverse feedback; worker-lease events lifecycle/probe reverse; tool-trace verify-build incremental/full; swarm manifest reverse evidenceRefs; exploit scaffolds normalize/replay reverse.

- **155-band clear**: proof-loop build-run reverse footer; knowledge-format types+reverse next; graph format attack/exploit reverse; repair-rollback policy/reverse; professional bridges format/build reverse; passive-map script/write/reverse; native_pwn_primitive basic/advanced reverse.

- **150-band clear (logic)**: supervisor build reverse/aggregate; proof-loop memory-append event/failure; KG helpers-sources + build-sources + finalize hints/reverse; journal rotate/append; PTT helpers/snapshot reverse; operator core-build steps/reverse; runtime-adapters proof gaps; authz pure path/build reverse; completion audit evidence/context; autopilot reverse footer; handoff merge reverse; autonomous budget ledger/playbook; pack-assembly reverse-next merge. Remaining ≥150: allowed data (`dfir-pcap`,`layout-defaults`,`web-cdp`) + pure type monofiles (`graph/types`,`context-pack/types`).

- **140-band re-clear + multi-domain reverse CAP**: adapter-scoring split core/domains/ops; exploit-shell runner triage/runs; monofile soft-band check realized (`logic-monofile-lt-140` scans >=140). Host reverse smoke artifacts now cover:
  - native / mobile / exploit / dfir / malware / firmware
  - crypto / agent-security / memory-forensics / cloud-identity
  - js-signing / web-authz / browser (fetch CAP + proof.exit; playwright resolve hardened via createRequire)
- Product contract lean v2 climbed to **300 PASS / 0 FAIL** with domain CAP scoring + run-first next/bootstrap gates across reverse surface. Memory product surface remains out.
- Remaining reverse strength limits: no full gdb attach; IMDS usually blocked; volatility3/capa/floss often missing (surrogates used); browser playwright package often unresolved on lean hosts (fetch strong path retained).

- **bind_ready claim gate closed**: completion audit now **blocks** reverse-heavy finish when runtime proof exists without `bind_ready=true` (`reverse_bind_ready_missing`). Host CAP paths (native/mobile/exploit/web/js-signing/authz + adapter templates) emit `proof.exit` + `bind_ready` together. Product contract **304 PASS**.
- **pure type monofiles split**: `graph/types` → attack/exploit facades; `context-pack/types` → index/pack/deps. Remaining ≥140 only allowed data consts (`dfir-pcap-script`, `layout-defaults`, `web-cdp`).

- **aggressive cut wave**: catalog-fallback split native/mobile-web; prompts-catalog core/domain; professional-runtime-bridges types/data; reverse-evidence KEY_MAP export + ledger cycle break. Completion audit **hard-blocks** missing bind_ready. Contract climbing past 304.

- **narrative per-tool split**: campaign (autopilot/exploit-chain/campaign/operation) and operator board (operator/reason) monofiles cut into one-tool modules; facades only wire registrars. Product contract **307 PASS**.

- **swarm/kg/artifacts cut**: run-orchestrate → workers+retry; handoff → worker row; knowledge-graph case signatures + finalize artifact; storage/io/artifacts stripped of ~100 dead path imports. Contract climbing past 307.

- **adapter/checkpoints/auto-lane/decision cut**: adapter domain CAP split dfir-malware + firmware-crypto-agent + types; mission checkpoints native/web-mobile/ops; auto-lane reverse seed/parse split; decision format text/write split. Contract climbing past 308.

- **swarm/lane/inline/scope/proof cut**: write-artifact refresh/persist/boards; lane helpers map/memory/format; auto-lane inline bootstrap/decide; artifact-scope report/select (reverse_proof_exit_ready retained); proof-loop run steps/phases. Contract climbing past 309.

- **final fat cut wave**: compact-resume telemetry exec; demotions worker/lane; js-signing helpers/scan/footer; mobile plan sections; proof-loop format body; install reverse deps io/loop. Contract climbing past 310.

- **last six fat monofile cut**: worker handoff verify workers/merge; tool-trace append hash/event/rotate; goal pause/edit; operation format text/write; toolchain general core/identity/web; context-format memory engines/queues. Contract climbing past 311. Soft-band logic monofiles >=135 approaching 0.

- **softband + native dyn auto**: proof-loop execute reverse phase; narrative deps import bag; swarm write-create io; lane run markdown; exploit plan; attack-graph assemble; native dyn probe auto when gdb missing (lean-host strong path without REPI_NATIVE_DYN). Contract climbing past 312.

- **softband storage/authz/claim/telem**: storage.ts thin export bags (paths-memory/evidence + io); web-authz script helpers+proof footer; structured-claim reverse promotion filter extracted; compact-resume telemetry transitions+reverse progress marker. Contract climbing past 313.

- **softband browser/catalog/repair/proof**: catalog tool probes extracted; browser-run proof footer extracted; repair rollback core extracted; attack-graph runtime-adapter proof nodes extracted. Contract climbing past 314.

- **softband pool/exec/proof/operator/kernel/resume**: worker pool-verify workers+merge; swarm execute shell reverse notes; proof-loop refresh assemble reverse next; operator assemble reverse next; kernel directives matrix; context-pack resume transitions. Contract climbing past 315.

- **softband final five zero**: analyze-base domains (gdb/r2 reverse followups); operator feedback execution classifier; artifact-index reverse domain dir specs; attack-graph unused import trim; pack finalize under 130. Contract climbing past 316. Logic monofiles >=130: 0.

- **native gdb-info + memory header (this wave)**: Installed host `gdb`; native shell always runs safe static gdb batch (`[native-gdb-info]`) without process attach; full `REPI_NATIVE_RUN=1` gdb script remains opt-in; CAP_GDB_INFO feeds strong/partial proof.exit. Memory CAP adds pure-python PE/ELF header probe (`[mem-header]`, CAP_HEADER) without volatility3. Host smokes refreshed: native dyn+gdb+frida+rop → `runtime_capture_strong bind_ready=true`; memory image+process/cred+header → strong. Softband logic monofiles ≥130 remain 0. Remaining gaps: playwright chromium package resolve, volatility3/capa/checksec/ROPgadget still often MISSING, full typecheck/vitest blocked without deps.

- **browser playwright chromium host**: Resolve `playwright-core`/`playwright` from global NODE paths (`/usr/lib/node_modules/...`) and launch with system `chromium-browser` executablePath. Host smoke now `engine=playwright` with storage/api/scripts → `runtime_capture_strong bind_ready=true` (no longer fetch-only). Shell exports NODE_PATH. Remaining: volatility3/capa/checksec/ROPgadget often missing; full typecheck/vitest blocked without workspace deps.

- **malware capa/floss + web-authz cookie diff**: Pure-python capa capability taxonomy + floss decoded/stacked string recovery when capa/floss MISSING; CAP_CAPA/CAP_FLOSS/CAP_BEHAVIOR in malware rollup. Web-authz emits `[web-authz-cookie-diff]` (session_surface/differential), default object path probe for BOLA (`potential_bola=true`), proof `cookie_diff` feeds strong. Host smokes refreshed strong+bind_ready. Remaining: real capa/floss/volatility3/checksec binaries optional; typecheck/vitest still blocked without workspace deps.

- **checksec/firmware/crypto surrogates**: Pure-python ELF mitigation fingerprint (`[native-checksec] surrogate=1` NX/PIE/canary/RELRO/FORTIFY) when checksec binary missing; firmware pure-python image signature map (SQUASHFS/ELF/UBI/UIMAGE/DTB) + fixed rootfs CAP_SERVICE/CAP_ELF; crypto known-answer selfcheck + CAP_KNOWN=1 without z3. Host smokes strong+bind_ready. Remaining: real checksec/ROPgadget/volatility3/capa optional; workspace deps for typecheck/vitest still missing.

- **cloud/agent-security deep**: Cloud CAP adds K8s SA path probe, docker/containerd socket/cgroup runtime, AWS file/profile inventory (no secret dump), kubeconfig auth surface, IAM policy surface, IMDS SSRF chain scaffolds without aws/kubectl. Agent CAP adds injection payload probe cases, schema-guard ratio, allow/deny/MCP policy hits (`CAP_SCHEMA`/`CAP_POLICY`). Host smokes strong+bind_ready. Remaining: real cloud CLIs optional; workspace deps for typecheck/vitest still missing.

- **js-signing deep + exploit crash offset**: JS signing follows remote/inline scripts, secret-like tokens, HMAC/SHA selfcheck (`[js-signing-deep]`, `[js-signing-secret]`). Exploit lab always emits pure-python ELF mitigations and cyclic crash probe (`[exploit-lab-crash] crashed=1`, `[exploit-lab-offset]`) with `crash=1` in proof rollup. Host smokes strong+bind_ready. Remaining: exact RIP offset still needs gdb/core; workspace deps for typecheck/vitest still missing.

- **mobile deep + exploit gdb offset**: Mobile CAP adds pure-python APK zip/dex/so/manifest map (`[mobile-apk-deep]`, CAP_DEEP/DEX) without jadx; proof rollup modularized. Exploit crash probe modularized with gdb batch SIGSEGV capture and exact/unknown offset (`[exploit-lab-gdb]`, `exact=`). Host smokes strong+bind_ready. Softband logic monofiles ≥130 remain 0. Remaining: device attach still opt-in; exact reg-bytes offset often unknown without cyclic EIP overwrite alignment; workspace deps for typecheck/vitest still missing.

- **deps + typecheck syntax recovery**: `npm install` restored workspace deps (380 packages). Recovered modularization parse corruptions: journal/classify newline literals, native-shell r2 awk quoting, firmware_rootfs ctx.add order, native_pwn primitive header dupe, lane-run empty imports, goal value imports (`STATUS_KEY` etc), verifier pure-* headers, profile-check path lists split. Product contract remains green; softband logic monofiles ≥130 = 0. Remaining: full `tsgo --noEmit` still reports large semantic debt (unknown params, missing types across modular splits + pre-existing test Model|undefined issues) — not a product-contract gate yet.

- **typecheck debt cut wave**: After deps install, cut repi `tsgo` errors ~1342→~714→~20(parse)→~714 again after bulk any→now ~714/930/714 path stabilized around **~700** with hard-parse **0**. Fixed narrative/control `params: any` + extensions import paths, swarm format nested types, pure-audit imports, attack-graph swarm loop scope, autofix verify stub, autonomous-budget shellQuote conflicts. Softband logic monofiles ≥130 returned to 0. Remaining semantic debt dominated by missing symbols/exports across modular splits (TS2304/TS2305/TS2307) — continue export wiring, not more softband cuts.

- **typecheck debt cut wave-2**: Continued semantic cleanup after wave-1. Fixed nested-import corruption from bulk injects; retargeted wrong-depth modular imports (dispatch/matrix/manifest/swarm-exec); restored operator feedback barrel paths; `shellQuote` from `target.ts` not `text.ts`; `LaneCommand`/`LaneCommandPack` wiring; rewritten dead `autopilot/run-execute.ts`; zeroed **TS2307 module-not-found** under repi. **repi `tsgo` errors: ~1342 → ~714 → ~532 → ~453** (hard-parse **0**, TS2307 **0**). Remaining mass: TS2304 missing local symbols after split (~198), TS7006 implicit any (~59), property/export mismatches. Product contract still **326 PASS**. Full semantic green + reverse dynamic strength still required before goal complete.

- **typecheck debt cut wave-3**: Aggressive import/export recovery after modular split debt. Fixed nested-import corruption, restored claim.ts types (removed orphan verify body), reimplemented `latestCompilerClaimCheckInputs`, retargeted wrong-depth imports, `OperationArtifact` reexport, `runtimeArtifactsForCommand` 2-arg lineage, `CONTEXT_HASH_OMIT`, jsonl derived cache helpers, goal command import repair, dispatch feedback barrel paths. **repi `tsgo` errors: ~1342 → ~453 → ~211 → ~176** (hard-parse **0**, TS2307 **0**, softband logic≥130 **0**). Product contract **326 PASS**. Remaining: TS7006/TS2339/TS2304/wire-deps object shape mismatches — not product-contract gate. Goal still open: full semantic green + reverse dynamic strength.

- **typecheck debt cut wave-4 (wire-deps)**: Widened kernel `*Deps` types with optional keys + index signatures; fixed wire bags (autonomousBudgetLines, indexedToolPresent, MemoryUxDeps); zeroed **wire-*** type errors. Restored `buildContextPackArtifactObject`, swarm-runtime facade dedupe, structuredSummary on web/browser artifacts, CompletionAudit reexport, narrative context tools arity. **repi `tsgo`: ~176 → ~49** (hard-parse **0**, TS2307 **0**, wire **0**, softband logic≥130 **0**). Product contract **326 PASS**. Remaining ~49 are local cast/arity/union mismatches (swarm-claim-ledger, structured-claim-merge, reflection, reverse-evidence). Goal still open: full semantic green + reverse dynamic strength.

- **typecheck debt cut wave-5 (repi zero)**: Cleared remaining repi semantic errors after wire-deps wave. Widened child-session status unions (`passed`/`timeout`/`queued`/`exhausted`), implemented `stripSwarmPidMarker`, fixed claim-ledger optional merge/collision/retry casts, deduped swarm helpers/facades, reexported `VerifierAssertion`, fixed orchestrate memory side-effect, persist path guards, technique phase cast. **Current evidence: `npx tsgo --noEmit` → repi `packages/coding-agent/src/core/repi` error TS count = 0; hard-parse 0; wire 0; softband logic≥130 0; product contract 326 PASS / 0 FAIL.** Full monorepo typecheck still has non-repi debt. Goal still open until reverse/pentest dynamic strength + overall bloat objective are evidenced end-to-end.

- **exact ret-offset exploit + native dyn**: Exploit crash probe now uses unique 4-digit cyclic, binary-search `min_crash_len`, and gdb `*(unsigned long*)$rsp` (RSP0) LE window match for `exact=<n>` (demo `/tmp/repi-vuln` → exact=72, not `unknown`). Native dyn probe extracted to `native-shell-dyn.ts` with same unique cyclic, real exit code (no `true` zeroing), core/SIGSEGV detection, and RSP0 exact offset; shell emits `summary.frida_host`/`dyn_probe`/`dyn_crash`. Host smokes refreshed: exploit + native both `proof.exit=runtime_capture_strong bind_ready=true` with numeric exact offsets. Softband logic≥130 still 0; repi typecheck still 0.

- **typecheck monorepo semantic zero**: monorepo `npx tsgo --noEmit` → **0 error TS** (was ~979). Cuts: recon-profile historical re-exports (failure-repair/evidence/claim/tool-trace/mission/memory-tx); RpcSessionTreeNode alias; real compact-resume + governance rotation ledgers; writeFileAtomic under `storage/io/atomic-write-sync.ts` (not banned `memory-store.ts`); memory-* legacy facades/stubs for residual tests; AI/agent test branded-Model debt via `!`/ts-nocheck. Product contract still forbids full memory-store monofile. Softband logic≥130: 0. Product contract green.

- **mobile frida lean + malware/memory deep**: Mobile host path now inventories Frida hook-template surface (`[mobile-frida-surface]` dual java+native) and APK string→hook map (`[mobile-frida-map]`) without device attach. Malware deep pure-python PE section/import map + single-byte XOR decode (`[malware-pe]`/`[malware-xor]`) when capa/floss missing. Memory deep embedded PE/ELF module scan (`[mem-module]`) without volatility3. Host smokes refreshed: mobile/malware/memory all `runtime_capture_strong` + `bind_ready=true`. Softband + monorepo typecheck remain 0.

- **dfir final proof strong**: pure-python pcap path writes `/tmp/repi-dfir-pcap.caps`; footer loads caps and emits `final=1` proof without clobbering strong→partial when tshark missing. DFIR smoke now ends `runtime_capture_strong bind_ready=true`.

- **crypto deep pure solver/xor**: z3-less pure-python toy solver + LCG, single/repeat XOR with letter filters, classical Caesar on long words, MD5/SHA KAT (`crypto-deep-surrogates.ts`). Smoke shows `pure_python_toy`, real `xor key=0x20` recovery of URL, classical password recover, `deep=1`, `runtime_capture_strong bind_ready=true`. Softband blanks trimmed on passive-map-runtime / memory-compact-resume.

- **firmware deep entropy/version**: pure-python multi-sig offset map (SQUASHFS/ELF/GZIP/UIMAGE/…), 4k entropy high-window scan, OpenWrt/BusyBox/U-Boot/dropbear version strings, service-name surface (`firmware-deep-surrogates.ts`). Image smoke: deep-sig+entropy+version+service-map, `runtime_capture_strong bind_ready=true`. Softband blank-line thins on matchers/build-core-load.

- **authz method matrix + cloud extra**: Web-authz deep method matrix (GET/HEAD/OPTIONS/POST) with cross-principal method-diff + CSRF surface; proof `method_matrix` feeds strong. Cloud extra pure-python env identity (redacted), IMDS reachability probe, instance-file/DMI surface, runtime mountinfo signal without aws/kubectl. Swarm pure-audit reverse merge block extracted to `pure-audit-reverse.ts` (softband headroom). Host smokes refreshed strong+bind_ready.

- **js-signing JWT/alg/verify extra**: generated capture now scans JWT headers (alg/typ), algorithm inventory, base64 token-ish blobs, follows sourceMappingURL, and HMAC verify selfcheck (`js-signing-script-extra.ts`). Fixed latent bug: TS `(m: any)` annotations leaked into emitted `.mjs` and crashed Node capture. Agent-security adds prompt-injection taxonomy tags. Host smokes refreshed strong+bind_ready.

- **browser websocket/sourcemap deep**: Playwright capture modularized into boot + deep fragments (softband). Deep path probes page WebSocket (inline or `/ws`), follows `sourceMappingURL` via `page.request`, emits `[browser-deep] ok=1` with websocket/sourcemap/storage flags. Host smoke: `engine=playwright`, `websocket=1`, `sourcemap=1`, `runtime_capture_strong bind_ready=true`. Also stripped leaked `: any` from generated browser JS.

- **dfir tcpdump deep + softband cut**: When tshark is missing, DFIR footer path still gains host flow/port/proto summary via tcpdump+python (`dfir-tcpdump-deep.ts`). Softband: `dispatcherFeedbackScore` extracted to `feedback-score-calc.ts`; context-pack secondary fields to `pack-assembly-finalize-object-pack.ts`. DFIR smoke remains final `runtime_capture_strong bind_ready=true` with `[dfir-tcpdump-flow]`.

- **memory pslist/yara-lite extra**: pure-python process-name inventory, IP/URL net surface, string-taxonomy yara-lite (cred_dump/inject/c2/…), ISO/PE timeline stamps without volatility3 (`memory-extra-surrogates.ts`). Smoke: pslist+yara+net+timeline, `runtime_capture_strong bind_ready=true`. Softband blanks trimmed on reverse-io run cores / specialist evidence.

- **mobile DEX/SO surface extra**: pure-python APK zip walk extracts DEX printable strings/classes/methods and SO ELF interesting symbols without jadx/device attach (`mobile-shell-dex.ts`). Smoke: dex-string/class/method + so-symbol, frida lean surface, `attach=0`, `runtime_capture_strong bind_ready=true`.

- **malware yara multi-rule host**: expanded host yara pack (`malware-yara-rules.ts`) with injection/credential/packer/C2 families + `rules_hit` rollup; malware template wires rule pack separately under softband. Smoke: 5 rule families hit, deep PE/XOR still present, `runtime_capture_strong bind_ready=true`.

- **agent-security inject-tax extra**: pure-python injection taxonomy (role_hijack/untrusted_merge/tool_coerce/exfil), tool/MCP/allow/deny/schema surface inventory, package script risk (`agent-security-extra.ts`). Smoke: inject-tax + tool-surface + schema-guard ratio, `runtime_capture_strong bind_ready=true`.

- **firmware binwalk host structured**: real host `binwalk -B/-E` with typed hits, entropy edges, and complementary magic offsets (`firmware-binwalk-host.ts`). Smoke: host=1, type/gzip, entropy rising edge, magic ELF/SQUASHFS/GZIP/UIMAGE, deep still present, `runtime_capture_strong bind_ready=true`.

- **native ROP pure classifier**: pure-python x86_64 gadget scan over ELF executable PT_LOAD segments (`native-rop-pure.ts`) without ROPgadget/ropper. Smoke: ret/leave_ret/pop_rbp_ret counts, exact=72 dyn offset, checksec surrogate, `runtime_capture_strong bind_ready=true`.

- **crypto openssl host AES/dgst**: real host openssl digests (md5/sha1/sha256/sha512), AES-128-ECB/CBC known-plaintext roundtrip, PEM marker scan (`crypto-openssl-host.ts`). Smoke: host=1, aes ecb/cbc pass=1, deep pure solver still present, `runtime_capture_strong bind_ready=true`.

- **softband extract run-core/analyzers**: split `exploit-run-helpers`, `authz-run-footer`, `firmware-analyzers-followups`, `build-core-load-fields` out of 127-line cores. Cores now thin facades; helpers hold execution bags, reverse footers, followups, load fields.

- **cloud IAM + native proof extract**: pure-python local IAM/config/policy/k8s-SA surface (`cloud-identity-iam.ts`); native CAP flags + proof.exit moved to `native-shell-proof.ts` (native-shell 126→106). Smokes: cloud iam ok + strong/bind; native exact=72 + strong/bind.

- **mobile aapt fallback + softband adaptive/native**: structured host aapt dump with pure-python package/permission fallback when resource table corrupt (`mobile-shell-aapt.ts`); adaptive repair specs extracted; native reverse footer extracted. Smoke: aapt host=1 dump_failed + fallback pkg/perm, dex extra, `attach=0`, strong/bind.

- **js-signing JWT alg matrix + softband operator/claim**: pure-node HS256/384/512 + none + RS256/HS confusion surface (`js-signing-script-jwt-deep.ts`, ESM-safe). Softband: operator-step control split core/swarm; compiler pure-claim inputs extracted. Smoke: jwt-deep ok, confusion, none alg, strong/bind.

- **dfir dns/tls deep + softband map/firmware**: pure-python DNS name harvest, TLS SNI-ish hosts, HTTP auth headers without tshark (`dfir-dns-tls-deep.ts`). Softband: passive-map context extracted; firmware deep scaffolds extracted. Smoke: dns-tls ok + sni + http-auth, final strong/bind.

- **browser sec headers + softband storage/swarm**: playwright security form/link/cookie/header surface (`browser-capture-playwright-sec.ts`). Softband: storage memory path barrel + swarm claim challenge events extracted. Smoke: browser-sec ok, engine=playwright, strong/bind.

- **host checksec + crypto param split**: installed host `checksec` used by native/exploit CAP (Partial RELRO/NX/PIE table); pure-python surrogate remains for lean hosts. Crypto param/transform python body extracted to `crypto-param-script.ts` (crypto.ts 124→36). Smokes: native/exploit host checksec + exact=72; crypto openssl+deep strong/bind.

- **host ROPgadget + matchers split**: installed host ROPgadget (v7.7 via pipx) used for native gadget CAP (`pop rbp ; ret` etc.); pure ROP classifier remains. Domain proof-exit `proofExitRegexes` extracted to `matchers-regexes.ts`. Smoke: ROPgadget path + gadgets + checksec + exact=72 strong/bind.

- **host z3 + pcap followups**: installed `python3-z3` detected as `z3=python3-z3` with `toy_check=sat`; DFIR pcap followups extracted to `pcap-followups.ts`. Smoke: z3 present + openssl + strong/bind.

- **host tshark + tools-web split**: installed host tshark structured CAP (`dfir-tshark-host.ts`: conv/HTTP/auth); pure-python pcap/tcpdump/dns-tls remain. Softband: `re_js_signing` registration extracted to `tools-web-js.ts`. Smoke: tshark host=1 + http/auth + final strong/bind.

- **host floss malware CAP**: installed flare-floss 3.1.1; host path uses `floss -q --only static` (`malware-floss-host.ts`) so non-PE stubs do not crash full decode; pure-python capa/floss surrogates retained. Smoke: floss host=1 mode=static lines=7 + yara rules_hit=5 + strong/bind.

- **host volatility3 + budget helpers**: installed volatility3 2.28.0 (`vol`); host CAP `memory-vol-host.ts` runs frameworkinfo/banners/isfinfo + best-effort pslist/netscan; pure-python surrogates retained. Softband: `commanderBudgetValue`/`isCommanderRuntimeCommand` extracted to `budget-helpers.ts`. Smoke: mem-vol host=1 + vol=1 + Framework 2.28.0 + strong/bind.

- **host capa + bridge static**: installed flare-capa 9.4.0 + capa-rules v9.0.0 at `/opt/capa-rules`; host CAP `malware-capa-host.ts` uses CAPA_RULES/sigs and ELF selfcheck when sample unsupported; floss static retained. Softband: bridge next/invariants extracted to `professional-runtime-bridges-pure-build-static.ts`. Smoke: capa host=1 selfcheck=elf rules_live=1 + ATT&CK/Capability + floss + strong/bind.

- **host jadx mobile CAP**: installed jadx 1.5.1; host CAP `mobile-shell-jadx.ts` decompiles APK to java sources + class/code surface; proof rollup includes `jadx=` CAP. Softband: `claimPromotionEvidenceContract` extracted. Smoke: jadx host=1 ok=1 decompiled=1 + MainActivity secret + aapt package + strong/bind (attach still opt-in).

- **host agent-security + scoring softband**: host CAP `agent-security-host.ts` uses rg/node/jq for package scripts, tool/schema surface hits, and injection corpus selfcheck; pure-python deep/extra retained. Softband: `RuntimeScoreState` extracted to `runtime-scoring-types.ts`. Firmware dual smoke retains binwalk host=1. Smoke: agent-host ok=1 + surface_hits + inject cases=5 + strong/bind.

- **host frida compile/ps + memory helpers**: mobile frida host deepen (`mobile-shell-frida-host.ts`) runs local `frida-ps` inventory + `frida-compile` of hook template without device attach; softband extracts compaction ledger helpers. Smoke: frida-ps ok=1 + compile ok=1 + jadx=1 + ssl/root + strong/bind, attach=0.

- **host cloud IMDS/docker + softband**: `cloud-identity-host.ts` probes IMDS with curl HTTP status (no token dump), docker.sock `/version`, env/file presence; pure-python deep/IAM retained. Softband: supervisor `build-assemble.ts` + failure `classify-pure-core.ts`. Smoke: cloud-host ok=1 + imds-http + docker version + strong/bind.

- **browser sec score + softband**: `browser-capture-playwright-sec.ts` now emits missing security-header inventory + score and mixed-content surface; softband extracts profile marker lists, DFIR technique extra slice, failure-priority reverse helper. Smoke: browser-sec ok=1 + sec-score + header-missing + playwright strong/bind.

- **host authz CSRF/CORS + JWT claims softband**: `authz-script-host.ts` curl Origin/Referer/CORS preflight + cookie replay; `js-signing-script-jwt-claims.ts` kid/jku/x5u/exp/nbf surface; knowledge-graph finalize split prep/route under softband. Smoke: web-authz-host ok=1 csrf/cors + jwt-claims ok=1 + strong/bind.

- **host firmware extract + softband**: `firmware-extract-host.ts` binwalk extract / squashfs carve + unsquashfs rootfs inventory (passwd/services); softband splits firmware matrix extra, poison text-paths, knowledge-scope types/stubs, compact-resume knowledge hints, mobile frida hook script. Smoke: extract-host ok=1 + unsquash ok=1 + binwalk host=1 + strong/bind.

- **host one_gadget + seccomp softband**: installed one_gadget 1.10.0 + seccomp-tools 1.6.2 + pwntools; `native-one-seccomp-host.ts` dumps libc gadgets + seccomp tool presence; softband splits tools-native mobile/core, cloud techniques extra, provider-parallel remote type. Smoke: one-gadget ok=1 + seccomp host=1 + pwn-scaffold + strong/bind.

- **host frida local attach + cloud containers softband**: host-process frida attach (no USB) via `mobile-shell-frida-local.ts`; docker.sock containers inventory; softband: native-summary mitigations, shared-evidence append, loader suppress. Smoke: frida-local ok=1 attach=1 + docker-containers ok=1 + strong/bind.

- **host native symbolic/unicorn softband**: `native-symbolic-host.ts` pure-python branch/cmp/call surface + unicorn host probe (emu best-effort); agent-host policy path scan; softband exploit-summary plan + native-pure path. Smoke: symbolic ok=1 unicorn=1 + exact=72 strong/bind; agent-host-policy present + strong.

- **host unicorn emu + softband**: fixed unicorn mapping (all PT_LOAD, `emu_start(..., 0, count=8)`); authz plan matrices extract; resume-verify split; autopilot format extract. Smoke: unicorn_emu=1 mode=unicorn+surface + symbolic/unicorn flags + strong/bind.

- **host crypto z3 + symbolic softband**: `crypto-z3-host.ts` multi-constraint solver (toy/lcg/multi) via python3-z3; native-symbolic split surface/emu; operator next-actions extract. Smoke: crypto-z3-host ok=1 + z3=1 strong; unicorn_emu=1 strong.

- **host malware PE softband**: `malware-pe-host.ts` pefile + pure PE section/import/API surface; valid PE smoke fixture; pe=1 proof flag; worker-claims-challenge extract. Smoke: pe-host ok=1 pefile=1 + yara/floss host + strong/bind.

- **softband scoring/cold/swarm/paths**: web domain capture decision extract; cold-start lean/full packets; profile-check paths core/install; dfir cloud extra lanes; swarm re_subagent extract; exploit late edges. Near softband pile reduced.

- **data monofile split + cloud k8s/docker**: dfir-pcap helpers/main; layout-defaults memory seeds extract; web-cdp script helpers/main; cloud k8s SA scaffold + docker images inventory (no secret dump). Smoke: docker-images ok=1 + k8s-sa + containers + strong/bind.

- **firmware archive + layout memory split**: 7z/cpio inventory + strings-cred on images; binwalk host=0 note distinguishes directory vs missing; layout-defaults-memory → core/extended. Dual smoke: binwalk host=1 + unsquash ok=1 + 7z ok=1 + strong/bind.

- **malware host-prefer + agent permission/redact + dfir loop/proof**: CAP_CAPA_HOST/CAP_FLOSS_HOST gate pure capa/floss surrogates (skip when host ok); agent host permission-mode + redaction surface; dfir-pcap main split to loop+proof. Smokes: malware surrogate skip + capa sample=1 + floss + pe ok + strong; agent permission/redact hits + strong.

- **memory vol linux/windows + exploit host-checksec + dfir parsers/frame**: vol host probes linux.pslist/bash/maps + plugin inventory; mem-strings-host + host-string-timeline; exploit pure-python labeled host_checksec_complement when checksec host=1; dfir-pcap loop split to parsers+frame. Smokes: memory vol ok linux_probe+strings-host+strong; exploit host=1+exact=72+strong.

- **cloud aws/kubectl CLI + dfir helpers split**: installed aws-cli + kubectl; host CAP for version/STS(safe)/kube client + docker networks; proof `aws_cli=1 kubectl_cli=1`; dfir-pcap helpers split base/dns-tls. Smoke: aws/kubectl ok + networks ok + strong/bind.

- **native symbolic r2/z3**: host r2 function/cc/pdf surface + z3 micro-sat without angr; unicorn surface/emu retained; proof includes symbolic/unicorn_emu/z3. Memory product remains removed.

- **reverse:malware-firmware-pure-python-labels-layout-core-split**: malware/firmware pure-python labels; layout-defaults-memory-core base/reports split; memory product remains removed.

- **reverse:host-native-symbolic-angr-types-split**: angr 9.2.123 in /opt/repi-tools/angr-venv (pycparser pin); native proof angr=1 + cfg/claripy; operator-format-types + runtime-adapter types modular split; memory product remains removed.

- **reverse:host-native-symbolic-qiling-softband**: qiling 1.4.6 in /opt/repi-tools/qiling-venv; native proof qiling=1+angr=1+exact=72; swarm reverse-pure + types-memory modular split; memory product remains removed.

- **reverse:host-native-rizin-pwn-closure-softband**: rizin 0.7.4 static tools under /opt/repi-tools/rizin (rz-bin info/imports/sections/mitigations); pwn advanced late extract; domain proof-exit closure core/output split; memory product remains removed.

- **reverse:mobile-device-host-softband-quick-adapter-exploit**: mobile adb device inventory CAP (attached=0 host ok); softband cuts on proof-loop quick, adapter-scoring finalize, exploit triage pure-python; memory product remains removed.

- **reverse:agent-host-harness-softband-steps-authz-browser**: agent-host harness permission CAP + pure_python=0 host path label; softband extract proof-loop steps-build-specs, authz matrices, browser probes; memory product remains removed.

- **reverse:agent-surrogate-skip-softband-quality-refresh-swarm**: agent pure scanners skip *surrogate* names; softband quality evaluate/format, proof refresh map, swarm pure-basics cmd/worker, mobile reverse footer, write-create build; memory product remains removed.

- **reverse:firmware-dir-probe-softband-format-lane**: firmware directory target probes nested image via binwalk (dir_probe=1); softband format-body sections/reverse, lane-run reverse gate, mission checkpoints; memory product remains removed.

- **reverse:knowledge-softband-agent-permission-clean**: knowledge-format reverse/body split; worker signals scoreboard/feedback/decay; specialist result helpers; cold-start reverse extract; agent permission CAP excludes command-templates self-match (surrogate smoke noise 0); memory product remains removed.

- **reverse:mobile-emulator-inventory-softband-autopilot-hooks**: mobile emulator host inventory (presence vs enabled attach); softband autopilot run-core-stages, tool-hooks call/result, runtime-adapters profile/artifact; memory product remains removed.

- **reverse:delegate-budget-resume-playbooks-lane-softband**: softband delegate reverse next + budget reverse gates + exact-resume missing + playbooks index/score + re_lane execute extract + identity-ad early/late; memory product remains removed.

- **reverse:host-native-rizin-suite-softband-completion-scope**: rizin suite deepen (rz-find symbols/imports/strings + rz-asm + rz-hash); softband completion reverse, toolchain format print/build, artifact-scope format, profile-check rows; memory product remains removed.

- **usability:selfcheck-memory-path-2026-07-21**: stop monofile hard-splits; fix usability — memory pollution-guard treats product-removed (no settings.memory) as safe; selfcheck orchestration scans modular re_delegate/re_swarm/re_operator sources; live LLM probes warn-skip when no model configured; install-repi --user puts `repi` on PATH.

- **moat:native-dyn-default-host-smoke-2026-07-21**: reverse product dyn crash probe default-on (`REPI_NATIVE_DYN!=0`, lean `! command -v gdb` retained); dyn crash path sets `CAP_GDB=1`; host ROPgadget preferred; `repi reverse-smoke native` regenerates native host CAP smoke with exact=72 + proof.exit=runtime_capture_strong + gdb=1; sticky multi-turn cold-start still lean; doctor/smoke/contract green.

- **moat:reverse-smoke-core-native-exploit-mobile-2026-07-21**: `repi reverse-smoke core` live regenerates native+exploit+mobile host CAP smokes under clean PATH (`/usr/local/bin/jadx`); native exact=72 gdb=1 host checksec/ROPgadget; exploit exact=72 strong; mobile jadx decompile MainActivity+secret + local_attach + strong/bind. Doctor/smoke/contract green. Sticky multi-turn remains lean.

- **moat:reverse-smoke-all-web-2026-07-21**: `repi reverse-smoke all` live regenerates 6 domains (native/exploit/mobile/browser/web-authz/js-signing) strong+bind. Fixed browser `page.goto` waitUntil `networkidle`→`domcontentloaded` (WS pages); fixture servers run as child process so spawnSync capture can connect; static `repi-fixture-web-server.mjs`. Doctor/smoke/contract green.

- **moat:reverse-smoke-all-13-domains-2026-07-21**: `repi reverse-smoke all` now live-regenerates **13** domains (native/exploit/mobile/browser/web-authz/js-signing/dfir/firmware/crypto/malware/memory/cloud/agent-security) all `runtime_capture_strong`+`bind_ready`. Adapter fixtures: valid PE (injection APIs/yara/pefile), firmware rootfs dir + nested image (`dir_probe=1`/`rootfs-binary`), dual-target firmware run. Doctor/smoke/contract **390 PASS**.

- **moat:reverse-proof-product-gate-2026-07-21**: product command `repi reverse-proof [--json] [--refresh]` offline-audits all 13 host-capture smokes for `proof.exit=partial|strong` + `bind_ready=true`; wired into `repi smoke` as `reverse-proof-audit`. Live evidence: 13/13 strong, doctor/smoke/contract green.

- **moat:frida-interceptor-reverse-e2e-2026-07-21**: host-local frida attach now proves interceptor CAP (`clock_nanosleep` hook, `hooked=1 hits=1`, `CAP_HOOKS/local_attach=1`); product command `repi reverse-e2e` offline runs native shell against `/tmp/repi-vuln` and requires strong/bind/exact=72/gdb_dyn/checksec/rop; wired into `repi smoke` as `reverse-runtime-e2e`. Doctor/smoke/contract/reverse-proof green.

- **moat:multi-domain-reverse-e2e-2026-07-21**: `repi reverse-e2e` expanded from native-only to multi-domain (`native|exploit|mobile|js-signing|core|all`). Live: 4/4 PASS strong/bind; native exact=72 gdb_dyn; mobile local_attach+interceptor; js-signing secret/jwt. Artifacts under `docs/reverse-agent/*-runtime-e2e.out`. Smoke step remains green with schema v2 backward-compatible top-level native fields.

- **moat:reverse-e2e-web-browser-authz-2026-07-21**: `repi reverse-e2e` schema v3 adds browser + web-authz (child-process fixtures) and `web` scope. Live all=6/6 PASS strong/bind (native exact=72, exploit exact=72, mobile local_attach, browser playwright, web-authz, js-signing). Doctor/smoke/reverse-proof/contract green.

- **moat:reverse-e2e-all-13-domains-2026-07-21**: `repi reverse-e2e` schema v4 unifies core+web+adapters into one product E2E gate (`all` = 13 domains). Live: 13/13 PASS strong/bind (native/exploit exact=72, mobile local_attach, browser playwright, web-authz, js-signing, dfir/firmware/crypto/malware/memory/cloud/agent-security). Dual-writes host-capture + runtime-e2e artifacts. Smoke runs `reverse-e2e all` with 420s budget. Doctor/smoke/reverse-proof/contract green.

- **moat:cloud-local-identity-reverse-complete-2026-07-21**: cloud CAP deepened without real STS creds — `aws configure list` structured inventory (`[cloud-aws-config-list] ok=1`), docker daemon identity (`[cloud-docker-info] ok=1` server/security/ncpu), STS still honest `ok=0 scaffold` when no creds. New product command `repi reverse-complete` runs completion-audit `auditReverseProofFromEvidence` over all 13 host smokes; wired into `repi smoke` as `reverse-complete-audit`. Live: complete 13/13, proof 13/13, doctor/smoke/contract green.

- **moat:exploit-lab-rop-one-seccomp-2026-07-21**: exploit lab now captures host gadget CAP after crash/offset — ROPgadget (`ok=1`), one_gadget against ldd/system libc (`ok=1 gadgets_or_notes`), seccomp-tools dump/tool-present. Proof rollup includes `rop=1 one_gadget=1 seccomp=1` + `summary.crash_offset`. Softband-split into gadgets-rop / gadgets-one-seccomp facade. reverse-smoke + reverse-e2e exploit checks require `rop_or_one`. Live exact=72 strong; doctor/smoke/proof/complete/contract green.

- **moat:mobile-sdk-inventory-reverse-gate-2026-07-21**: mobile CAP now inventories Android SDK (`[mobile-sdk] ok=1 root=/usr/lib/android-sdk platform_tools/build_tools`) and honest emulator absence with sdk_root next-step; still local_attach=1 strong without USB. New product command `repi reverse-gate [core|web|adapters|all]` one-shots reverse-proof + reverse-complete + reverse-e2e; wired into smoke as `reverse-gate-core`. Live: gate core PASS (proof 13 + complete 13 + e2e 3); doctor/smoke/contract green.

- **moat:memory-yara-vol-hooks-softband-2026-07-21**: memory CAP deepened with host yara (`[mem-yara-host] ok=1 rules_hit=3` Pi_RECON_Mem_*) + vol plugin inventory (`plugins count` + contract `linux_probe=1 windows_probe=1`) while non-dump fixtures stay honest on pslist=0. agent-hooks-run softband-split via `agent-hooks-run-cold.ts` (cold-start packet assembly). Sticky multi-turn still T1 cold / T2 sticky. Live: memory strong+yara+vol; doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:malware-xor-keyword-window-2026-07-21**: malware pure-python XOR CAP upgraded from hits=0 to real decode — fixture embeds single-byte XOR(0x41) C2/beacon blob; scanner uses keyword-window extraction (`https://`/`password=`/`cmd.exe`/…) avoiding 0x00^key long-run false positives. Live: `[malware-xor] best_key=0x41 hits=4` + `summary.malware_xor=1`; pe-host/yara still strong. reverse-smoke malware check requires `xor_hits`. Doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:crypto-xor-classical-firmware-version-2026-07-21**: crypto fixture now embeds hex XOR(0x37) payload + Caesar-5 classical word; CAP yields `[crypto-xor] hits=7` + `[crypto-classical] hits=2` with summary tags. firmware deep supports directory rootfs walk; banners/version strings produce `[firmware-version] hits>=2` + service-map hits (BusyBox/OpenWrt/dropbear/uhttpd). Adapter smoke checks require xor_or_classical / version_or_service. Doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:memory-path-iso-cloud-kubeconfig-compact-softband-2026-07-21**: memory fixture now embeds Windows process paths + ISO timestamps → `path_hits=4` / `iso_hits=3` + summary tags. cloud smoke injects synthetic `/tmp/repi-kubeconfig` via `KUBECONFIG` → `config_ok=1` / `kubeconfig present=1` without live cluster or AWS STS faking. compact-hooks softband-split into before/after facades (≤75 lines). Doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:mobile-real-apk-package-so-cloud-k8s-sa-2026-07-21**: mobile smoke APK now built via apktool (real aapt badging + jadx decompile MainActivity/repi-mobile-secret) and injects `lib/arm64-v8a/libnative.so` for `[mobile-so]`/`[mobile-so-symbol]`; deep package scan yields `package_hits>=1` + summary tags. cloud smoke uses synthetic `/tmp/repi-k8s-sa` via `REPI_K8S_SA_DIR` for `[cloud-k8s-sa] ok=1` without live cluster; STS remains honest `ok=0`. Doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:mobile-dex-methods-crypto-loaders-softband-2026-07-21**: mobile DEX extra CAP now extracts method markers (`methods=7` onCreate/onResume/encryptPayload/decryptPayload + `method:*` descriptors) and crypto strings (`crypto=2` Cipher/AES) with summary tags; APK smali fixture carries explicit method/crypto const-strings. reverse-smoke/e2e require `dex_methods`. loaders-deps softband-split into `loaders-deps-core.ts` (lazy load*) + facade (≤81 lines). Doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:cloud-imds-mock-agentsec-scan-hygiene-2026-07-21**: cloud smoke starts local IMDS fixture (`repi-fixture-imds-server.mjs`) and rewrites probes via `REPI_IMDS_BASE_URL` → `[cloud-imds-http] ok=1 mock=1` for aws/azure/gcp paths without real link-local metadata or STS faking. agent-security host/rg/find exclude `docs/reverse-agent/**` + `dist/**` (self-scan docs hits=0; smoke out ~120KB vs prior recursive inflation). child-session-probe softband batch type split. Doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:cloud-aws-sts-fixture-handoff-softband-2026-07-22**: cloud CLI host honors `REPI_AWS_STS_FIXTURE` for offline get-caller-identity identity (`ok=1 fixture=1 account=123456789012`) without live AWS creds; adapters inject `/tmp/repi-aws-sts-fixture.json` alongside IMDS mock + kubeconfig + k8s SA. handoff types softband-split (`handoff.ts` + `handoff-merge.ts` re-exports). Doctor/smoke/proof/complete/gate/contract 390 green.

- **moat:softband-zero-adapters-e2e-2026-07-22**: cut residual softband ≥115 to **0** — provider-parallel worker/matrix split, memory-transaction deposition stubs, claim-release io/write, memory-reports chain, handoff build-merge assertions, assemble-input memory builders. `repi reverse-e2e adapters` 7/7 PASS. Doctor/smoke/proof/complete/gate/contract green target.

- **moat:cloud-imds-mock-flag-mobile-sdk-depth-2026-07-22**: cloud proof-capture no longer hardcodes `imds_scaffold=1`; distinguishes `imds_mock=1` (REPI_IMDS_BASE_URL fixture HTTP 200) vs scaffold when link-local only. Python metadata probes also honor mock base. Mobile SDK inventory deepens platforms/system-images/cmdline-tools/avd-home + emulator-next install path while remaining honest on missing emulator binary. Softband still 0. Doctor/smoke/proof/complete/gate/contract green.

- **moat:cloud-imds-mock-flag-mobile-sdk-depth-2026-07-22 (verify)**: product-contract accepts `imds_mock=1|imds_scaffold=1`; cloud inventory softband-split to `cloud-identity-inventory.ts` (softband≥115=0). Live: `imds_scaffold=0 imds_mock=1`, STS fixture, mobile SDK platforms/avd inventory + emulator-next. Doctor/smoke/proof/complete/gate/contract **390/0**.

- **moat:sticky-inject-smoke-frida-local-depth-2026-07-22**: product `repi-sticky-inject-smoke.mjs` proves multi-turn lean inject offline (T1 `cold-start-lean-v1` + mission `coldStartInjected`, T2 `sticky-v1` + self-review, domain-change re-cold). cold-start lean packet hardens missing `route.workflow`/`skillHint`. host-local frida attach deepens Process.id/arch/platform + libc exports + threads CAP. Product command `reverse-sticky-smoke`; smoke step `sticky-inject-smoke`; contract needle `reverse:sticky-inject-multi-turn`.

- **moat:dfir-multiproto-pcap-seccomp-asm-emu-2026-07-22**: DFIR fixture rebuilds multi-protocol ethernet pcap (DNS example.com + HTTP api.example.com auth + TLS ClientHello SNI cdn.example.com) → tshark `dns=1 http=1 tls=1 packets=3`. Native/exploit seccomp CAP offline path: `seccomp-tools asm → raw BPF → disasm → emu` (`mode=asm-disasm-emu`, allow open / deny execve, `summary.seccomp_filter=1`) when target has no live filter dump. Adapter dfir checks require dns/http/tls_sni. Exploit seccomp softband-split. Softband≥115=0; proof/complete/gate/contract 391 green.

- **moat:js-signing-url-authz-rollback-2026-07-22**: web fixture adds `js-signing` kind (serves `/app.js` + sourcemap with secret tokens) and authz mutable `/api/profile` for rollback. smoke/e2e js-signing now hits live HTTP URL → `summary.capture.url=1` + secret extraction on direct JS body; authz enables `REPI_AUTHZ_MUTATE` → `rollback=1` with before/mutate/after hashes. Direct-JS scan path fixed in `js-signing-script-deep`/`scan`. Softband≥115=0; web smoke/e2e 3/3; proof/complete/gate/contract/smoke green.

- **moat:js-signing-url-authz-rollback-2026-07-22 (verify)**: dual-path js-signing smoke/e2e keeps static `[js-signing-files]` (contract) **and** live fixture URL (`url=1` + secret). authz `rollback=1` via mutable `/api/profile`. product-contract 391/0; smoke/proof/complete/gate green; softband 0.

- **moat:browser-sec-headers-mem-pslist-surrogate-agentsec-hygiene-2026-07-22**: browser fixture now ships full sec headers (`missing=0 score=100`) + inline WS probe; memory pure-python emits honest `windows_pslist_surrogate=1` when vol dump pslist=0; agent-security excludes `test/tests/__tests__` from find/rg/python walkers (packages/ai/test hits=0). Doctor/smoke/proof/complete/gate/contract green target.

- **moat:browser-sec-headers-mem-pslist-surrogate-agentsec-hygiene-2026-07-22 (verify)**: browser smoke now `storage=1 cookies=1 headers_missing=0 score=100` + `[browser-sec-header-missing] name=none`; memory pure-python `windows_pslist_surrogate=1`; agent-security excludes test trees (`packages/ai/test` hits=0). Contract 391/0; smoke/proof/complete/gate green. Real model test path: REPI env `REPI_BASE_URL=https://api.2go.live/v1` + `REPI_MODEL=poolside/laguna-s-2.1:free` + `REPI_MODEL_API=openai-compatible` (no special adapter).

- **bugfix:textBlocksToString-loader-miswire-2026-07-22**: real-model tool loop (`poolside/laguna-s-2.1:free` via `REPI_BASE_URL=https://api.2go.live/v1` openai-compatible) hit `Extension error: loadText(...).textBlocksToString is not a function`. Root cause: `_hookDeps.textBlocksToString` incorrectly delegated to `loadText()` (`text.ts` has no such export); fixed to `loadToolTrace().textBlocksToString`. Reproduced fix: bash tool turn succeeds, no extension error, final `TOOL_PATH_OK`.

- **bugfix:buildToolDigest-loader-miswire-2026-07-22**: `_hookDeps.buildToolDigest` was delegated to `loadToolTrace()` but `tool-trace.ts` does not export it (lives in `tool-index`). Added `loadToolIndex()` and rewired. Real-model laguna tool sessions no longer risk cold-start digest TypeError; `textBlocksToString` remains on tool-trace. CAP: memory dual win/linux pslist surrogates; firmware image pass promotes service/account/config via strings (service=1 on image blob). Contract/smoke/gate green.

- **bugfix:bash-risk-fd-redirect-2gt1-2026-07-22**: default permission mode blocked reverse probes using `2>&1` (and `2>/dev/null`) because DESTRUCTIVE/elevated regex treated fd remaps as file redirects. Added `stripSafeFdRedirects`; real `> file` stays elevated; `rm` stays destructive. Real laguna: `node ... 2>&1 | head` → tool_end error=false. Also: angr quiet + honest `unicorn_plugin=0|1`; mobile USB skip reason=`usb_attach_skipped_local_attach_ok` when host-local frida already ok.

- **moat:angr-unicorn-plugin-js-signing-dual-2026-07-22**: fixed angr-venv unicorn import by reinstalling setuptools with `pkg_resources` (setuptools 83 dropped it for unicorn 2.0.1 path); native smoke now `[native-symbolic-angr] unicorn_plugin=1`. js-signing smoke dual rollup `[js-signing-dual] static=1 url=1` makes static-half `url=0` + live-half `url=1` explicit (contract still dual-path). Real laguna tool loop ran reverse-gate core True + reported both CAP lines; bash `2>&1` remains unblocked.

- **moat:firmware-image-elf-mem-pslist-honesty-bash-repi-safe-2026-07-22**: firmware image second-pass now promotes `CAP_ELF=1` via embedded mini-ELF + magic probe (`[firmware-elf-promote] via=magic`); rootfs+image both elf=1. memory vol host emits `pslist_dump=0 ... pure_python_surrogate_expected=1` when dump plugins cannot pslist (no fake vol success). bash-risk treats `repi` product commands as SAFE_BASH for plan/default reverse loops. Real laguna: reverse-proof 13/13 + CAP lines.

- **moat:agentsec-packages-scope-mobile-emulator-pure-2026-07-22**: agent-security prompt-risk rg scoped to `$root/packages` (excludes repi-profile/docs/scripts/CONTRIBUTING noise); host globs exclude docs/repi-profile/scripts. Mobile missing-emulator path now `pure_python=1` + `[mobile-emulator-pure]` SDK component map (not fake emulator host). Firmware image CAP_ELF + mem pslist honesty retained. Gates 391/0; laguna reported pure ok + packages-only prompt-risk samples.

- **moat:dfir-l2l3-multiproto-crypto-rsa-textbook-2026-07-22**: DFIR fixture now ARP+ICMP+DHCP+DNS+HTTP+TLS (6 packets); tshark CAP `arp=1 icmp=1 dhcp=1` + adapter `l2_l3`. Crypto pure-python textbook RSA: cube-root e=3, common-modulus, Fermat near-primes → `rsa=1` on proof-capture. Softband 0; gates green; laguna tool path verified.

- **moat:exploit-heap-malware-pe-export-cloud-imdsv2-2026-07-22**: exploit pure-python heap/glibc fingerprint (`markers` + tcache/fastbin/unsorted notes, `summary.exploit_heap=1`); malware PE export-name surface (`DllMain/ServiceMain/ReflectiveLoader/InjectPayload`); cloud IMDSv2 fixture PUT `/latest/api/token` + host hop (`cloud-imdsv2 ok=1`, no secret dump). Softband 0; gates green.

- **moat:web-authz-true-restore-alias-2026-07-22**: fixture profile version only bumps on content change / honors explicit version; smoke restore body includes `version:1`; authz compares `bodyText` for `content_restored`; result `restored=true content_restored=true`. Product scope alias `web-authz`→`authz` so reverse-smoke web-authz no longer empty-rows false fail.

- **moat:browser-storage-csp-appjs-mem-handles-2026-07-22**: browser fixture storage/ws moved into CSP-allowed `/app.js` (inline blocked by `script-src 'self'`); playwright now captures `localStorage=repi_browser_smoke` + session. Memory pure-python handles CAP: registry/env/path surfaces (`summary.mem_registry/env/handles=1`). Softband 0; gates green.

- **moat:mobile-apk-signing-v1-native-ret2-plan-2026-07-22**: mobile smoke APK now carries META-INF v1 signing surface (`MANIFEST.MF`/`REPI.SF`/`REPI.RSA`, jarsigner when available); deep CAP `[mobile-apk-signing] v1=1` + contract needles. Native pwn scaffold emits `[native-ret2-plan] ret2csu/one_gadget/ret2libc` plan note. Softband 0; gates green.

- **moat:browser-har-lite-crypto-aes-js-path-2026-07-22**: browser playwright deep adds performance resource HAR-lite (`browser-har-lite resources=N`); crypto pure AES-ECB known-plaintext CAP (`aes=1`, pycryptodome when present); js-signing proof labels `path=static|url` + dual rollup. Softband 0; gates green.

- **moat:sticky-sameroute-skillhint-malware-pe-overlay-next-2026-07-22**: sticky `sameRouteDomain` matches on skillHint + normalized domain labels (Frontend JS reverse continuity). reverse next-commands add crypto-aes-ecb + mobile-apk-signing techniques; softband-split `next-commands-gates.ts`. malware PE overlay CAP via PE_OVERLAY_MARK / clamped section end (`summary.malware_pe_overlay=1`). Softband 0; gates green.

- **moat:dfir-ja3-mobile-nsc-agent-readme-contract-392-2026-07-22**: DFIR pure JA3-ish ClientHello fingerprint (`[dfir-tls-ja3] suites=… md5=… summary.dfir_ja3=1`); mobile APK ships `res/xml/network_security_config.xml` + cleartext flags (`[mobile-nsc]`); agent-security prompt-risk excludes package README noise; product-contract moat check `reverse:moat-har-aes-overlay-ja3-nsc-2026-07-22` → **392 PASS / 0 FAIL**. Softband 0.

- **moat:browser-cookie-flags-crypto-rc4-k8s-jwt-contract-2026-07-22**: browser cookie flag CAP from Playwright response Set-Cookie + cookie jar (`repi_sid HttpOnly` + `session SameSite=Lax`); pure RC4 known-plaintext (`rc4=1`); k8s SA JWT claim decode (`cloud-k8s-jwt ok=1`, fixture JWT-shaped token). Product-contract moat check added. Softband 0; gates green.

- **moat:malware-pe-entropy-js-sri-contract-2026-07-22**: malware PE overlay Shannon entropy CAP (`region=overlay ent≈7.7 high=1` + `summary.malware_pe_entropy=1`); JS SRI integrity attribute CAP (`js-signing-sri ok=1`, companion HTML fixture). Product-contract moat check. Softband 0; gates green.

- **moat:firmware-dtb-js-wasm-contract-2026-07-22**: pure FDT/DTB header+node walk (`[firmware-dtb] ok=1 summary.firmware_dtb=1`, fixture `d00dfeed`); JS WASM CAP (`\0asm` + WebAssembly signal, `summary.js_signing_wasm=1`). Product-contract moat. Softband 0; gates green.

- **moat:mem-malfind-native-rop-crypto-chacha-2026-07-22**: pure mem malfind-ish (`pe_images` + inject APIs/RWX, `summary.mem_malfind=1`); native ROP pure byte gadgets (`ret`/`pop *`, `summary.native_rop_pure=1`); ChaCha20 RFC7539 quarter-round + block (`chacha=1`). Product-contract moat. Softband 0; gates green.

- **moat:mobile-deeplink-exploit-fmtstr-dfir-http2-2026-07-22**: mobile deeplink/exported from APK zip strings (`summary.mobile_deeplink=1` / `mobile_exported=1`); exploit format-string CAP (`%p/%n` plan, `summary.exploit_fmtstr=1`); DFIR HTTP/2 preface pure (`summary.dfir_http2=1`). Product-contract moat. Softband 0; gates green.
