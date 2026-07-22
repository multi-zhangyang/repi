import { packHasSpecialistSignal } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendAgentHeals(ctx: SelfHealCtx): void {
	const {
		pack,
		result: _result,
		findings: _findings,
		deficits: _deficits,
		route,
		combined: _combined,
		target: _target,
		add,
		toolNames: _toolNames,
	} = ctx;
	if (
		/agent|llm/.test(route) ||
		packHasSpecialistSignal(pack, /agent-(prompt|tool|memory|injection|delegation)|agent prompt\/tool boundary/i)
	) {
		add(
			"heal-agent-prompt-surface-map",
			'rg -n "systemPrompt|developer|instructions|prompt injection|ignore previous|tool_call|registerTool|MCP|memory|RAG|retrieval|untrusted|sanitize|schema|approval|allowlist|denylist" . 2>/dev/null | head -360',
			"specialist agent prompt/resource surface fallback",
		);
		add(
			"heal-agent-tool-boundary",
			'[ -f /tmp/repi-agent-tool-boundary.py ] && python3 /tmp/repi-agent-tool-boundary.py || rg -n "registerTool|tool_call|function_call|exec\\(|spawn\\(|subprocess|schema|validate|allowlist|denylist" . 2>/dev/null | head -320',
			"specialist agent tool-call boundary fallback",
		);
		add(
			"heal-agent-memory-poisoning",
			"[ -f /tmp/repi-agent-memory-poison.py ] && python3 /tmp/repi-agent-memory-poison.py || find . -maxdepth 5 -type f \\( -iname '*memory*' -o -iname '*journal*' -o -iname '*playbook*' -o -iname '*rag*' -o -iname '*.md' \\) -print | head -160",
			"specialist agent memory/RAG poisoning fallback",
		);
		add(
			"heal-agent-injection-replay",
			"[ -f /tmp/repi-agent-injection-replay.py ] && python3 /tmp/repi-agent-injection-replay.py || printf '%s\\n' 'rerun agent-injection-replay-harness to regenerate corpus'",
			"specialist agent injection replay fallback",
		);
	}
}
