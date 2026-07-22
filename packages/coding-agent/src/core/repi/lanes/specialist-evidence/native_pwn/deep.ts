/** Specialist evidence analyzer: native deep reverse/pwn. */
import type { LaneCommandPack } from "../../../lane-commands/types.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";
import { collectNativeDeepSignals } from "./deep-collect.ts";
import { nativeDeepRerunFollowups, nativeDeepReverseFollowups } from "./deep-reverse.ts";

export function analyzeNativeDeepEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/native|reverse|pwn|binary|mobile/i.test(pack.route) ||
		packHasSpecialistSignal(pack, /native-deep|native deep reverse\/pwn|native-symbol-map/i);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: any[] = [];
	const signals = collectNativeDeepSignals(combined, findings);
	const { symbolLines, decompilerLines, compareLines, patchLines, symbolicLines, fuzzLines } = signals;
	if (
		symbolLines.length > 0 ||
		decompilerLines.length > 0 ||
		compareLines.length > 0 ||
		patchLines.length > 0 ||
		symbolicLines.length > 0 ||
		fuzzLines.length > 0
	) {
		followups.push(...nativeDeepRerunFollowups(targetArg));
	}
	nativeDeepReverseFollowups({ combined, targetArg, findings, followups });
	return {
		findings,
		followups,
		nextLane:
			patchLines.length > 0 || compareLines.length > 0
				? "patch/proof"
				: symbolicLines.length > 0 || fuzzLines.length > 0
					? "runtime-proof/poc"
					: symbolLines.length > 0 || decompilerLines.length > 0
						? "control-flow/runtime"
						: undefined,
	};
}
