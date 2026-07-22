/** Reverse-heavy memory candidate seeds (domain capture next). */
import type { MissionLane, MissionState } from "../mission.ts";
import type { MemoryCommandCandidate } from "../playbooks.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function seedReverseProofCandidates(
	mission: MissionState,
	lane: MissionLane,
	candidates: MemoryCommandCandidate[],
): MemoryCommandCandidate[] {
	const reverseHeavy =
		/reverse|native|malware|firmware|pwn|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
			`${mission.route.domain} ${lane.name} ${mission.task}`,
		);
	if (!reverseHeavy) return candidates;
	const domainNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${mission.route.domain} ${lane.name} ${mission.task}`,
		target: mission.task,
	}).slice(0, 4);
	const hasDomainSeed = candidates.some((c: any) =>
		/proof_exit|domain_proof_exit|re_complete audit|re_native_runtime run|re_mobile_runtime run|re_js_signing run/i.test(
			c.command,
		),
	);
	if (hasDomainSeed) return candidates;
	const seeds: MemoryCommandCandidate[] = [
		{
			label: "reverse-proof:domain_proof_exit",
			command: "re_domain_proof_exit show",
			evidence: "reverse route/task requires domain proof-exit closure before claim promotion",
			source: "reverse-proof-gate",
			score: 95,
		},
		{
			label: "reverse-proof:complete_audit",
			command: "re_complete audit",
			evidence: "reverse technique claims need completion audit with reverse_proof_exit_missing gate",
			source: "reverse-proof-gate",
			score: 94,
		},
		...domainNext.map((command: any, index: any) => ({
			label: `reverse-proof:domain_capture_${index + 1}`,
			command,
			evidence: "shared reverse domain capture next for reverse-heavy memory candidates",
			source: "reverse-domain-capture",
			score: 93 - index,
		})),
	];
	return [...seeds, ...candidates];
}
