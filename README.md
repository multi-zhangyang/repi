# REPI

**REPI** 是面向 **逆向工程、渗透测试、固件/移动安全、恶意样本与取证分析** 的终端智能体（Agent Harness）。

它不是通用聊天机器人，也不是「只会写代码」的 coding agent。REPI 在本机真实环境中调度工具、跑验证、收证据，把逆向/渗透任务做成 **可复现的执行闭环**。

```text
目标识别 → 路线拆解 → 工具执行 → 证据固化 → 证明门禁 → 复现交付
```

---

## 为什么是 REPI

| 维度 | REPI |
|------|------|
| 产品定位 | 独立 reverse / pentest agent（`repi`，`~/.repi`） |
| 执行方式 | 本机真实工具链 + 结构化证据，而非纯文本臆测 |
| 能力域 | native / pwn / firmware / mobile / malware / memory / DFIR / web / cloud / crypto / agent-security |
| 模型接入 | 仅环境变量 / `models.json` / `registerProvider`，不捆绑上游模型目录 |
| 与 Pi 关系 | 吸收 Pi / Claude Code 式 harness 运行时能力；产品层独立，不与 `pi` / `~/.pi` 冲突 |

---

## 核心能力

### 多域逆向与渗透

- **Native / Pwn**：checksec、ROP 面、seccomp、dyn 偏移、ret2 规划、angr/qiling 等宿主能力
- **Firmware / IoT**：镜像签名、squashfs/rootfs、DTB/FDT、binwalk 提取路径
- **Mobile**：APK 静态面、签名、NSC/SSL pin、Frida local attach、deeplink/exported
- **Malware**：PE 节/导出/overlay/熵、YARA/capa/floss 宿主优先
- **Memory / DFIR**：vol 宿主 + pure 补强、pcap 多协议、JA3/HTTP2、handles/env 等
- **Web / JS / Browser**：authz 回滚、JS 签名/SRI/WASM、Playwright 安全头与 cookie flags
- **Cloud / Identity**：IMDS 诚实标签、k8s SA JWT claim、STS fixture、docker 网络面
- **Crypto**：参数盘点、RSA/AES/RC4/ChaCha pure 向量、z3/openssl 宿主
- **Agent Security**：prompt/tool/MCP/权限面扫描（产品包范围，去噪声）

### 证据与门禁

- 运行时 **proof.exit**（`partial` / `strong`）与 **bind_ready**
- 产品命令：`repi reverse-smoke | reverse-e2e | reverse-proof | reverse-complete | reverse-gate`
- 产品契约：`node scripts/reverse-agent/repi-product-contract.mjs`（多域 CAP + 结构门禁）
- Doctor：`repi doctor`（含 memory 产品面移除等就绪检查）

### 长任务与 harness

- Goal Mode、sticky multi-turn inject（冷启动 lean + 后续 sticky）
- 专家 lane / 子代理拆分（explorer、planner、operator、verifier 等）
- 扩展兼容上游 pi 扩展生态（可选）

---

## 快速开始

### 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/multi-zhangyang/repi/main/install.sh | bash
```

装好后确认：

```bash
repi --version
repi doctor
```

### 从源码（开发 / 贡献）

```bash
git clone https://github.com/multi-zhangyang/repi.git
cd repi
npm install --ignore-scripts
npm run build -w @repi/ai -w @repi/tui -w @repi/agent-core -w @repi/coding-agent
# 或直接用仓库包装脚本：./repi
```

### npm 包（发布后）

| 包 | 用途 |
|----|------|
| `@repi/coding-agent` | `repi` CLI（主产品） |
| `@repi/ai` | 模型/provider 运行时 |
| `@repi/agent-core` | agent loop / harness 核心 |
| `@repi/tui` | 终端 UI |

```bash
# 典型：安装 CLI（需已发布到 npm）
npm i -g @repi/coding-agent
```

### 模型环境（OpenAI 兼容，通用网关）

```bash
export REPI_AUTH_TOKEN="YOUR_TOKEN"                 # 勿提交仓库
export REPI_BASE_URL="https://api.example.com/v1"   # 需含 /v1
export REPI_MODEL="provider/model-id"
export REPI_MODEL_API="openai-compatible"           # openai-compatible | anthropic | ...
export REPI_PROVIDER="my-provider"                  # 可选标签

