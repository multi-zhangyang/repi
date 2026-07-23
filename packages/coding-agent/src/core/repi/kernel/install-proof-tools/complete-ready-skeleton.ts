/** Final HARNESS/PROOF skeleton when reverse completion is already ready. */
export function buildCompleteReadySkeleton(options?: { thrash?: boolean }): string {
	const thrash = options?.thrash === true;
	return [
		"completion_stop: ready",
		"final_report_skeleton (copy PLAIN lines exactly; no markdown bold/bullets):",
		"HARNESS_BUGS: none",
		"PROOF: reverse.proof_exit=partial_runtime_capture|runtime_capture_strong; reverse.bind_ready=true",
		thrash
			? "note: already ready — paste the two HARNESS_BUGS/PROOF lines verbatim; HARNESS_BUGS is tool failures only (not missing target)"
			: "note: paste the two HARNESS_BUGS/PROOF lines verbatim; HARNESS_BUGS only if error=true tool failure; missing target stays PROOF/none",
	].join("\n");
}
