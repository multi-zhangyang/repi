/** Agent-security reverse capture + rerun followups. */
import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";

type LaneCommand = { label: string; command: string; evidence: string };

export function agentSecurityRerunFollowups(targetArg: string): LaneCommand[] {
	return [
		{
			label: "agent-prompt-surface-rerun",
			command:
				'rg -n "systemPrompt|developer|instructions|prompt injection|ignore previous|tool_call|registerTool|MCP|memory|RAG|retrieval|untrusted|sanitize|schema|approval|allowlist|denylist" . 2>/dev/null | head -360',
			evidence: "rerun agent prompt/resource/tool/memory surface keyword map",
		},
		{
			label: "agent-tool-boundary-rerun",
			command: `[ -f /tmp/repi-agent-tool-boundary.py ] && python3 /tmp/repi-agent-tool-boundary.py ${targetArg} || rg -n "registerTool|tool_call|function_call|exec\\(|spawn\\(|subprocess|schema|validate|allowlist|denylist" . 2>/dev/null | head -320`,
			evidence: "rerun tool-call boundary scanner and schema/exec audit",
		},
		{
			label: "agent-memory-poisoning-rerun",
			command: `[ -f /tmp/repi-agent-memory-poison.py ] && python3 /tmp/repi-agent-memory-poison.py ${targetArg} || find . -maxdepth 5 -type f \\( -iname '*memory*' -o -iname '*journal*' -o -iname '*playbook*' -o -iname '*rag*' -o -iname '*.md' \\) -print | head -160`,
			evidence: "rerun memory/RAG/playbook poisoning scanner",
		},
		{
			label: "agent-injection-replay-rerun",
			command:
				"[ -f /tmp/repi-agent-injection-replay.py ] && python3 /tmp/repi-agent-injection-replay.py || printf '%s\\n' 'rerun agent-injection-replay-harness to regenerate corpus'",
			evidence: "rerun bounded injection replay harness and payload corpus",
		},
		{
			label: "agent-delegation-trace-rerun",
			command: `[ -f /tmp/repi-agent-delegation.py ] && python3 /tmp/repi-agent-delegation.py ${targetArg} || rg -n "sub[-_ ]?agent|delegate|handoff|mcp|resources/list|tools/call|capability|approval|permission" . 2>/dev/null | head -260`,
			evidence: "rerun MCP/resource/sub-agent delegation trace scanner",
		},
		{
			label: "agent-security-report-scaffold",
			command:
				"python3 - <<'AGPY'\nprint('[agent-security-report] inputs=prompt-surface,tool-boundary,memory-poisoning,injection-replay,delegation-trace anchors')\nprint('Next: normalize boundary nodes, tainted channels, tool schemas, replay outcomes, and evidence into attack graph.')\nAGPY",
			evidence: "consolidated agent prompt/tool/memory/delegation boundary report scaffold",
		},
	];
}

export function agentSecurityReverseFollowups(params: {
	combined: string;
	targetArg: string;
	findings: string[];
	followups: LaneCommand[];
}): void {
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(params.combined) ||
		!/bind_ready\s*=\s*true/i.test(params.combined);
	if (!reverseCaptureOpen) return;
	params.findings.push(
		`[agent-security-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
	);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `agent_security ${params.targetArg}`,
		target: params.targetArg,
		includeGates: true,
	}).slice(0, 2);
	params.followups.push(
		{
			label: `agent-security-domain-proof-exit`,
			command: `re_domain_proof_exit show`,
			evidence: "reverse runtime capture gate",
		},
		{
			label: `agent-security-complete-audit`,
			command: `re_complete audit`,
			evidence: "reverse completion audit",
		},
		{
			label: `agent-security-runtime-adapter`,
			command: `re_runtime_adapter run ${params.targetArg}`,
			evidence: "runtime adapter capture",
		},
		...reverseNext.map((cmd: any, index: any) => ({
			label: `agent-security-reverse-domain-next-${index + 1}`,
			command: cmd,
			evidence: "reverse domain capture next",
		})),
	);
}
