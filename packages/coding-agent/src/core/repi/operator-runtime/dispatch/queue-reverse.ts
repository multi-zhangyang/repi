/** Operator dispatch reverse next actions. */
import { readCurrentMission } from "../../mission.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

function reverseGateReady(): boolean {
	try {
		const mission = readCurrentMission();
		// Stop reverse_next thrash once reverse proof binds — do not wait for full optional
		// orchestration audit.ready (soft-fill pending must not re-queue adapters).
		return Boolean(
			mission?.checkpoints?.some(
				(c: { name?: string; status?: string }) =>
					(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven") && c.status === "done",
			),
		);
	} catch {
		return false;
	}
}

export function operatorDispatchReverseNextActions(params: {
	target?: string;
	operatorFeedbackQueue: string[];
	retryCommands: string[];
	autonomousNext?: string[];
	baseNext: string[];
}): string[] {
	if (reverseGateReady()) {
		return Array.from(
			new Set(["reverse_status=ready", "re_complete audit", "write HARNESS_BUGS/PROOF only", ...params.baseNext]),
		).slice(0, 8);
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `operator_dispatch ${params.target ?? ""} ${params.operatorFeedbackQueue.join(" ")}`,
		target: params.target,
		includeGates: true,
	}).slice(0, 3);
	return Array.from(
		new Set([
			...reverseNext,
			"re_domain_proof_exit show",
			"re_complete audit",
			"re_runtime_adapter run",
			"reverse capture gate: require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true",
			...params.operatorFeedbackQueue,
			...params.retryCommands,
			...(params.autonomousNext ?? []),
			...params.baseNext,
		]),
	).slice(0, 16);
}
