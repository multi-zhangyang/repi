/** Campaign phases for reverse/pwn/agentsec/dfir + report. */

import { createCampaignPhaseFactory } from "./campaign-phases-factory.ts";
import { textHasAny } from "./campaign-phases-helpers.ts";
import type { CampaignPhase } from "./domain-proof-exit/types.ts";
import type { MissionState } from "./mission.ts";

export function buildCampaignReverseHeavyPhases(
	mission: MissionState | undefined,
	map: any,
	targetRef: string,
	taskText: string,
	toolGaps: string[],
	sourceArtifacts: string[],
): Array<CampaignPhase | undefined> {
	const mkPhase = createCampaignPhaseFactory(mission, map, toolGaps, sourceArtifacts);
	return [
		mkPhase(
			"pwn-exploit",
			"把二进制/服务崩溃面推进到 primitive、leak、payload、稳定性和本地/远程一致性验证",
			"Pwn / exploit",
			mission?.route.domain === "Pwn / exploit" ||
				mission?.route.domain === "Exploit reliability" ||
				textHasAny(taskText, [/pwn|exploit|rop|heap|ret2libc|crash|primitive|autopwn|poc/i]),
			["mitigation fingerprint", "crash/control primitive", "offset/leak", "local verifier or replay matrix"],
			[/mitigation|primitive|exploit|replay|inventory|normalize|flake|bundle/i],
			[
				`re_lane plan primitive ${targetRef}`,
				`re_lane run primitive ${targetRef}`,
				`re_lane plan replay ${targetRef}`,
			],
		),
		mkPhase(
			"agentsec-boundary",
			"映射 prompt/tool/memory/RAG/MCP/sub-agent 边界并生成注入 replay harness 与隔离证据",
			"Agent / LLM boundary",
			mission?.route.domain === "Agent / LLM boundary" ||
				textHasAny(taskText, [/agent|llm|prompt injection|tool boundary|memory poisoning|mcp|rag|delegation/i]),
			["prompt surface", "tool schema/exec boundary", "memory poisoning path", "injection replay transcript"],
			[/surface|tool-boundary|memory|injection|delegation/i],
			[
				`re_lane plan surface ${targetRef}`,
				`re_lane run surface ${targetRef}`,
				`re_lane plan injection ${targetRef}`,
			],
		),
		mkPhase(
			"firmware-pcap-dfir",
			"串联固件/rootfs、PCAP/DFIR、恶意样本 IOC/config 与 transform chain 的证据链",
			"Firmware / PCAP / DFIR / Malware",
			mission?.route.domain === "Firmware / IoT" ||
				mission?.route.domain === "DFIR / PCAP / stego" ||
				mission?.route.domain === "Malware analysis" ||
				textHasAny(taskText, [/firmware|iot|rootfs|pcap|dfir|forensic|malware|ioc|yara|c2|binwalk|tshark/i]),
			[
				"image/pcap/sample fingerprint",
				"extracted artifact",
				"config/IOC or flow timeline",
				"transform/decode chain",
			],
			[/inventory|extract|filesystem|services|emulate|map|timeline|triage|static-config|behavior|decode/i],
			[`re_lane plan inventory ${targetRef}`, `re_lane run inventory ${targetRef}`, `re_lane plan map ${targetRef}`],
		),
		mkPhase(
			"report-audit",
			"收敛 campaign 证据、attack graph、复现命令、风险/影响、失败路线和下一步",
			mission?.route.domain ?? "Security reporting",
			true,
			["attack graph", "campaign artifact", "evidence ledger", "completion audit", "report scaffold"],
			[/report|bundle|writeup/i],
			["re_decision_core tick", "re_graph build", "re_campaign show", "re_complete audit", "re_complete scaffold"],
			[],
		),
	];
}
