/** REPI prompt catalog: core reverse/web/native entries. */
export const RECON_PROMPTS_CORE = [
	{
		name: "repi-config",
		description: "REPI 模型/provider/API key/auto compact 配置说明",
		argumentHint: "[provider-or-error]",
		content:
			'REPI configuration help: $ARGUMENTS\n\n直接给出 ~/.repi/agent/models.json、~/.repi/agent/settings.json、~/.repi/agent/auth.json 的配置步骤；优先使用 repi model add/login/default/test 命令，再给 OpenAI Chat Completions-compatible / OpenAI Responses-compatible / Anthropic-compatible / local runtime JSON 示例；网关格式不确定时先给 openai-completions 配置步骤和 repi model test 验证步骤；给 repi model doctor、repi --offline --list-models 和 repi --offline --list-models <provider-or-model> 做 parse-only 验证；真实调用可用 repi model test --provider <provider-id> --model <model-id> 或 repi --provider <provider-id> --model <model-id> --thinking off --no-tools --no-session -p "Reply exactly: PROVIDER_OK"；说明 auto compact 默认 triggerPercent=85、warningPercent=80、reserveTokens=16384、keepRecentTokens=36000，阈值 min(contextWindow * triggerPercent / 100, contextWindow - reserveTokens)。',
	},
	{
		name: "reverse",
		description: "REPI 二进制/逆向工作流",
		argumentHint: "<target-path-or-description>",
		content:
			"REPI reverse task: $ARGUMENTS\n\n路由、被动映射、hash/格式/架构/保护、最小路径证明、验证命令、证据块、记忆回写。",
	},
	{
		name: "native",
		description: "REPI ELF/SO GDB/Pwn 动态运行时工作流",
		argumentHint: "<elf-or-so>",
		content:
			"REPI native runtime task: $ARGUMENTS\n\n运行 re_native_runtime run，生成 binary inventory、mitigation matrix、loader/libc map、symbol/string map、GDB breakpoint trace、crash/register anchors、pwntools scaffold 和 native_runtime_artifact；再用 re_verifier/re_compiler/re_exploit_lab 固化证据。",
	},
	{
		name: "websec",
		description: "REPI Web/API 渗透验证工作流",
		argumentHint: "<url-or-project>",
		content:
			"REPI web/api task: $ARGUMENTS\n\n映射 routes/auth/session/middleware/workers/storage，生成 route graph/auth matrix/IDOR-BOLA/authz state-machine probe，证明一个最小请求顺序，输出可复现 PoC。",
	},
	{
		name: "webauthz",
		description: "REPI Web/API 授权状态机与 IDOR/BOLA 工作流",
		argumentHint: "<url>",
		content:
			"REPI web authz task: $ARGUMENTS\n\n运行 re_web_authz_state run/run，生成 route inventory、principal matrix、object probes、state machine、sequence replay、ownership checks、rollback checks 和 web_authz_artifact；再用 re_verifier/re_compiler/re_replayer 固化证据。",
	},
	{
		name: "mobile",
		description: "REPI Android/APK Frida 动态运行时工作流",
		argumentHint: "<apk-or-package>",
		content:
			"REPI mobile runtime task: $ARGUMENTS\n\n运行 re_mobile_runtime run/run，生成 APK inventory、ADB device/process map、Frida Java crypto/String/native compare hooks、anti-debug/root check anchors、native trace 和 mobile_runtime_artifact；再用 re_verifier/re_compiler/re_knowledge_graph 固化证据。",
	},
	{
		name: "firmware",
		description: "REPI Firmware/IoT rootfs 逆向渗透工作流",
		argumentHint: "<firmware.bin|rootfs>",
		content:
			"REPI firmware/IoT task: $ARGUMENTS\n\n运行 firmware-static-fingerprint-scaffold、firmware-extract-rootfs-scaffold、firmware-filesystem-config-secret-scaffold、firmware-service-surface-scaffold、firmware-emulation-scaffold；输出 Firmware image metadata anchors、Firmware extraction/rootfs anchors、Firmware config/secret anchors、Firmware service/web surface anchors、Firmware emulation/runtime anchors。",
	},
	{
		name: "malware",
		description: "REPI 恶意样本配置/IOC/行为分析工作流",
		argumentHint: "<sample-path>",
		content:
			"REPI malware task: $ARGUMENTS\n\n运行 malware-static-triage-scaffold、malware-yara-capa-floss-scaffold、malware-ioc-config-scaffold、malware-behavior-trace-scaffold；输出 Malware static triage anchors、Malware rule/capability anchors、Malware IOC/config anchors、Malware behavior trace anchors 和 IOC/config/behavior 报告。",
	},
	{
		name: "pwn",
		description: "REPI Pwn exploit 工程工作流",
		argumentHint: "<binary> [remote]",
		content:
			"REPI pwn task: $ARGUMENTS\n\nchecksec/file/ldd，分类 primitive，证明控制/leak，跑 cyclic offset analyzer，生成 ROP/libc scaffold 与 pwn local verifier，补 heap/tcache、format-string、SROP/ret2dlresolve、one_gadget constraint、seccomp/sandbox 专项证据，写 pwntools exploit template，远程稳定化。",
	},
	{
		name: "exploit",
		description: "REPI exploit reliability / autopwn 稳定化工作流",
		argumentHint: "<poc-or-target>",
		content:
			"REPI exploit reliability task: $ARGUMENTS\n\n运行 exploit-poc-normalizer-scaffold、exploit-replay-matrix-scaffold、exploit-environment-pin-scaffold、exploit-flake-triage-scaffold、exploit-artifact-bundle-scaffold；输出 Exploit PoC inventory anchors、PoC replay matrix anchors、Exploit environment pin anchors、Exploit flake triage anchors、Exploit artifact bundle anchors。",
	},
] as const;
