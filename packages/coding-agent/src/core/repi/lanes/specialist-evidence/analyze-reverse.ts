/** Reverse-domain next followups + evidence quality critic for lane analysis. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { LaneCommandPack } from "../self-heal.ts";
import type { LaneCommand } from "../specialist-packs.ts";
import { evaluateEvidenceQuality } from "./quality.ts";
import type { LaneRunAnalysis } from "./types.ts";

export function finalizeLaneRunAnalysis(params: {
	pack: LaneCommandPack;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	findings: string[];
	followups: LaneCommand[];
	nextLane?: string;
}): LaneRunAnalysis {
	const { pack, result, findings, followups } = params;
	const nextLane = params.nextLane;
	const addFollowup = (label: string, command: string, evidence: string) =>
		followups.push({ label, command, evidence });
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|frida|gdb|r2/i.test(
			`${pack.route} ${pack.lane} ${findings.join(" ")} ${followups.map((c: any) => c.command).join(" ")}`,
		);
	if (reverseHeavy) {
		for (const cmd of reverseDomainCaptureNextCommands({
			routeOrBlob: `${pack.route} ${pack.lane} ${findings.join("\n")}`,
			target: pack.target,
		})) {
			addFollowup(`reverse-domain-next:${cmd.split(/\s+/)[0] ?? "run"}`, cmd, "shared reverse domain capture next");
		}
	}
	const critic = evaluateEvidenceQuality({ pack, result, findings, followups, nextLane });
	return { findings, followups, critic, nextLane };
}
