/** Final HARNESS/PROOF skeleton when reverse completion is already ready. */
export function buildCompleteReadySkeleton(options?: { thrash?: boolean }): string {
	const thrash = options?.thrash === true;
	return [
		"completion_stop: ready",
		"final_report_skeleton:",
		"HARNESS_BUGS: none",
		"PROOF: reverse.proof_exit=partial_runtime_capture|runtime_capture_strong; reverse.bind_ready=true",
		thrash
			? "note: already ready — copy skeleton; do not thrash re_complete/re_operator"
			: "note: copy skeleton above as final answer unless a real tool failure (error true) exists; do not thrash re_*",
	].join("\n");
}
