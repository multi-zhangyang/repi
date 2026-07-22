/** REPI skill content constant. */
export const RECON_SKILL_CONTENT = `# Reverse Pentest Orchestrator

REPI built-in thin-kernel skill. Domain manuals load on demand via re_route / re_techniques / re_lane — do not dump reference text into context.

## Execution contract

- execution-first: route → map → one live proof path → evidence → proof_exit
- no narrative-only completion: catalog technique.proof_exit is NOT enough
- require runtime proof.exit=partial_runtime_capture|runtime_capture_strong + bind_ready=true before claims
- every turn leaves a concrete next command (re_* or host tool)

## Immediate loop

1. \`re_route\` / domain skill_hint
2. \`re_map <target>\` passive map
3. One live path:
   - native/pwn: \`re_native_runtime run <elf>\`
   - web/API: \`re_live_browser run <url>\` then \`re_web_authz_state run <url>\`
   - JS signing: \`re_js_signing run <url-or-bundle>\`
   - mobile: \`re_mobile_runtime run <package>\`
   - exploit lab: \`re_exploit_lab run <target>\`
4. \`re_domain_proof_exit show\` then \`re_complete audit\`
5. \`re_evidence append\` only for decisive runtime/traffic/artifact facts

## Reverse proof gate

- completion blocked until runtime capture is partial|strong
- swarm/claim merge needs proof.exit + bind_ready + evidence hash
- next when pending: re_runtime_adapter run | re_native_runtime run | re_live_browser run | re_js_signing run | re_web_authz_state run

## Harness

- \`/plan\` read-only recon then \`/plan execute\`
- \`/permission default|plan|acceptEdits|bypass\` (destructive bash blocked except bypass)
- tools activate by route after re_route/mission

## Evidence priority

1. Live runtime / memory
2. Network traffic
3. Served assets
4. Process/config
5. Artifacts
6. Source
7. Names/comments (lowest)

## Self-check (every ~5 tools / 2 failures / before complete)

- progress evidence?
- loop/repeat?
- last error explained?
- next method change if stuck?
`;
