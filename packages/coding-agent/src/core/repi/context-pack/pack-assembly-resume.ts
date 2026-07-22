/** Context-pack resume brief lines. */
export function buildContextPackResumeBrief(input: {
	mission?: any;
	active?: any;
	pendingGates: string[];
	reflectionPath?: string;
	supervisorPath?: string;
	reflection?: any;
	supervisor?: any;
	repairQueue: string[];
	swarmRetryQueue: string[];
	autonomousBudget: any;
	commanderMergeBudget: string[];
	caseMemoryPlan?: any;
	nextCommands: string[];
}): string[] {
	const {
		mission,
		active,
		pendingGates,
		reflectionPath,
		supervisorPath,
		reflection,
		supervisor,
		repairQueue,
		swarmRetryQueue,
		autonomousBudget,
		commanderMergeBudget,
		caseMemoryPlan,
		nextCommands,
	} = input;
	return [
		`mission=${mission?.id ?? "none"}`,
		`route=${mission?.route.domain ?? reflection?.route ?? supervisor?.route ?? "unknown"}`,
		`active_lane=${active?.name ?? "none"}`,
		`pending_checks=${pendingGates.length ? pendingGates.join(",") : "none"}`,
		`latest_reflection=${reflectionPath ?? "none"}`,
		`latest_supervisor=${supervisorPath ?? "none"}`,
		`repair_queue_items=${repairQueue.length}`,
		`swarm_retry_queue=${swarmRetryQueue.length}`,
		`autonomous_budget=max_turns:${autonomousBudget.maxTurns},max_dispatch:${autonomousBudget.maxDispatch},score_decay:${autonomousBudget.scoreDecay.length},demotions:${autonomousBudget.demotionRules.length},promotions:${autonomousBudget.promotionRules.length}`,
		`commander_merge_queue=${supervisor?.commanderMergeQueue?.length ?? 0}`,
		`commander_budget=${commanderMergeBudget.join(";") || "none"}`,
		`case_memory_lane_plan=${caseMemoryPlan?.action ?? "none"}:${caseMemoryPlan?.targetLane ?? caseMemoryPlan?.addedLane ?? active?.name ?? "none"}`,
		`first_command=${nextCommands[0] ?? "re_mission show"}`,
		// reverse product marker for pack consumers
		`reverse_next_seeded=${/re_native_runtime|re_domain_proof_exit|re_live_browser|re_js_signing|proof_exit/i.test(nextCommands.join("\n"))}`,
	];
}
