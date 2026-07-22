/** Autonomous budget next actions with reverse proof gates. */
export function autonomousBudgetNextActions(params: {
	target?: string;
	suffix: string;
	laneDemotions: string[];
	demotionRules: string[];
	promotionRules: string[];
	maxDispatch: number;
	maxProofLoops: number;
}): string[] {
	const next: string[] = [
		"re_domain_proof_exit show",
		"re_complete audit",
		"re_runtime_adapter run",
		"reverse capture gate: require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true",
	];
	if (params.laneDemotions.length) {
		next.push(
			`re_lane plan autonomous-dispatcher-repair${params.suffix}`,
			`re_lane run-auto autonomous-dispatcher-repair 2`,
		);
	}
	if (params.demotionRules.length) {
		next.push(`re_autofix plan${params.suffix}`, `re_context pack${params.suffix}`);
	}
	if (params.promotionRules.length) {
		next.push(`re_reflect write${params.suffix}`, `re_knowledge_graph build${params.suffix}`, "re_memory playbooks");
	}
	next.push(
		`re_operator dispatch${params.suffix} ${Math.min(3, params.maxDispatch)}`,
		`re_proof_loop run${params.suffix} ${Math.min(6, params.maxProofLoops + 2)} 2`,
	);
	return Array.from(new Set(next)).slice(0, 14);
}
