/** Swarm reverse merge claim gate (pure). */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { swarmReverseQuerySignals } from "./reverse-pure-signals.ts";

export function swarmReverseMergeClaimGate(text: string): {
	blocked: boolean;
	ready: boolean;
	reasons: string[];
	proofExit: string;
	bindReady: boolean;
	evidenceHashes: string[];
	next: string[];
	release: string;
} {
	const signals = swarmReverseQuerySignals(text);
	const blob = [text, ...signals].join("\n");
	const proofExit =
		/(?:reverse\.)?proof_exit\s*[=:]\s*([^\n|\s]+)/i.exec(blob)?.[1]?.trim() ||
		/proof\.exit\s*=\s*([^\n|\s]+)/i.exec(blob)?.[1]?.trim() ||
		"pending_runtime_capture";
	const bindReady =
		/(?:reverse\.)?bind_ready\s*[=:]\s*true/i.test(blob) && !/(?:reverse\.)?bind_ready\s*[=:]\s*false/i.test(blob);
	const evidenceHashes = Array.from(
		new Set(blob.match(/\b(?:stdout_sha256|stderr_sha256|sha256|hash)=[0-9a-f]{8,64}\b/gi) ?? []),
	).slice(0, 12);
	const reverseHeavy =
		/reverse|pwn|native|mobile|firmware|malware|checksec|gdb|rop|frida|frontend|js|browser|authz|web|reverser|proof_exit|bind_ready/i.test(
			blob,
		);
	const reasons: string[] = [];
	if (reverseHeavy) {
		if (!/^(partial_runtime_capture|runtime_capture_strong)$/i.test(proofExit)) {
			reasons.push(`proof_exit_missing:${proofExit}`);
		}
		if (!bindReady) reasons.push("bind_ready_false");
		if (evidenceHashes.length === 0) reasons.push("evidence_hash_missing");
	}
	const ready = reverseHeavy ? reasons.length === 0 : true;
	const next = ready ? [] : reverseDomainCaptureNextCommands({ routeOrBlob: blob, includeGates: false });
	return {
		blocked: reverseHeavy && !ready,
		ready,
		reasons,
		proofExit,
		bindReady,
		evidenceHashes,
		next,
		release: reverseHeavy && !ready ? "blocked_until_runtime_capture_and_bind_ready" : "ready",
	};
}
