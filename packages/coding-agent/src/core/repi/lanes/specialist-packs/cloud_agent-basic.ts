/** Agent security pack: bridge + prompt/tool surface. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsAgentSecurityBasic(ctx: SpecialistPackContext): void {
	ctx.specialists.push("agent prompt/tool boundary");
	ctx.add(
		"agent-security-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_runtime_adapter run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[agent-security-repi-bridge] target_missing\n'",
		"bridge agent boundary review to runtime capture gates before claim",
	);
	ctx.add(
		"agent-prompt-surface-map",
		"printf '[agent-prompt] cwd=%s\\n' \"$PWD\"; find . -maxdepth 5 -type f \\( -iname '*prompt*' -o -iname '*system*' -o -iname '*developer*' -o -iname '*instruction*' -o -iname '*tool*' -o -iname '*mcp*' -o -iname '*agent*' -o -iname '*memory*' -o -iname '*.md' -o -iname '*.json' -o -iname '*.ts' -o -iname '*.js' -o -iname '*.py' \\) -print 2>/dev/null | head -260 | sed 's/^/[agent-prompt] file=/'; rg -n \"systemPrompt|developer|instructions|prompt injection|ignore previous|tool_call|registerTool|MCP|memory|RAG|retrieval|untrusted|sanitize|schema|approval|allowlist|denylist\" . 2>/dev/null | head -320 | sed 's/^/[agent-prompt-risk] /'",
		"agent prompt/resource/tool/memory surface map with injection keywords",
	);
	ctx.add(
		"agent-tool-boundary-scaffold",
		`cat > /tmp/repi-agent-tool-boundary.py <<'AGPY'
#!/usr/bin/env python3
import pathlib, re
root = pathlib.Path(${ctx.targetPython})
if not root.exists() or root.is_file():
    root = pathlib.Path('.')
patterns = [
    ('tool-reg', re.compile(r'registerTool|tool_call|function_call|tools\\s*[:=]|commands\\.set|registerCommand', re.I)),
    ('exec', re.compile(r'\\bexec\\(|spawn\\(|execFile\\(|subprocess\\.|child_process|shell=True|bash -c|eval\\(', re.I)),
    ('schema', re.compile(r'zod|typebox|json\\s*schema|input_schema|parameters|allowlist|denylist|sanitize|validate', re.I)),
    ('mcp', re.compile(r'MCP|Model Context Protocol|resources/list|tools/call|server\\.tools', re.I)),
]
count = 0
for path in root.rglob('*'):
    if not path.is_file() or path.stat().st_size > 1_500_000:
        continue
    if any(part in {'.git','node_modules','dist','build','coverage'} for part in path.parts):
        continue
    try:
        text = path.read_text('utf-8', 'ignore')
    except Exception:
        continue
    hits = []
    for name, rx in patterns:
        if rx.search(text):
            hits.append(name)
    if hits:
        print('[agent-tool]', 'file=' + str(path), 'hits=' + ','.join(hits))
        count += 1
        if 'exec' in hits and 'schema' not in hits:
            print('[agent-tool-risk]', 'file=' + str(path), 'reason=exec_without_visible_schema_guard')
        if 'tool-reg' in hits and 'schema' not in hits:
            print('[agent-tool-risk]', 'file=' + str(path), 'reason=tool_without_visible_schema_guard')
        if count >= 160:
            break
print('[agent-tool-summary]', 'files=' + str(count))
AGPY
chmod +x /tmp/repi-agent-tool-boundary.py
python3 /tmp/repi-agent-tool-boundary.py ${ctx.targetArg}`,
		"tool registration, shell/API execution, schema, MCP, and output-trust boundary scanner",
	);
}
