/** Swarm worker reverse proof gate scoring. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { swarmReverseQuerySignals, swarmWorkerEvidenceText } from "./pure.ts";

export type SwarmReviewScoreState = {
	score: number;
	rationale: string[];
	evidenceGaps: string[];
	repairActions: string[];
	reverseSignals: string[];
	reverseProofBlocked: boolean;
	reverseProofReady: boolean;
};

export function computeSwarmWorkerReverseSignals(
	worker: any,
	swarm: any,
): {
	reverseSignals: string[];
	reverseProofBlocked: boolean;
	reverseProofReady: boolean;
} {
	const reverseSignals = swarmReverseQuerySignals(
		[
			typeof swarmWorkerEvidenceText === "function" ? swarmWorkerEvidenceText(swarm as any, worker as any) : "",
			JSON.stringify((worker as any)?.evidenceContract ?? []),
			String((worker as any)?.status ?? ""),
			String((worker as any)?.summary ?? ""),
			String((worker as any)?.output ?? ""),
		].join("\n"),
	);
	const reverseProofBlocked = reverseSignals.some((s: any) =>
		/reverse\.bind_ready=false|proof_exit=pending_runtime_capture|proof_gate=require_proof_exit/i.test(s),
	);
	const reverseProofReady = reverseSignals.some((s: any) =>
		/reverse\.bind_ready=true|proof_exit=partial_runtime_capture|proof_exit=runtime_capture_strong/i.test(s),
	);
	return { reverseSignals, reverseProofBlocked, reverseProofReady };
}

export function applySwarmWorkerReverseReview(state: SwarmReviewScoreState, swarm: any): SwarmReviewScoreState {
	const { reverseSignals, reverseProofBlocked, reverseProofReady } = state;
	let { score } = state;
	const rationale = [...state.rationale];
	const evidenceGaps = [...state.evidenceGaps];
	const repairActions = [...state.repairActions];
	if (reverseProofBlocked) {
		score -= 20;
		evidenceGaps.push("reverse proof capture missing (bind_ready=false or pending_runtime_capture)");
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${reverseSignals.join("\n")}\n${JSON.stringify({ target: swarm.target, route: swarm.route })}`,
			target: swarm.target,
			includeGates: true,
		}).slice(0, 6);
		repairActions.push(
			...(reverseNext.length ? reverseNext : ["re_domain_proof_exit show", "re_native_runtime run <target>"]),
		);
		repairActions.push("re_complete audit");
		rationale.push(...reverseSignals.slice(0, 4));
	} else if (reverseProofReady) {
		score += 10;
		rationale.push("reverse runtime capture/bind ready");
	}
	return {
		score,
		rationale,
		evidenceGaps,
		repairActions,
		reverseSignals,
		reverseProofBlocked,
		reverseProofReady,
	};
}
