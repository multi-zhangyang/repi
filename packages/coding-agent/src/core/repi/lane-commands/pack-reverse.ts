/** Reverse domain gates for lane command packs. */

import type { MissionLane, MissionState } from "../mission.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { LaneCommand } from "./types.ts";

/** Inject reverse domain proof-exit / complete-audit gates into lane command packs. */
export function applyReverseDomainLaneCommands(
	commands: LaneCommand[],
	mission: MissionState,
	lane: MissionLane,
): void {
	const reverseDomain = /pwn|native|malware|firmware|mobile|exploit|crypto|reverse/i.test(
		`${mission?.route?.domain ?? ""} ${lane?.name ?? ""} ${lane?.objective ?? ""}`,
	);
	if (!reverseDomain) return;
	const has = (label: string) => commands.some((c: any) => c.label === label || c.command?.includes?.(label));
	if (!has("re_domain_proof_exit show")) {
		commands.push({
			label: "reverse-domain-proof-exit",
			command: "re_domain_proof_exit show",
			evidence: "runtime proof_exit / bind_ready gate before claim",
		});
	}
	if (!has("re_complete audit")) {
		commands.push({
			label: "reverse-complete-audit",
			command: "re_complete audit",
			evidence: "completion requires partial/strong runtime capture",
		});
	}
	// domain-aware capture next (run-first)
	const domainNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${mission?.route?.domain ?? ""} ${lane?.name ?? ""} ${lane?.objective ?? ""}`,
		target: (mission as any)?.target ?? (lane as any)?.target,
	}).slice(0, 3);
	for (const [index, cmd] of domainNext.entries()) {
		const label = `reverse-domain-next-${index + 1}`;
		if (!has(label) && !has(cmd)) {
			commands.push({
				label,
				command: cmd,
				evidence: "reverse domain capture next (run-first)",
			});
		}
	}
}
