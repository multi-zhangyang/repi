/** Proof-loop case-memory/operator/compact bridges. */

import { repiProofLoopCommandTarget as proofLoopCommandTarget } from "../proof-loop.ts";
import type { CaseMemoryLanePlan } from "../proof-loop-runtime.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { truncateMiddle } from "../text.ts";
import {
	type latestOperatorFeedback,
	latestReconCompactionResumeTelemetry,
	operatorCommandConcrete,
	operatorFeedbackDispatcherCommands,
} from "./deps.ts";

export function caseMemoryProofBridge(plan: CaseMemoryLanePlan | undefined, target?: string): string[] {
	if (!plan || (plan.migrations?.length ?? 0) === 0) return [];
	const suffix = proofLoopCommandTarget(target);
	const base = [
		`case_memory_lane_plan action=${plan.action} reason=${plan.reason}`,
		`autopilot_plan="re_autopilot plan${suffix}"`,
		...(plan.action !== "none" ? [`autopilot_run="re_autopilot run${suffix} 1"`] : []),
		...(plan.targetLane ? [`target_lane="${plan.targetLane}"`] : []),
		...(plan.addedLane ? [`added_lane="${plan.addedLane}"`] : []),
		...(plan.skippedLane ? [`skipped_lane="${plan.skippedLane}"`] : []),
		`context_operator_bridge="re_context pack && re_operator dispatch${suffix} 1"`,
		...(plan.migrations ?? []).slice(0, 4).map((item: any) => `migration=${truncateMiddle(item, 220)}`),
	];
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${plan.targetLane ?? ""} ${plan.addedLane ?? ""} ${plan.reason ?? ""} ${target ?? ""}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${plan.targetLane ?? ""} ${target ?? ""} proof_loop case_memory`,
				target,
				includeGates: true,
			}).slice(0, 2)
		: [];
	return Array.from(new Set([...reverseNext, ...base]));
}

export function operatorFeedbackProofLoopCommands(
	feedback: Pick<ReturnType<typeof latestOperatorFeedback>, "rows" | "commands">,
	target?: string,
): string[] {
	const fallback =
		(feedback.commands?.length ?? 0) ? [] : operatorFeedbackDispatcherCommands(feedback.rows ?? [], target);
	return Array.from(new Set([...(feedback.commands ?? []), ...fallback]).values())
		.map((command: any) => operatorCommandConcrete(command, target).command)
		.filter((command: any) => /^re[-_]/i.test(command))
		.filter((command: any) => !/^re[-_]proof[-_]loop\b/i.test(command))
		.slice(0, 16);
}

export function compactResumeProofQueue(): string[] {
	return (
		latestReconCompactionResumeTelemetry()
			.telemetry?.commandStatus.filter((row: any) => row.status === "queued")
			.map((row: any) => row.command)
			.filter((command: any) => /^re[-_]/i.test(command)) ?? []
	).slice(0, 8);
}