repi doctor
repi --provider my-provider --model "provider/model-id" -p "对目标做逆向路线盘点" --no-session
```

也可写入 `~/.repi/agent/models.json` + `~/.repi/agent/settings.json`（本地配置，勿 commit 密钥）。

> 进程环境中的 token 才用于真实调用；transcript 可能脱敏。**禁止**把真实 token 写进仓库、Issue 或文档示例。

### 常用命令

```bash
repi doctor                 # 就绪检查
repi smoke --json           # 产品冒烟栈
repi reverse-smoke all      # 多域 CAP 刷新
repi reverse-proof          # 证明审计
repi reverse-complete       # 完成度审计
repi reverse-gate core      # proof + complete + e2e 编排
repi reverse-sticky-smoke   # 多轮 sticky inject 冒烟
```

运行时数据目录：`~/.repi/agent`（与 `pi` / `~/.pi` 隔离）。

---

## 系统要求

- **OS**：Linux / macOS / WSL（推荐 Linux 宿主做完整 reverse CAP）
- **Node.js**：`>= 22.19.0`
- **Git**
- 按任务按需安装宿主工具：`gdb`、`rizin/radare2`、`tshark`、`binwalk`、`frida`、`jadx`、`apktool`、`yara`、`volatility3`、`one_gadget`、`seccomp-tools` 等

纯 Python 路径可作为宿主缺失时的 **诚实补强**（带 `pure_python=` 标签），不伪装成宿主成功。

---

## 架构一览

```text
CLI (repi)
  → coding-agent / recon profile
    → reverse-runtime / web-runtime / runtime-adapter
      → 工具输出 + structuredSummary
        → proof 字段 / bind / completion 审计
          → reverseDomainCaptureNextCommands
            → 证据与下一跳
```

产品原则（摘要）：

1. **独立 reverse/pentest 产品**，不做成泛安全闲聊或通用 coding 壳。
2. **证明优先于叙事**：catalog technique ≠ 运行时 capture。
3. **宿主优先、pure 补强**，禁止虚假 `ok=1`。
4. **Memory 产品面已移除**（doctor：`memory:product-removed`）；勿再引入 `settings.memory` 默认自动沉淀。
5. **模型仅 env / models.json / registerProvider**，无内置上游模型大全。

更多运行时说明见：

- `docs/reverse-agent/README.md`
- `docs/reverse-agent/repi-runtime-configuration.md`
- `docs/reverse-agent/harness-gap-analysis.md`

---

## 仓库结构（简）

```text
repi/
├── packages/
│   ├── coding-agent/     # REPI 产品内核、CLI、reverse/web runtime
│   ├── agent/            # agent harness
│   ├── ai/               # 模型/provider 层
│   └── tui/              # 终端 UI
├── scripts/reverse-agent/  # smoke / contract / fixtures / gate
├── docs/reverse-agent/     # 宿主 CAP 证据与设计说明
├── repi / repi-test.sh     # 启动包装
└── package.json            # monorepo 工作区
```

---

## 开发

```bash
npm install --ignore-scripts
npm run check                 # 类型/静态检查（改代码后）
# 测试：仓库约定优先 ./test.sh 或单测路径，勿默认全量 e2e 扫真实 endpoint
node scripts/reverse-agent/repi-product-contract.mjs /path/to/repi
```

贡献约定见 `CONTRIBUTING.md`、`AGENTS.md`。

---

## 安全与合规说明

- REPI 用于 **授权范围内的** 安全研究、攻防演练与工程验证。
- 不在产品中内置「越狱 / 绝对服从」类行为。
- 不将真实密钥、cookie、私钥写入仓库；示例一律占位符。
- Cloud / IMDS / STS 等路径区分 **fixture / mock / scaffold**，避免假成功。

---

## 版本与许可

- 当前 monorepo 版本见根 `package.json`（lockstep 工作区）
- License：**MIT**

---

## 链接

- 仓库：<https://github.com/multi-zhangyang/repi>
- 议题：<https://github.com/multi-zhangyang/repi/issues>

---

## 与旧仓库的关系

本仓库由 reverse/pentest 方向的深度改造演进而来（历史远程可能仍指向 `repi`）。  
**产品名、CLI、运行目录与文档一律以 REPI / `repi` / `~/.repi` 为准**；Pi 仅作为内部 harness 能力参考与兼容层，不是产品对外身份。
