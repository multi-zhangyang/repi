import { metadataValue, numericMetadataValue } from "../text.ts";
import type { RunAutoDecision } from "./types.ts";

export function parseLaneRunDecision(text: string, laneName: string): RunAutoDecision {
	const quality = numericMetadataValue(text, "score");
	const verdict = metadataValue(text, "verdict");
	const strategy = metadataValue(text, "mode");
	const skipped = numericMetadataValue(text, "skipped_count") ?? 0;
	const fallback = numericMetadataValue(text, "fallback_count") ?? 0;
	const hasSelfHeal = /self_heal_commands:/.test(text) || /\[auto:heal-/i.test(text);
	const nextLaneHint = metadataValue(text, "next_lane_hint");
	const advanced = /auto_lane_update: .* -> /.test(text);
	const noRunnable = /没有可直接运行的命令/.test(text);
	const toolBlocked = strategy === "blocked" || noRunnable;
	if (toolBlocked) {
		return {
			action: "stop",
			reason: `tool_strategy_${strategy ?? "blocked"}:${laneName}`,
			quality,
			verdict,
		};
	}
	if ((verdict === "weak" || (quality !== undefined && quality < 45)) && hasSelfHeal) {
		return {
			action: "continue_current",
			reason: `weak_evidence_self_heal:${laneName}`,
			nextLane: laneName,
			quality,
			verdict,
		};
	}
	if (skipped > 0 && fallback === 0) {
		return {
			action: "stop",
			reason: `skipped_without_fallback:${laneName}`,
			quality,
			verdict,
		};
	}
	if (advanced || nextLaneHint) {
		return {
			action: "continue_next",
			reason: `advance:${nextLaneHint ?? "active"}`,
			quality,
			verdict,
		};
	}
	if (verdict === "strong" || (quality !== undefined && quality >= 70)) {
		return { action: "continue_next", reason: `strong_evidence:${laneName}`, quality, verdict };
	}
	if (strategy === "tool-index-missing" && !hasSelfHeal) {
		return {
			action: "stop",
			reason: `tool_strategy_tool-index-missing:${laneName}`,
			quality,
			verdict,
		};
	}
	if ((verdict === "partial" || (quality !== undefined && quality >= 45)) && hasSelfHeal) {
		return {
			action: "continue_current",
			reason: `partial_evidence_self_heal:${laneName}`,
			nextLane: laneName,
			quality,
			verdict,
		};
	}
	return { action: "stop", reason: `no_adaptive_followup:${laneName}`, quality, verdict };
}
export function formatRunAutoDecision(decision: RunAutoDecision): string {
	return [
		"adaptive_decision:",
		`action: ${decision.action}`,
		`reason: ${decision.reason}`,
		decision.nextLane ? `next_lane: ${decision.nextLane}` : undefined,
		decision.quality !== undefined ? `quality: ${decision.quality}` : undefined,
		decision.verdict ? `verdict: ${decision.verdict}` : undefined,
	]
		.filter(Boolean)
		.join("\n");
}
export function shouldEscalateAdaptiveDecision(decisions: RunAutoDecision[]): boolean {
	const last = decisions.at(-1);
	if (!last || last.action !== "continue_current") return false;
	const same = decisions.filter((decision: any) => decision.reason === last.reason);
	if (same.length < 2) return false;
	const previous = same.at(-2);
	if (!previous) return true;
	if (last.quality === undefined || previous.quality === undefined) return true;
	return last.quality <= previous.quality + 5;
}
export function parsePlannerDecision(mergeText: string): RunAutoDecision {
	const actionMatch = mergeText.match(/action:\s*(continue_current|continue_next|stop)/i);
	if (!actionMatch) throw new Error("llm-step-planner: no action in planner output");
	const action = actionMatch[1].toLowerCase() as RunAutoDecision["action"];
	const nextLaneMatch = mergeText.match(/nextLane:\s*([^\n]+)/i);
	const nextLaneRaw = nextLaneMatch ? nextLaneMatch[1].trim() : "";
	const nextLane = nextLaneRaw && nextLaneRaw.toLowerCase() !== "none" ? nextLaneRaw : undefined;
	const verdictMatch = mergeText.match(/verdict:\s*(strong|partial|weak)/i);
	const qualityMatch = mergeText.match(/quality:\s*(\d+)/i);
	const reasonMatch = mergeText.match(/reason:\s*([^\n]+)/i);
	return {
		action,
		reason: reasonMatch ? reasonMatch[1].trim() : `llm-step-planner action=${action}`,
		nextLane,
		verdict: verdictMatch ? (verdictMatch[1].toLowerCase() as "strong" | "partial" | "weak") : undefined,
		quality: qualityMatch ? Number(qualityMatch[1]) : undefined,
	};
}
