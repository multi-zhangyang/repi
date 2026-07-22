/** Pwn specialist evidence: findings extraction. */
import type { LaneCommandPack } from "../../../lane-commands/types.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import { pythonString } from "../helpers.ts";
import { extractPwnEvidenceBuckets } from "./pwn-findings-buckets.ts";
// Landmark: pwn advanced primitive anchors / pwn ROP/libc chain anchors (body in pwn-findings-buckets.ts)

export type PwnEvidenceMeta = {
	enabled: boolean;
	findings: string[];
	targetArg: string;
	targetPython: string;
	crashLines: string[];
	crashRegisterValues: string[];
	resolvedOffsets: number[];
	offsetLines: string[];
	ropLibcLines: string[];
	verifierLines: string[];
	seccompSandboxLines: string[];
	hasAdvancedPwnAnchors: boolean;
	combined: string;
	pack: LaneCommandPack;
};

export function extractPwnPrimitiveFindings(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): PwnEvidenceMeta {
	const enabled =
		/pwn|exploit/.test(pack.route.toLowerCase()) || packHasSpecialistSignal(pack, /pwn-primitive|pwn primitive/i);
	const targetPython = pythonString(pack.target ?? "<TARGET>");
	if (!enabled) {
		return {
			enabled: false,
			findings: [],
			targetArg,
			targetPython,
			crashLines: [],
			crashRegisterValues: [],
			resolvedOffsets: [],
			offsetLines: [],
			ropLibcLines: [],
			verifierLines: [],
			seccompSandboxLines: [],
			hasAdvancedPwnAnchors: false,
			combined,
			pack,
		};
	}
	const buckets = extractPwnEvidenceBuckets(combined);
	return {
		enabled: true,
		findings: buckets.findings,
		targetArg,
		targetPython,
		crashLines: buckets.crashLines,
		crashRegisterValues: buckets.crashRegisterValues,
		resolvedOffsets: buckets.resolvedOffsets,
		offsetLines: buckets.offsetLines,
		ropLibcLines: buckets.ropLibcLines,
		verifierLines: buckets.verifierLines,
		seccompSandboxLines: buckets.seccompSandboxLines,
		hasAdvancedPwnAnchors: buckets.advancedLines.length > 0,
		combined,
		pack,
	};
}
