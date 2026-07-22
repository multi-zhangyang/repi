/** Crypto/stego specialist evidence analyzer. */

/**
 * Specialist evidence analyzers: crypto-malware.
 */
import type { LaneCommand, LaneCommandPack } from "../../lane-commands/types.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { interestingLines, truncateMiddle } from "../../text.ts";
import { packHasSpecialistSignal } from "../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "./types.ts";

export function analyzeCryptoStegoEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/crypto|stego/i.test(pack.route) ||
		packHasSpecialistSignal(pack, /crypto-stego|crypto\/stego|solver|known-answer/i) ||
		/\[crypto-(?:param|transform|solver|known-answer)\]|\bzsteg\b|\bexiftool\b/i.test(combined);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const paramLines = interestingLines(
		combined,
		/\[crypto-param\]|modulus|exponent|nonce|iv=|salt|PEM|integer_index/i,
		22,
	);
	if (paramLines.length > 0) {
		findings.push(
			`crypto parameter derivation anchors: ${paramLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const transformLines = interestingLines(
		combined,
		/\[crypto-transform\]|chain=.*->|base64|hex|gzip|zlib|decoded=|transform replay/i,
		24,
	);
	if (transformLines.length > 0) {
		findings.push(
			`crypto transform replay anchors: ${transformLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const solverLines = interestingLines(
		combined,
		/\[crypto-solver\]|z3=|sage|pycryptodome|solve\.py|oracle|lattice/i,
		18,
	);
	if (solverLines.length > 0) {
		findings.push(
			`crypto solver script anchors: ${solverLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const knownAnswerLines = interestingLines(
		combined,
		/\[crypto-known-answer\]|known-answer|verification=pass|KAT|assert/i,
		14,
	);
	if (knownAnswerLines.length > 0) {
		findings.push(
			`crypto known-answer test anchors: ${knownAnswerLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const stegoLines = interestingLines(
		combined,
		/zsteg|exiftool|binwalk|steghide|strings.*flag|embedded|metadata/i,
		16,
	);
	if (stegoLines.length > 0) {
		findings.push(
			`stego extraction anchors: ${stegoLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	if (paramLines.length > 0 || transformLines.length > 0 || solverLines.length > 0 || stegoLines.length > 0) {
		followups.push({
			label: "crypto-parameter-inventory-rerun",
			command: `[ -f /tmp/repi-crypto-inventory.py ] && python3 /tmp/repi-crypto-inventory.py ${targetArg} || printf '%s\n' 'rerun crypto-stego-parameter-inventory-scaffold via re_lane plan/run'`,
			evidence: "refresh parameter inventory before solver changes",
		});
		followups.push({
			label: "crypto-transform-replay-rerun",
			command: `[ -f /tmp/repi-crypto-transform.py ] && python3 /tmp/repi-crypto-transform.py ${targetArg} || printf '%s\n' 'rerun crypto-stego-transform-replay-scaffold via re_lane plan/run'`,
			evidence: "rerun deterministic transform replay chain with latest artifact",
		});
		followups.push({
			label: "crypto-solver-known-answer-rerun",
			command: `[ -f /tmp/repi-crypto-solver.py ] && REPI_KNOWN_ANSWER="\${REPI_KNOWN_ANSWER:-}" REPI_CANDIDATE="\${REPI_CANDIDATE:-}" python3 /tmp/repi-crypto-solver.py ${targetArg} || printf '%s\n' 'rerun crypto-stego-solver-known-answer-scaffold and set REPI_KNOWN_ANSWER/REPI_CANDIDATE'`,
			evidence: "verify solver result through known-answer or candidate hash",
		});
		followups.push({
			label: "crypto-solver-script-scaffold",
			command: `cat > /tmp/repi-solve.py <<'PY'\n#!/usr/bin/env python3\n# REPI crypto solver skeleton: fill parameters from [crypto-param] and verify with known-answer.\nimport hashlib, os\nKNOWN=os.getenv('REPI_KNOWN_ANSWER','')\nCANDIDATE=os.getenv('REPI_CANDIDATE','')\nprint('[crypto-solver-script]', 'known_set=' + str(bool(KNOWN)), 'candidate_sha256=' + hashlib.sha256(CANDIDATE.encode()).hexdigest() if CANDIDATE else 'candidate_sha256=none')\nif KNOWN and CANDIDATE:\n    assert CANDIDATE == KNOWN or hashlib.sha256(CANDIDATE.encode()).hexdigest() == KNOWN\n    print('[crypto-known-answer]', 'verification=pass')\nelse:\n    print('[crypto-known-answer]', 'mode=scaffold set REPI_KNOWN_ANSWER and REPI_CANDIDATE')\nPY\nchmod +x /tmp/repi-solve.py\nsed -n '1,220p' /tmp/repi-solve.py`,
			evidence: "materialize solve.py with explicit known-answer assertion",
		});
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: "crypto stego reverse",
		target: targetArg,
		includeGates: true,
	}).slice(0, 3);
	for (const command of reverseNext) {
		followups.push({
			label: "reverse-runtime-capture-next",
			command,
			evidence: "reverse domain capture next",
		} as any);
	}
	return {
		findings,
		followups,
		nextLane:
			knownAnswerLines.length > 0
				? "report"
				: solverLines.length > 0 || transformLines.length > 0
					? "verify"
					: paramLines.length > 0 || stegoLines.length > 0
						? "solver"
						: undefined,
	};
}
