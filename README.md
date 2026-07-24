# REPI

**REPI** 是面向逆向工程与渗透测试的终端执行智能体。

在本机真实工具链上调度任务、固化证据、通过证明门禁，把 reverse / pwn / web / 固件 / 移动 / 恶意样本 / 取证等工作做成可复现的执行闭环——不是聊天机器人，也不是通用 coding assistant。

```text
识别目标 → 路由域能力 → 运行时捕获 → 证据绑定 → 证明门禁 → 交付复现
```

| | |
|---|---|
| 产品 | 独立 reverse / pentest agent（`repi` CLI） |
| 运行目录 | `~/.repi/agent`（与 `pi` / `~/.pi` 隔离） |
| 版本 | `0.1.3`（monorepo lockstep） |
| 许可 | MIT |
| 仓库 | https://github.com/multi-zhangyang/repi |

---

## 能力概览

### 执行域

| 域 | 覆盖 |
|----|------|
| Native / Pwn | checksec、ROP、seccomp、动态偏移、exploit lab、宿主 angr / qiling / rizin |
| Firmware | 镜像签名、rootfs / squashfs、DTB、binwalk 提取与目录探针 |
| Mobile | APK 静态面、签名 / NSC、Frida 本机 attach、deeplink / exported |
| Malware | PE 结构 / overlay / 熵、YARA / capa / floss（宿主优先） |
| Memory / DFIR | Volatility 宿主与 pure 补强、pcap 协议面、JA3 / HTTP2 |
| Web / Browser / JS | authz 状态机、JS 签名 / SRI / WASM、Playwright 安全头与 cookie |
| Cloud / Identity | IMDS 诚实探测、k8s SA JWT、docker 面、本地 IAM 策略 |
| Crypto | 参数盘点、AES / RSA / RC4 / ChaCha 向量、openssl / z3 宿主 |
| Agent Security | prompt / tool / MCP / 权限面扫描 |

### 运行时契约

- **proof.exit**：`partial_runtime_capture` \| `runtime_capture_strong`（运行时捕获，不是目录里的 technique 标签）
- **bind_ready**：证据与任务绑定后才可主张完成
- 关单骨架：`HARNESS_BUGS:`（仅工具失败）与 `PROOF:`（目标发现 / proof.exit + bind）两行分开输出
- 协议 thrash 控制：捕获优先、关单就绪后软拦重复侧工具

### 质量门禁

```bash
repi doctor                 # 安装与运行时就绪
repi smoke --json           # 离线产品冒烟
repi reverse-smoke all      # 多域宿主 CAP
repi reverse-proof          # 证明审计
repi reverse-complete       # 完成度审计
repi reverse-gate core      # proof + complete + e2e
node scripts/reverse-agent/repi-product-contract.mjs .
```

---

## 安装

### 推荐：一键脚本

```bash
curl -fsSL https://raw.githubusercontent.com/multi-zhangyang/repi/main/install.sh | bash
```

常用选项：

```bash
# 指定安装前缀 / 系统路径
bash install.sh --prefix ~/.repi-src --user
# 已有 clone 上刷新 launcher（跳过 npm）
bash install.sh --skip-npm
```

验证：

```bash
repi --version
repi doctor
```

### GitHub Release 包

