/** Decision-core output + run with reverse domain next. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { buildDecisionCore } from "./build-core.ts";
import {
	formatDecisionCore,
	latestDecisionCoreArtifactPath,
	readText,
	writeDecisionCoreArtifact,
} from "./build-format.ts";
import { executeOperatorStep } from "./deps.ts";
import { decisionOperatorSteps } from "./rules.ts";

export function buildDecisionCoreOutput(
	action: "plan" | "show" | "tick" = "plan",
	options: { target?: string } = {},
): string {
	if (action === "show") {
		const path = latestDecisionCoreArtifactPath();
		if (!path) {
			const reverseNext = reverseDomainCaptureNextCommands({
				routeOrBlob: "decision missing reverse",
				target: options.target,
			}).slice(0, 3);
			return [
				"decision_core:",
				"status: missing",
				"next: re_decision_core plan <target>",
				"reverse_domain_next:",
				...reverseNext.map((cmd: any) => `- next: ${cmd}`),
			].join("\n");
		}
		return readText(path).slice(0, 20000);
	}
	const decision = buildDecisionCore({ target: options.target, mode: action === "tick" ? "tick" : "plan" });
	const path = writeDecisionCoreArtifact(decision);
	const base = formatDecisionCore(decision, path);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${decision.route ?? ""} ${decision.target ?? ""} decision ${action}`,
		target: decision.target,
	}).slice(0, 3);
	return [base, "", "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)].join("\n");
}

export async function runDecisionCore(pi: any, options: { target?: string; maxSteps?: number } = {}): Promise<string> {
	const decision = buildDecisionCore({ target: options.target, mode: "run" });
	const maxSteps = Math.max(1, Math.min(10, Math.floor(options.maxSteps ?? 1)));
	const steps = decisionOperatorSteps(decision);
	for (const step of steps.filter((item: any) => item.status === "ready").slice(0, maxSteps)) {
		const result = await executeOperatorStep(pi, step, decision.target);
		decision.executed.push(result);
		if (result?.status === "blocked") decision.blocked.push(`${step.id}: ${result.output}`);
	}
	for (const step of steps.filter((item: any) => item.status === "blocked")) {
		decision.blocked.push(`${step.id}: ${step.reason ?? step.command}`);
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${decision.route ?? ""} ${decision.target ?? ""} decision-run`,
		target: decision.target,
	}).slice(0, 4);
	decision.nextActions = Array.from(
		new Set([
			...reverseNext,
			...steps
				.filter((step: any) => step.status === "ready")
				.slice(decision.executed.length, decision.executed.length + 8)
				.map((step: any) => `re_decision_core run ${decision.target ?? "<target>"} 1 # ${step.id}`),
			"re_verifier matrix",
			"re_complete audit",
		]),
	).slice(0, 16);
	const path = writeDecisionCoreArtifact(decision);
	const base = formatDecisionCore(decision, path);
	return [base, "", "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)].join("\n");
}
