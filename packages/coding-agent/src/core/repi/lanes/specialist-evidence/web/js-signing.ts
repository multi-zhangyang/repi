/** Specialist evidence analyzer: web-js-signing. */
import type { LaneCommand, LaneCommandPack } from "../../../lane-commands/types.ts";
import { shellQuote } from "../../../target.ts";
import { interestingLines, truncateMiddle, uniqueMatches } from "../../../text.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";
// Landmark: js-signing-observed-rebuild / web-js-signing-domain-proof-exit (body in js-signing-followups.ts)
import {
	jsSigningEvidenceFollowups,
	jsSigningNextLane,
	jsSigningReverseCaptureFollowups,
} from "./js-signing-followups.ts";

export function analyzeJsSigningEvidence(pack: LaneCommandPack, combined: string): SpecialistEvidenceAnalysis {
	const enabled =
		/frontend|js/.test(pack.route.toLowerCase()) ||
		packHasSpecialistSignal(pack, /js-signing-rebuild|JS signing rebuild/i);
	if (!enabled) return { findings: [], followups: [] };
	const targetArg = shellQuote(pack.target || "<url>");
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const hookLines = interestingLines(
		combined,
		/\[repi-js-hook\]|fetch\.args|xhr\.open|xhr\.send|ws\.open|ws\.send|crypto\.subtle\.|sha256\(body\)|observed=/i,
		20,
	);
	if (hookLines.length > 0) {
		findings.push(
			`JS signing rebuild anchors: ${hookLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const cryptoOps = uniqueMatches(
		combined,
		/(crypto\.subtle\.(?:digest|sign|verify|encrypt|decrypt|importKey|deriveKey))/gi,
		12,
	);
	if (cryptoOps.length > 0) findings.push(`crypto.subtle operation anchors: ${cryptoOps.join(", ")}`);
	const normalizedLines = interestingLines(combined, /\[js-signing-normalized\]/i, 8);
	if (normalizedLines.length > 0) {
		findings.push(
			`JS signing normalized artifact anchors: ${normalizedLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const firstDivergenceLines = interestingLines(
		combined,
		/\[js-first-divergence\]|\[js-first-divergence-candidate\]/i,
		14,
	);
	if (firstDivergenceLines.length > 0) {
		findings.push(
			`JS first-divergence anchors: ${firstDivergenceLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const replayHarnessLines = interestingLines(combined, /\[js-replay-harness\]/i, 8);
	if (replayHarnessLines.length > 0) {
		findings.push(
			`JS signing replay harness anchors: ${replayHarnessLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	if (
		hookLines.length > 0 ||
		cryptoOps.length > 0 ||
		normalizedLines.length > 0 ||
		firstDivergenceLines.length > 0 ||
		replayHarnessLines.length > 0
	) {
		followups.push(...jsSigningEvidenceFollowups());
	}
	// reverse/web runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[web-js-signing-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(...jsSigningReverseCaptureFollowups(targetArg));
	}
	return {
		findings,
		followups,
		nextLane: jsSigningNextLane({
			firstDivergence: firstDivergenceLines.length,
			replay: replayHarnessLines.length,
			hooks: hookLines.length,
			crypto: cryptoOps.length,
			normalized: normalizedLines.length,
		}),
	};
}
