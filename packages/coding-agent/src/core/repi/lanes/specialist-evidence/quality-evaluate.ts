/** Specialist evidence quality scoring. */

import type { LaneCommandPack } from "../self-heal.ts";
import { selfHealCommandsForEvidence } from "../self-heal.ts";
import type { LaneCommand } from "../specialist-packs.ts";
import type { EvidenceCritic, SpecialistEvidenceAnalysis } from "./types.ts";

export function mergeSpecialistEvidenceAnalysis(
	analysis: SpecialistEvidenceAnalysis,
	findings: string[],
	followups: LaneCommand[],
): string | undefined {
	for (const finding of analysis.findings) {
		if (!findings.includes(finding)) findings.push(finding);
	}
	for (const followup of analysis.followups) {
		if (!followups.some((command: any) => command.label === followup.label && command.command === followup.command)) {
			followups.push(followup);
		}
	}
	return analysis.nextLane;
}
export function evaluateEvidenceQuality(params: {
	pack: LaneCommandPack;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	findings: string[];
	followups: LaneCommand[];
	nextLane?: string;
}): EvidenceCritic {
	const combined = `${params.result.stdout}\n${params.result.stderr}`;
	const deficits: string[] = [];
	let score = 0;
	if (params.result.code === 0) score += 20;
	else deficits.push(`nonzero exit ${params.result.code}`);
	if (params.result.killed) deficits.push("command killed or timed out");
	else score += 5;
	if (combined.trim().length >= 80) score += 10;
	else deficits.push("thin stdout/stderr transcript");
	if (params.pack.target && !/[<][A-Z_]+[>]/.test(params.pack.target)) score += 10;
	else deficits.push("no concrete target bound to lane");
	const toolOrTargetError =
		/command not found|not found|no such file|cannot access|permission denied|trace\/breakpoint trap/i.test(combined);
	if (toolOrTargetError) deficits.push("tool/target/runtime error present");
	else score += 10;
	const highSignal = params.findings.some(
		(finding) =>
			!/no high-signal|tool\/target\/runtime error|command-pack exited|killed/i.test(finding) &&
			/(address anchors|comparison|interesting output|metadata|route\/auth|JS runtime|Android|iOS IPA|iOS Mach-O|iOS Frida|iOS network|next command pack|tool repair anchors|browser\/XHR\/WS|websocket endpoint|cookie\/storage|browser CDP artifact|browser runtime artifact|browser replay evaluator|browser route graph|browser auth matrix|browser IDOR\/BOLA|browser authz state machine|browser authz sequence replay|browser authz object ownership|browser authz state rollback|web API static authz|web API schema|web API state mutation|web scanner scope|web scanner crawl|web scanner content discovery|web scanner template|web scanner manual replay|JS signing rebuild|JS signing normalized|JS first-divergence|JS signing replay harness|crypto\.subtle|crypto parameter derivation|crypto transform replay|crypto solver script|crypto known-answer|stego extraction|pwn primitive|pwn crash register|pwn cyclic offset|pwn gadget|pwn ROP\/libc|pwn local verifier|pwn heap\/tcache|pwn format-string|pwn SROP\/ret2dlresolve|pwn one_gadget|pwn seccomp\/sandbox|Exploit PoC inventory|PoC replay matrix|Exploit environment pin|Exploit flake triage|Exploit artifact bundle|PCAP\/DFIR|PCAP stream ranking|PCAP secret timeline|PCAP transform chain|PCAP extracted|memory forensics image|memory forensics process|memory forensics credential|memory forensics timeline|Malware static|Malware IOC|Malware behavior|Malware rule|Cloud identity|Cloud\/K8s runtime|Cloud metadata|Cloud privilege|Identity\/AD principal|Identity\/AD credential|Identity\/AD graph|Native deep|Native decompiler|Native compare trace|Native patch hypothesis|Native symbolic|Native fuzz|Frida\/GDB|runtime hook return)/i.test(
				finding,
			),
	);
	if (highSignal) score += 25;
	else deficits.push("no high-signal anchors parsed");
	if (params.followups.length > 0) score += 12;
	else deficits.push("no follow-up commands generated");
	if (params.nextLane) score += 8;
	if (toolOrTargetError) score -= 15;
	if (params.result.killed) score -= 15;
	score = Math.max(0, Math.min(100, score));
	const verdict: EvidenceCritic["verdict"] = score >= 70 ? "strong" : score >= 45 ? "partial" : "weak";
	const selfHeal =
		verdict === "strong"
			? []
			: selfHealCommandsForEvidence({
					pack: params.pack,
					result: params.result,
					findings: params.findings,
					deficits,
				});
	return { score, verdict, deficits, selfHeal };
}
