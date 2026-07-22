/** Completion-audit reverse proof gates (catalog vs runtime capture). */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { reverseEvidenceProofLines } from "../reverse-evidence.ts";
import { reverseQuerySignalsFromEvidence } from "./reverse-signals.ts";

export { reverseQuerySignalsFromEvidence } from "./reverse-signals.ts";

export function auditReverseProofFromEvidence(evidence: string): {
	blockers: string[];
	warnings: string[];
	reverseSignals: string[];
	hasRuntimeProofExit: boolean;
	hasBindReady: boolean;
	hasCatalogProofExit: boolean;
} {
	const blockers: string[] = [];
	const warnings: string[] = [];
	const reverseSignals = reverseQuerySignalsFromEvidence(evidence);
	if (reverseSignals.length === 0) {
		warnings.push("evidence ledger lacks reverse query anchors (query.technique|mitre|cwe|proof_exit)");
	} else {
		for (const signal of reverseSignals.slice(0, 8)) warnings.push(`reverse_anchor: ${signal}`);
	}
	const proofLines = reverseEvidenceProofLines(
		evidence
			.split(/\r?\n/)
			.map((line: any) => line.replace(/^-\s*/, "").trim())
			.filter((line: any) => /^(?:query\.|summary\.|technique\.|proof\.|reverse_kind=)/i.test(line)),
	);
	const hasCatalogProofExit =
		proofLines.some((line: any) => /technique\.proof_exit=/i.test(line)) ||
		reverseSignals.some((signal: any) => /technique\.proof_exit=/i.test(signal));
	const hasBindReady =
		reverseSignals.some((signal: any) => /bind_ready=true/i.test(signal) || /bind\.ready=true/i.test(signal)) ||
		/bind_ready\s*[:=]\s*true/i.test(evidence) ||
		/bind\.ready\s*[:=]\s*true/i.test(evidence);
	const hasRuntimeProofExit =
		proofLines.some((line: any) => {
			const m = /^proof\.exit=(.+)$/i.exec(line);
			if (!m) return false;
			return /partial_runtime_capture|runtime_capture_strong/i.test(m[1].trim());
		}) ||
		reverseSignals.some((signal: any) => {
			const m = /(?:query\.)?proof_exit=([^\s|]+)/i.exec(signal);
			if (!m) return false;
			return /partial_runtime_capture|runtime_capture_strong/i.test(m[1].trim());
		});
	if (reverseSignals.length > 0 && !hasRuntimeProofExit) {
		blockers.push("reverse_proof_exit_missing: technique anchors present but runtime proof_exit capture absent");
		const domainNext = reverseDomainCaptureNextCommands({
			routeOrBlob: evidence,
			includeGates: false,
		});
		warnings.push(
			hasCatalogProofExit
				? `reverse_proof: catalog technique.proof_exit present; run ${domainNext.join(" | ")} to capture proof.exit=partial_runtime_capture|runtime_capture_strong`
				: "reverse_proof: set proof.exit= / query.proof_exit= from runtime capture (re_runtime_adapter run / domain runtime) before final claim",
		);
		if (!hasCatalogProofExit) {
			warnings.push(
				"reverse_proof: bind technique ids via reverseRuntimeTechniqueAnchor / re_techniques for checklist coverage",
			);
		}
		for (const cmd of domainNext.slice(0, 6)) {
			warnings.push(`reverse_next: ${cmd}`);
		}
	} else {
		for (const line of proofLines.slice(0, 6)) warnings.push(`reverse_proof: ${line}`);
		if (hasRuntimeProofExit) warnings.push("reverse_proof: runtime proof capture satisfied");
		if (hasBindReady) {
			warnings.push("reverse_proof: technique capture bind_ready=true");
		} else if (hasRuntimeProofExit || reverseSignals.length > 0) {
			// Reverse-heavy completion requires bind_ready once runtime capture exists.
			blockers.push("reverse_bind_ready_missing: runtime proof present/anchored but bind_ready=true absent");
			warnings.push("reverse_proof: bind_ready not yet true; keep technique bind before claim promotion");
			const domainNext = reverseDomainCaptureNextCommands({
				routeOrBlob: evidence,
				includeGates: true,
			});
			for (const cmd of domainNext.slice(0, 4)) warnings.push(`reverse_next: ${cmd}`);
		}
	}
	return {
		blockers,
		warnings,
		reverseSignals,
		hasRuntimeProofExit,
		hasBindReady,
		hasCatalogProofExit,
	};
}