从 [Releases](https://github.com/multi-zhangyang/repi/releases) 下载同版本 tarball 后：

```bash
npm i -g \
  ./repi-ai-0.1.3.tgz \
  ./repi-tui-0.1.3.tgz \
  ./repi-agent-core-0.1.3.tgz \
  ./repi-coding-agent-0.1.3.tgz

repi --version && repi doctor
```

### 源码开发

```bash
git clone https://github.com/multi-zhangyang/repi.git
cd repi
npm install --ignore-scripts
npm run build -w @repi/ai -w @repi/tui -w @repi/agent-core -w @repi/coding-agent
./repi --version
```

### 工作区包

| 包 | 职责 |
|----|------|
| `@repi/coding-agent` | `repi` CLI 与 reverse 产品内核 |
| `@repi/agent-core` | agent loop / harness |
| `@repi/ai` | 模型与 provider 运行时 |
| `@repi/tui` | 终端 UI |

> 主安装路径：`install.sh` 或 Release tarball。npm registry 上的 `@repi/*` 以实际发布状态为准；未发布前请勿把 `npm i -g @repi/coding-agent` 当作默认安装方式。

---

## 配置模型

REPI **不捆绑**内置模型目录。通过环境变量、`~/.repi/agent/models.json` 或 `repi model` 接入任意 OpenAI 兼容 / Anthropic 兼容端点。

```bash
export REPI_AUTH_TOKEN="YOUR_TOKEN"
export REPI_BASE_URL="https://api.example.com/v1"
export REPI_MODEL="provider/model-id"
export REPI_MODEL_API="openai-compatible"   # openai-compatible | anthropic | ...
export REPI_PROVIDER="my-provider"          # 可选标签

repi doctor
repi model status
repi --provider my-provider --model "provider/model-id" \
  -p "对本地二进制做 native 逆向路线" --no-session
```

也可写入：

- `~/.repi/agent/settings.json` — 默认 provider / model / thinking
- `~/.repi/agent/models.json` — provider 与模型列表

**勿将真实 token、cookie、私钥提交到仓库或 Issue。** 进程环境中的凭据用于真实调用；日志/transcript 可能脱敏。

---

## 快速使用

```bash
# 交互
repi

# 单次 print（无会话落盘）
repi -p "对 /path/to/bin 做 pwn 逆向捕获并关单" --no-session

# 指定模型与思考强度
repi --provider my-provider --model "provider/model-id" --thinking high

# 自检
repi doctor
repi doctor --fix
repi smoke --json
```

典型协议路径（模型驱动工具）：

```text
re_route → re_map → 域捕获工具（native / browser / adapter / mobile / js / authz / exploit_lab）
         → re_domain_proof_exit → re_operator → re_complete
         → HARNESS_BUGS: … / PROOF: …
```

运行时数据：`~/.repi/agent`。

---

## 仓库结构

```text
repi/
├── packages/
│   ├── coding-agent/          # CLI、reverse 内核、协议与工具
│   ├── agent/                 # harness / agent loop
│   ├── ai/                    # providers & models runtime
│   └── tui/                   # 终端 UI
├── scripts/reverse-agent/     # doctor / contract / smoke / gate
├── docs/reverse-agent/        # 运行时说明与宿主 CAP 证据
├── install.sh                 # 一键安装
├── repi / repi-test.sh        # 本地启动包装
└── package.json               # monorepo workspaces
```

---

## 架构

```text
repi CLI
  └─ coding-agent / reverse profile
       ├─ route · mission · thrash / obedience
       ├─ reverse-runtime · web-runtime · runtime-adapter
       ├─ 宿主工具 + pure 补强（诚实标签）
       └─ proof.exit · bind_ready · completion 审计
            └─ 证据账本 · reverse_domain_next
```

原则：

1. **证明优先于叙事** — catalog technique ≠ 运行时 capture  
2. **宿主优先，pure 补强** — 不把缺失工具伪装成成功  
3. **Memory 产品面已移除** — doctor：`memory:product-removed`；无 `settings.memory` 默认沉淀  
4. **模型仅 env / models.json / registerProvider** — 无内置模型大全  
5. **与 Pi 隔离** — 产品身份是 REPI；Pi 仅作 harness 能力参考

深入阅读：

- [`docs/reverse-agent/README.md`](docs/reverse-agent/README.md)
- [`docs/reverse-agent/repi-runtime-configuration.md`](docs/reverse-agent/repi-runtime-configuration.md)

---

## 开发

```bash
npm install --ignore-scripts
npm run check
node scripts/reverse-agent/repi-product-contract.mjs .
```

- 改代码后跑 `npm run check`（biome / tsgo / contract / browser-smoke）
- 测试约定见 `AGENTS.md`：优先 `./test.sh` 或单测路径，勿默认触发依赖真实 endpoint 的 e2e
- 贡献流程：`CONTRIBUTING.md`

### 环境要求

- **OS**：Linux / macOS / WSL（完整 reverse CAP 推荐 Linux 宿主）
- **Node.js**：`>= 22.19.0`
- **Git**
- 按任务按需安装：`gdb`、`rizin`/`radare2`、`tshark`、`binwalk`、`frida`、`jadx`、`apktool`、`yara`、`volatility3`、`one_gadget`、`seccomp-tools` 等

宿主缺失时 pure Python 路径可作补强，并带 `pure_python=` 等诚实标签。

---

## 安全使用

- 仅用于**授权范围内**的安全研究、攻防演练与工程验证  
- 不内置「越狱 / 绝对服从」类行为  
- Cloud / IMDS / STS 等路径区分 fixture、mock 与真实凭据，避免假成功  
- 示例中的 token / URL 均为占位符  

---

## 链接

- 源码：https://github.com/multi-zhangyang/repi  
- Issues：https://github.com/multi-zhangyang/repi/issues  
- Releases：https://github.com/multi-zhangyang/repi/releases  

---

## License

MIT — 见 [`LICENSE`](LICENSE)。
