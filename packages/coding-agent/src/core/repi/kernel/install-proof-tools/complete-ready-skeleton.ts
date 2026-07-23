/** Final HARNESS/PROOF skeleton when reverse completion is already ready. */
export function buildCompleteReadySkeleton(options?: { thrash?: boolean }): string {
	const thrash = options?.thrash === true;
	return [
		"completion_stop: ready",
		"final_report_skeleton (copy TWO PLAIN lines exactly; no markdown; never merge labels):",
		"HARNESS_BUGS: none",
		"PROOF: reverse.proof_exit=partial_runtime_capture|runtime_capture_strong; reverse.bind_ready=true",
		"forbidden: do not put HARNESS_BUGS and PROOF on the same line",
		thrash
			? "note: already ready — paste the two lines verbatim; HARNESS_BUGS is tool failures only (not missing target)"
			: "note: paste the two lines verbatim; HARNESS_BUGS only if error=true tool failure; missing target stays PROOF/none",
	].join("\n");
}
