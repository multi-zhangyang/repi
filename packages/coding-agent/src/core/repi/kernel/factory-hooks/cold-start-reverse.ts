/** Cold-start reverse proof gate lines. */
export function reverseColdStartNextLines(): string[] {
	return [
		"- re_domain_proof_exit show before completion claims; require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true; re_runtime_adapter run for reverse-heavy targets",
		"- re_complete audit must stay blocked until runtime capture is partial|strong",
	];
}
