/** Proof-loop reverse runtime capture gate lines. */
export function proofLoopReverseGateLines(proof: { nextActions?: string[] }): string[] {
	const reverseOpen =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|technique|proof_exit|bind_ready/i.test(
			JSON.stringify(proof),
		);
	const hasStrong = /proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(JSON.stringify(proof));
	if (!(reverseOpen && !hasStrong)) return [];
	return [
		"reverse_runtime_capture_gate:",
		"- status: pending_runtime_capture",
		"- require proof.exit=partial_runtime_capture|runtime_capture_strong",
		"- require bind_ready=true before claim",
		"- next: re_domain_proof_exit show",
		"- next: re_complete audit",
		"- next: re_runtime_adapter run",
	];
}

export function proofLoopNextActionsLines(proof: {
	nextActions: string[];
	mode: string;
	verdict: string;
	target?: string;
	maxSteps: number;
	replaySteps: number;
}): string[] {
	const reverseOpen =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|technique|proof_exit|bind_ready/i.test(
			JSON.stringify(proof),
		);
	const hasStrong = /proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(JSON.stringify(proof));
	return [
		"next_proof_actions:",
		...(proof.nextActions.length
			? proof.nextActions.map((item: any) => `- ${item}`)
			: reverseOpen && !hasStrong
				? ["- re_domain_proof_exit show", "- re_complete audit", "- re_runtime_adapter run"]
				: ["- re_complete audit"]),
		`next_proof_command: ${
			proof.mode === "run"
				? proof.verdict === "ready"
					? "re_complete audit"
					: `re_proof_loop run ${proof.target ?? "<target>"} 4 ${proof.replaySteps}`
				: `re_proof_loop run ${proof.target ?? "<target>"} ${proof.maxSteps} ${proof.replaySteps}`
		}`,
	];
}
