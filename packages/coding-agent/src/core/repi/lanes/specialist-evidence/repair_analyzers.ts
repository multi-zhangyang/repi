/**
 * Specialist evidence analyzers: repair.
 */
import type { LaneCommandPack } from "../../lane-commands/types.ts";
import { interestingLines, truncateMiddle } from "../../text.ts";
import { toolRepairMatrixScript, transcriptRepairItems } from "../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "./types.ts";

export function analyzeToolRepairEvidence(pack: LaneCommandPack, combined: string): SpecialistEvidenceAnalysis {
	const errorLines = interestingLines(
		combined,
		/command not found|not recognized|No such file|cannot stat|cannot access|ModuleNotFoundError|ImportError|Cannot find module|ERR_MODULE_NOT_FOUND|permission denied|EACCES|ENOENT|ENOTFOUND|ECONNREFUSED|CERTIFICATE_VERIFY_FAILED|SSL|timeout|trace\/breakpoint trap/i,
		18,
	);
	if (errorLines.length === 0) return { findings: [], followups: [] };
	const repairItems = transcriptRepairItems(combined);
	const findings = [`tool repair anchors: ${errorLines.map((line: any) => truncateMiddle(line, 220)).join(" | ")}`];
	if (repairItems.length > 0) findings.push(`tool repair missing dependency anchors: ${repairItems.join(", ")}`);
	const matrixCommand = toolRepairMatrixScript({ pack, combined, repairItems, errorLines });
	return {
		findings,
		followups: [
			{
				label: "tool-repair-matrix-scaffold",
				command: matrixCommand,
				evidence:
					"build a runtime repair matrix from command errors, missing dependencies, available alternatives, and bootstrap hints",
			},
			{
				label: "tool-repair-rerun",
				command: `[ -f /tmp/repi-tool-repair.py ] && python3 /tmp/repi-tool-repair.py || printf '%s\n' 'rerun tool-repair-matrix-scaffold after a failed lane run'`,
				evidence: "rerun tool/dependency repair matrix after refreshing tool-index or installing alternatives",
			},
		],
	};
}
