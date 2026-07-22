/** Operator dispatch reverse next actions. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

export function operatorDispatchReverseNextActions(params: {
	target?: string;
	operatorFeedbackQueue: string[];
	retryCommands: string[];
	autonomousNext?: string[];
	baseNext: string[];
}): string[] {
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
