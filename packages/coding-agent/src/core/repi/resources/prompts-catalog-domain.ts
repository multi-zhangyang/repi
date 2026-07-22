/** REPI prompt catalog: domain/specialist entries. */
export const RECON_PROMPTS_DOMAIN = [
	{
		name: "jsre",
		description: "REPI JS 签名/加密参数逆向工作流",
		argumentHint: "<url/request/param>",
		content:
			"REPI JS reverse task: $ARGUMENTS\n\nObserve → Capture → Normalize → Rebuild → First-Divergence → Replay → DeepDive，输出本地复现脚本和证据。",
	},
	{
		name: "agentsec",
		description: "REPI Agent/LLM prompt-tool-memory 边界验证工作流",
		argumentHint: "<agent-app-or-workspace>",
		content:
			"REPI agent boundary task: $ARGUMENTS\n\n运行 agent-prompt-surface-map、agent-tool-boundary-scaffold、agent-memory-poisoning-scaffold、agent-injection-replay-harness、agent-delegation-trace-scaffold；输出 Agent prompt surface anchors、Agent tool boundary anchors、Agent memory poisoning anchors、Agent injection replay anchors、Agent delegation trace anchors。",
	},
	{
		name: "pcap",
		description: "REPI PCAP/DFIR 流量取证工作流",
		argumentHint: "<capture.pcapng>",
		content:
			"REPI PCAP/DFIR task: $ARGUMENTS\n\ncapinfos/tshark 元数据，stream ranking，secret timeline，HTTP object/carve，transform-chain 解码，输出复现命令和证据。",
	},
	{
		name: "cloud",
		description: "REPI Cloud/K8s identity 与权限边工作流",
		argumentHint: "<workspace-or-context>",
		content:
			"REPI Cloud/K8s task: $ARGUMENTS\n\n运行 cloud-identity-config-map、cloud-runtime-config-scaffold、cloud-metadata-probe-scaffold、cloud-privilege-edge-scaffold；输出 Cloud identity anchors、Cloud/K8s runtime config anchors、Cloud metadata probe anchors、Cloud privilege edge anchors 和最小权限边证明。",
	},
	{
		name: "identity",
		description: "REPI Identity/AD graph 与凭据可用性工作流",
		argumentHint: "<domain/dc/target>",
		content:
			"REPI Identity/AD task: $ARGUMENTS\n\n运行 identity-ad-principal-enum-scaffold、identity-ad-credential-usability-scaffold、identity-ad-graph-scaffold；输出 Identity/AD principal anchors、Identity/AD credential usability anchors、Identity/AD graph edge anchors 和最小 pivot/privilege edge 证明。",
	},
	{
		name: "chain",
		description: "REPI 漏洞/利用链自动编排工作流",
		argumentHint: "<target-or-case>",
		content:
			"REPI exploit chain task: $ARGUMENTS\n\n运行 re_exploit_chain plan/compose，把 map、browser、web_authz、native/mobile runtime、exploit_lab、verifier/compiler/replayer/autofix/proof-loop/knowledge artifacts 以及 proof-loop specialist_queue/swarm_bridge 编排成 exploit_chain、proof_path、exploit_path、evidence_gaps、replay_commands 和 operator_queue。",
	},
	{
		name: "decision",
		description: "REPI 决策内核 / 下一步执行仲裁工作流",
		argumentHint: "<target-or-case>",
		content:
			"REPI decision core task: $ARGUMENTS\n\n运行 re_decision_core plan/tick/run，把 mission checkpoints、active lane、tool posture、artifact posture、evidence priority 和 kernel/context 状态仲裁成 objective_stack、check_pressure、decision_rules、operator_queue、operator_next_command 和 decision_artifact / executed_steps；run 后接 re_proof_loop run <target> 4 2 闭合 verifier→compiler→replayer→autofix 证据链，并在 partial/needs_repair 时自动产出 specialist_queue/swarm_bridge、接入 re_delegate plan → re_swarm run → re_supervisor repair。",
	},
	{
		name: "memory",
		description: "整理当前任务并写入 REPI 证据笔记",
		argumentHint: "[scene/title]",
		content:
			"将当前会话中可复用的逆向/渗透经验写入 REPI evidence notes：目标、路由、证据、有效方法、失败路线、复现命令、下次复用；写入后可调用 re_evidence show / re_profile_check / re_lane next，生成 orchestrator-report、store-report、store-snapshot、usefulness-eval、distillation-report、pattern-book、quarantine、injection-packet、supervisor-report 与 lifecycle-board。",
	},
] as const;
