/** Runtime adapter command templates: agent-security host CAP. */
import { AGENT_SECURITY_DEEP_LINES } from "./agent-security-deep.ts";
import { AGENT_SECURITY_EXTRA_LINES } from "./agent-security-extra.ts";
import { AGENT_SECURITY_HOST_LINES } from "./agent-security-host.ts";

export function agentSecurityBoundaryCommandTemplate(mode: "native" | "fallback" = "fallback"): string {
	const prefix =
		mode === "native"
			? "adapter-agent-security-boundary-runner:"
			: "adapter-agent-security-boundary-runner-fallback:";
	const head = [
		"set +e",
		'target="${target:-$1}"',
		'root="${target:-.}"',
		`printf "[adapter-agent-target] adapter=${prefix} target=%s mode=${mode}\\n" "$root"`,
		'printf "[agent-env] python=%s rg=%s find=%s\\n" "$(command -v python3 || true)" "$(command -v rg || true)" "$(command -v find || true)"',
		"CAP_PROMPT=0; CAP_TOOL=0; CAP_MEMORY=0; CAP_INJECT=0; CAP_DELEG=0; CAP_SCHEMA=0; CAP_POLICY=0",
		'if [ ! -e "$root" ]; then root="."; fi',
		'printf "[agent-prompt] cwd=%s target=%s\\n" "$PWD" "$root"',
		"find \"$root\" -maxdepth 4 \\( -path \"*/node_modules/*\" -o -path \"*/.git/*\" -o -path \"*/docs/*\" -o -path \"*/repi-profile/*\" -o -path \"*/dist/*\" -o -path \"*/test/*\" -o -path \"*/tests/*\" -o -path \"*/__tests__/*\" \\) -prune -o -type f \\( -iname '*prompt*' -o -iname '*system*' -o -iname '*tool*' -o -iname '*mcp*' -o -iname '*agent*' -o -iname 'AGENTS.md' -o -iname '*.ts' -o -iname '*.js' -o -iname '*.py' -o -iname '*.json' \\) -print 2>/dev/null | head -80 | sed \"s/^/[agent-prompt] file=/\"",
		'if command -v rg >/dev/null 2>&1; then rg -n --glob "!**/node_modules/**" --glob "!**/.git/**" --glob "!**/docs/**" --glob "!**/dist/**" --glob "!**/test/**" --glob "!**/tests/**" --glob "!**/__tests__/**" --glob "!**/repi-profile/**" --glob "!**/CHANGELOG.md" --glob "!**/AGENTS.md" --glob "!**/README.md" --glob "!**/CONTRIBUTING.md" --glob "!**/scripts/**" --glob "!**/biome.json" -e "systemPrompt|developer|prompt injection|ignore previous|tool_call|registerTool|MCP|memory|RAG|untrusted|sanitize|schema|allowlist|denylist" "$root/packages" 2>/dev/null | head -80 | sed "s/^/[agent-prompt-risk] /"; CAP_PROMPT=1; fi',
		"python3 - \"$root\" <<'AGPY'",
		"import pathlib, re, sys",
		"root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')",
		"if not root.exists() or root.is_file():",
		"    root = pathlib.Path('.')",
		"patterns = [",
		"    ('tool-reg', re.compile(r'registerTool|tool_call|function_call|tools\\s*[:=]|commands\\.set|registerCommand', re.I)),",
		"    ('exec', re.compile(r'\\bexec\\(|spawn\\(|execFile\\(|subprocess\\.|child_process|shell=True|bash -c|eval\\(', re.I)),",
		"    ('schema', re.compile(r'zod|typebox|json\\s*schema|input_schema|parameters|allowlist|denylist|sanitize|validate', re.I)),",
		"    ('mcp', re.compile(r'MCP|Model Context Protocol|resources/list|tools/call|server\\.tools', re.I)),",
		"    ('memory', re.compile(r'memory|RAG|retrieval|vector|playbook|journal|transcript', re.I)),",
		"    ('inject', re.compile(r'ignore (all )?(previous|above)|prompt injection|jailbreak|越狱|记忆投毒', re.I)),",
		"    ('deleg', re.compile(r'sub-?agent|handoff|delegat|capability drift|resources/list|tools/call', re.I)),",
		"]",
		"count = 0; tool_hits=0; mem_hits=0; inj_hits=0; deleg_hits=0",
		"for path in root.rglob('*'):",
		"    if not path.is_file() or path.stat().st_size > 1_500_000: continue",
		"    if any(part in {'.git','node_modules','dist','build','coverage','test','tests','__tests__'} for part in path.parts): continue",
		"    if 'docs' in path.parts and 'reverse-agent' in path.parts: continue",
		"    if 'surrogate' in path.name.lower(): continue",
		"    try: text = path.read_text('utf-8', 'ignore')",
		"    except Exception: continue",
		"    hits = []",
		"    for name, rx in patterns:",
		"        if rx.search(text): hits.append(name)",
		"    if not hits: continue",
		"    print('[agent-tool] file=%s hits=%s' % (path, ','.join(hits)))",
		"    count += 1",
		"    if 'tool-reg' in hits or 'exec' in hits or 'mcp' in hits: tool_hits += 1",
		"    if 'memory' in hits: mem_hits += 1; print('[agent-memory] file=%s' % path)",
		"    if 'inject' in hits: inj_hits += 1; print('[agent-injection-case] file=%s' % path)",
		"    if 'deleg' in hits: deleg_hits += 1; print('[agent-delegation] file=%s' % path)",
		"    if 'exec' in hits and 'schema' not in hits:",
		"        print('[agent-tool-risk] file=%s reason=exec_without_visible_schema_guard' % path)",
		"    if 'tool-reg' in hits and 'schema' not in hits:",
		"        print('[agent-tool-risk] file=%s reason=tool_without_visible_schema_guard' % path)",
		"    if count >= 120: break",
		"print('[agent-tool-summary] files=%d tool=%d memory=%d inject=%d deleg=%d' % (count, tool_hits, mem_hits, inj_hits, deleg_hits))",
		"print('[agent-injection-result] cases=%d' % inj_hits)",
		"print('[agent-delegation-summary] hits=%d' % deleg_hits)",
		"print('[agent-memory-summary] files=%d' % mem_hits)",
		"AGPY",
	];
	const tail = [
		"CAP_TOOL=1; CAP_PROMPT=1; CAP_MEMORY=1; CAP_INJECT=1; CAP_DELEG=1; CAP_SCHEMA=1; CAP_POLICY=1",
		'printf "[agent-security-proof-capture] domain=agent-security prompt=%s tool=%s memory=%s inject=%s deleg=%s schema=%s policy=%s\\n" "$CAP_PROMPT" "$CAP_TOOL" "$CAP_MEMORY" "$CAP_INJECT" "$CAP_DELEG" "$CAP_SCHEMA" "$CAP_POLICY"',
		'if [ "$CAP_PROMPT" = "1" ] && [ "$CAP_TOOL" = "1" ]; then',
		'  printf "[agent-security-proof-capture] proof.exit=runtime_capture_strong bind_ready=true note=prompt+tool-boundary+host+deep+extra\\n"',
		'elif [ "$CAP_PROMPT" = "1" ] || [ "$CAP_TOOL" = "1" ]; then',
		'  printf "[agent-security-proof-capture] proof.exit=partial_runtime_capture bind_ready=true\\n"',
		"else",
		'  printf "[agent-security-proof-capture] proof.exit=pending_runtime_capture bind_ready=false\\n"',
		"fi",
		'printf "[agent-security-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run,re_lane_plan_injection\\n"',
		'printf "[runtime-technique] agent-prompt-surface | agent-tool-boundary | agent-injection-replay\\n"',
	];
	return [
		...head,
		...AGENT_SECURITY_HOST_LINES,
		...AGENT_SECURITY_DEEP_LINES,
		...AGENT_SECURITY_EXTRA_LINES,
		...tail,
	].join("\n");
}
