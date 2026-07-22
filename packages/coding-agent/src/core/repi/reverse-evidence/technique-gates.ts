/** Reverse technique proof checklist + missing blockers. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { techniqueById, techniqueIdsForRoute } from "../techniques.ts";

export function reverseTechniqueProofChecklist(routeDomain?: string): {
	techniqueIds: string[];
	proofExits: string[];
	requiredCommands: string[];
} {
	const requiredCommands = reverseDomainCaptureNextCommands({
		routeOrBlob: routeDomain ?? "native reverse binary",
		includeGates: false,
	});
	if (!routeDomain) {
		return {
			techniqueIds: [],
			proofExits: ["partial_runtime_capture", "runtime_capture_strong"],
			requiredCommands: reverseDomainCaptureNextCommands({
				routeOrBlob: "native reverse binary",
				includeGates: false,
			}),
		};
	}
	const techniqueIds = techniqueIdsForRoute({ domain: routeDomain } as any).slice(0, 32);
	const proofExits = Array.from(
		new Set([
			...techniqueIds
				.map((id: any) => techniqueById(id)?.proofExit)
				.filter((x): x is string => Boolean(x))
				.slice(0, 32),
			"partial_runtime_capture",
			"runtime_capture_strong",
		]),
	);
	if (techniqueIds[0]) requiredCommands.push(`re_techniques id=${techniqueIds[0]}`);
	else requiredCommands.push(`re_techniques domain=${routeDomain}`);
	return {
		techniqueIds,
		proofExits,
		requiredCommands: Array.from(new Set(requiredCommands)),
	};
}

export function reverseProofExitMissingBlockers(args: {
	techniqueIds?: string[];
	hasProofExit: boolean;
	routeDomain?: string;
}): string[] {
	const blockers: string[] = [];
	const ids = args.techniqueIds ?? [];
	if (ids.length > 0 && !args.hasProofExit) {
		blockers.push(
			`reverse_proof_exit_missing: techniques=${ids.slice(0, 8).join(",")} require proof_exit before claim promotion`,
		);
		blockers.push(
			"reverse_proof_exit_missing: run re_domain_proof_exit show | re_runtime_adapter run && re_complete audit",
		);
	}
	if (args.routeDomain && /reverse|native|malware|firmware|pwn|binary/i.test(args.routeDomain) && !args.hasProofExit) {
		if (!blockers.length) {
			blockers.push(`reverse_proof_exit_missing: route=${args.routeDomain} has no proof_exit evidence`);
		}
		const checklist = reverseTechniqueProofChecklist(args.routeDomain);
		if (checklist.techniqueIds.length) {
			blockers.push(
				`reverse_technique_proof_checklist: techniques=${checklist.techniqueIds.slice(0, 8).join(",")} proofExits=${checklist.proofExits.slice(0, 8).join(" | ") || "none"}`,
			);
		}
		for (const cmd of reverseDomainCaptureNextCommands({
			routeOrBlob: args.routeDomain ?? checklist.techniqueIds.join(" "),
			includeGates: false,
		}).slice(0, 4)) {
			blockers.push(`reverse_proof_exit_missing: next=${cmd}`);
		}
	}
	return blockers;
}
