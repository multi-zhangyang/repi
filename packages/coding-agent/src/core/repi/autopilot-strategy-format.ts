/** Autopilot bootstrap/strategy format helpers. */

import type { AutopilotExecutionStrategy } from "./runtime-types/failure.ts";
import type { BootstrapPlan } from "./tool-index/types.ts";
import { formatBootstrapPlan } from "./tool-index.ts";

export function formatAutopilotBootstrap(plan: BootstrapPlan[]): string {
	const missing = plan.filter((item: any) => !item.present && item.known);
	return [
		"bootstrap_plan:",
		`recommended_tools: ${plan.map((item: any) => item.tool).join(", ") || "none"}`,
		`missing_known: ${missing.map((item: any) => item.tool).join(", ") || "none"}`,
		formatBootstrapPlan(plan),
		missing.length > 0
			? `next_bootstrap_command: re_bootstrap plan ${missing.map((item: any) => item.tool).join(" ")}`
			: "next_bootstrap_command: none",
	].join("\n");
}
export function formatAutopilotExecutionStrategy(strategy: AutopilotExecutionStrategy): string {
	return [
		"execution_strategy:",
		`mode: ${strategy.mode}`,
		`missing_tools: ${strategy.missingTools.join(", ") || "none"}`,
		`fallback_count: ${strategy.fallbacks.length}`,
		`skipped_count: ${strategy.skipped.length}`,
		"notes:",
		...strategy.notes.map((note: any) => `- ${note}`),
		...(strategy.fallbacks.length
			? [
					"fallback_commands:",
					...strategy.fallbacks.flatMap((fallback: any) => [
						`- label: ${fallback.label}`,
						`  missing: ${fallback.missing.join(", ")}`,
						`  command: ${fallback.command}`,
					]),
				]
			: []),
		...(strategy.skipped.length
			? [
					"skipped_commands:",
					...strategy.skipped.flatMap((skipped: any) => [
						`- label: ${skipped.label}`,
						`  missing: ${skipped.missing.join(", ")}`,
						`  command: ${skipped.command}`,
					]),
				]
			: []),
	].join("\n");
}
