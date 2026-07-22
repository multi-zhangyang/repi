/** Agent-security evidence signal collection. */
import { interestingLines, truncateMiddle } from "../../../text.ts";

export function collectAgentSecuritySignals(
	combined: string,
	findings: string[],
): {
	promptLines: string[];
	toolLines: string[];
	memoryLines: string[];
	replayLines: string[];
	delegationLines: string[];
} {
	const promptLines = interestingLines(
		combined,
		/\[agent-prompt\]|\[agent-prompt-risk\]|systemPrompt|developer message|prompt injection|ignore previous|untrusted/i,
		24,
	);
	if (promptLines.length > 0) {
		findings.push(
			`Agent prompt surface anchors: ${promptLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const toolLines = interestingLines(
		combined,
		/\[agent-tool\]|\[agent-tool-risk\]|\[agent-tool-summary\]|registerTool|tool_call|function_call|exec_without_visible_schema|tool_without_visible_schema|MCP|schema/i,
		24,
	);
	if (toolLines.length > 0) {
		findings.push(
			`Agent tool boundary anchors: ${toolLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const memoryLines = interestingLines(
		combined,
		/\[agent-memory\]|\[agent-memory-risk\]|\[agent-memory-summary\]|memory poisoning|记忆投毒|RAG|retrieval|vector|playbook|journal/i,
		24,
	);
	if (memoryLines.length > 0) {
		findings.push(
			`Agent memory poisoning anchors: ${memoryLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const replayLines = interestingLines(
		combined,
		/\[agent-injection-replay\]|\[agent-injection-case\]|\[agent-injection-result\]|tool-json-smuggle|delimiter-breakout|indirect-ignore-previous/i,
		24,
	);
	if (replayLines.length > 0) {
		findings.push(
			`Agent injection replay anchors: ${replayLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const delegationLines = interestingLines(
		combined,
		/\[agent-delegation\]|\[agent-delegation-risk\]|\[agent-delegation-summary\]|sub-agent|handoff|delegat|capability drift|resources\/list|tools\/call/i,
		24,
	);
	if (delegationLines.length > 0) {
		findings.push(
			`Agent delegation trace anchors: ${delegationLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	return { promptLines, toolLines, memoryLines, replayLines, delegationLines };
}
