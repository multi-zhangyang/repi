/** Cold-start reverse proof gate lines. */
export function reverseColdStartNextLines(): string[] {
	return [
		"- re_domain_proof_exit show before completion claims; require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true; re_runtime_adapter run for reverse-heavy targets",
		"- REQUIRED after live proof path: re_operator plan <target> then re_operator dispatch <target> maxSteps=2 (do not skip to final text)",
		"- REQUIRED after operator: re_complete audit once; then write HARNESS_BUGS/PROOF only (optional pending checks are not bugs)",
		"- After re_domain_proof_exit returns, immediately call re_operator plan then dispatch then re_complete — no multi-paragraph delay",
		"- re_complete audit must stay blocked until runtime capture is partial|strong",
	];
}
