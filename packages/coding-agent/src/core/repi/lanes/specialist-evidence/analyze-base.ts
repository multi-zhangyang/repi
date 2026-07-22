/** Base lane-run analysis: error/address/compare findings + native followups. */

import { shellQuote } from "../../target.ts";
import { interestingLines, truncateMiddle, uniqueMatches } from "../../text.ts";
import type { LaneCommandPack } from "../self-heal.ts";
import type { LaneCommand } from "../specialist-packs.ts";
import { applyAnalyzeBaseDomainFollowups } from "./analyze-base-domains.ts";

export function analyzeLaneRunBase(
	pack: LaneCommandPack,
	result: { code: number; stdout: string; stderr: string; killed?: boolean },
): {
	pack: LaneCommandPack;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	combined: string;
	targetArg: string;
	lowerRoute: string;
	lowerLane: string;
	findings: string[];
	followups: LaneCommand[];
} {
	const combined = `${result.stdout}\n${result.stderr}`;
	const lowerRoute = pack.route.toLowerCase();
	const lowerLane = pack.lane.toLowerCase();
	const targetArg = pack.target ? shellQuote(pack.target) : "<TARGET>";
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const addFinding = (finding: string) => {
		if (!findings.includes(finding)) findings.push(finding);
	};
	const addFollowup = (label: string, command: string, evidence: string) =>
		followups.push({ label, command, evidence });

	if (result.code !== 0) addFinding(`command-pack exited nonzero: ${result.code}`);
	if (result.killed) addFinding("command-pack was killed or timed out");
	if (
		/command not found|not found|no such file|cannot access|permission denied|trace\/breakpoint trap/i.test(combined)
	) {
		addFinding("tool/target/runtime error surfaced; inspect stderr and run re_bootstrap or adjust target path");
	}

	const addresses = uniqueMatches(combined, /\b0x[0-9a-f]{4,16}\b/gi, 16);
	if (addresses.length > 0) addFinding(`address anchors: ${addresses.join(", ")}`);

	const compareSymbols = uniqueMatches(
		combined,
		/\b(strcmp|strncmp|memcmp|strstr|strcasecmp|strncasecmp|crypto|decrypt|verify|check|license|serial|valid|invalid)\b/gi,
		20,
	);
	if (compareSymbols.length > 0) addFinding(`comparison/verification anchors: ${compareSymbols.join(", ")}`);

	const signalLines = interestingLines(
		combined,
		/license|serial|key|valid|invalid|strcmp|strncmp|memcmp|strstr|verify|check|flag|fail|success|denied|authorized/i,
		12,
	);
	if (signalLines.length > 0)
		addFinding(`interesting output lines: ${signalLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`);

	applyAnalyzeBaseDomainFollowups({
		combined,
		lowerRoute,
		packTarget: pack.target,
		targetArg,
		addresses,
		addFinding,
		addFollowup,
	});

	return { pack, result, combined, targetArg, lowerRoute, lowerLane, findings, followups };
}
