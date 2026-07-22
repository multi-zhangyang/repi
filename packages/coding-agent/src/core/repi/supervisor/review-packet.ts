/** Supervisor delegate packet review. */

import type { DelegatePacket } from "../delegate.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
/** Supervisor worker review, merge budget, and LLM critique. */
import type { SupervisorVerdict, SupervisorWorkerReview } from "../runtime-types.ts";
import { evidenceHitForPacket } from "../swarm-exec.ts";

export function reviewDelegatePacket(packet: DelegatePacket, ledger: string): SupervisorWorkerReview {
	const rationale: string[] = [];
	const conflicts: string[] = [];
	const evidenceGaps: string[] = [];
	const repairActions: string[] = [];
	let score = 45;
	if (packet.status === "done") {
		score += 30;
		rationale.push("packet status is done");
	}
	if (packet.status === "ready") {
		score += 10;
		rationale.push("packet has ready steps");
	}
	if (packet.status === "blocked") {
		score -= 25;
		conflicts.push("packet is blocked");
		repairActions.push("re_operation next");
	}
	if (packet.steps.length === 0) {
		score -= 20;
		evidenceGaps.push("no operation steps assigned");
	}
	if (packet.sourceArtifacts.length > 0) {
		score += 10;
		rationale.push("source artifacts attached");
	} else {
		score -= 10;
		evidenceGaps.push("no source artifact attached to packet");
		repairActions.push("re_operation plan");
	}
	if (evidenceHitForPacket(packet, ledger)) {
		score += 15;
		rationale.push("evidence ledger contains worker/contract anchors");
	} else {
		score -= 10;
		evidenceGaps.push(`ledger lacks ${packet.worker} evidence-contract anchors`);
	}
	// Reverse/product proof-exit gate: technique anchors without proof_exit are weak claims.
	const hasTechnique =
		/(?:query\.|summary\.)?technique\s*[=:]/i.test(ledger) ||
		/reverse_kind\s*=/i.test(ledger) ||
		/technique=/i.test(ledger);
	const hasProofExit =
		/(?:query\.|summary\.|technique\.|proof\.)?proof_exit\s*[=:]/i.test(ledger) ||
		/proof\.exit\s*=/i.test(ledger) ||
		/proof_exit=/i.test(ledger);
	const hasMitreOrCwe = /(?:query\.|summary\.|technique\.)?(?:mitre|cwe)\s*[=:]/i.test(ledger);
	if (hasTechnique && !hasProofExit) {
		score -= 15;
		conflicts.push("reverse technique anchors present without proof_exit");
		evidenceGaps.push("missing proof_exit for reverse technique claim");
		repairActions.push("re_complete audit");
		repairActions.push("re_domain_proof_exit show");
	} else if (hasProofExit) {
		score += 10;
		rationale.push("reverse proof_exit present in evidence ledger");
	}
	if (hasMitreOrCwe) {
		score += 5;
		rationale.push("reverse mitre/cwe anchors present");
	}
	const readySteps = packet.steps.filter((step: any) => step.status === "ready");
	if (readySteps.length > 0) repairActions.push(...readySteps.slice(0, 3).map((step: any) => step.command));
	if (packet.recommendedTools.length > 0)
		repairActions.push(`re_bootstrap plan ${packet.recommendedTools.slice(0, 6).join(" ")}`);
	const uniqueCommands = new Set(packet.steps.map((step: any) => step.command));
	if (uniqueCommands.size < packet.steps.length) conflicts.push("duplicate operation commands inside packet");
	score = Math.max(0, Math.min(100, score));
	const verdict: SupervisorVerdict =
		packet.status === "blocked" ? "blocked" : score >= 80 ? "pass" : score >= 60 ? "watch" : "repair";
	const priority = verdict === "blocked" ? 1 : verdict === "repair" ? 2 : verdict === "watch" ? 3 : 4;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${packet.worker ?? ""} ${packet.objective ?? ""} ${ledger.slice(0, 2000)}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${packet.worker ?? ""} ${packet.objective ?? ""}`,
				includeGates: true,
			}).slice(0, 3)
		: [];
	if (reverseNext.length) repairActions.push(...reverseNext);
	return {
		packetId: packet.id,
		worker: packet.worker,
		verdict,
		score,
		priority,
		rationale: rationale.length ? rationale : ["packet requires supervisor follow-up"],
		conflicts,
		evidenceGaps,
		repairActions: Array.from(new Set(repairActions)).slice(0, 8),
	};
}
