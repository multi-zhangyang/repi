/**
 * Autofix pure types and formatter.
 */
export type AutofixItemKind = "patch" | "command_substitution" | "bootstrap" | "evidence_recapture" | "operator";

export type AutofixStatus = "queued" | "applied" | "blocked";

export type AutofixItem = {
	id: string;
	kind: AutofixItemKind;
	source: string;
	reason: string;
	command: string;
	status: AutofixStatus;
	sourceArtifacts: string[];
};

export type AutofixArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "apply";
	replayArtifact?: string;
	compilerArtifact?: string;
	operatorFeedback: string[];
	failures: string[];
	patchQueue: AutofixItem[];
	commandSubstitutions: AutofixItem[];
	bootstrapQueue: AutofixItem[];
	evidenceRecaptureQueue: AutofixItem[];
	nextOperatorQueue: string[];
	applied: string[];
	repairRollbackPolicyPath?: string;
	repairRollbackPolicyStatus?: "pass" | "blocked" | "missing";
	repairRollbackPolicyErrors: string[];
	sourceArtifacts: string[];
};

export function formatAutofix(autofix: AutofixArtifact, path?: string): string {
	const formatItems = (items: AutofixItem[]) =>
		items.length
			? items.map((item: any) => `- ${item.id} [${item.status}] ${item.command} # ${item.reason}`)
			: ["- none"];
	return [
		"autofix_plan:",
		path ? `autofix_artifact: ${path}` : undefined,
		`timestamp: ${autofix.timestamp}`,
		`mode: ${autofix.mode}`,
		`mission_id: ${autofix.missionId ?? "none"}`,
		`route: ${autofix.route ?? "none"}`,
		`target: ${autofix.target ?? "<none>"}`,
		`replay_artifact: ${autofix.replayArtifact ?? "none"}`,
		`compiler_artifact: ${autofix.compilerArtifact ?? "none"}`,
		"operator_feedback:",
		...((autofix.operatorFeedback ?? []).length
			? (autofix.operatorFeedback ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"failures:",
		...(autofix.failures.length ? autofix.failures.map((item: any) => `- ${item}`) : ["- none"]),
		"patch_queue:",
		...formatItems(autofix.patchQueue),
		"command_substitutions:",
		...formatItems(autofix.commandSubstitutions),
		"bootstrap_queue:",
		...formatItems(autofix.bootstrapQueue),
		"evidence_recapture_queue:",
		...formatItems(autofix.evidenceRecaptureQueue),
		"next_operator_queue:",
		...(autofix.nextOperatorQueue.length
			? autofix.nextOperatorQueue.map((item: any) => `- ${item}`)
			: ["- re_complete audit"]),
		"applied:",
		...(autofix.applied.length ? autofix.applied.map((item: any) => `- ${item}`) : ["- none"]),
		"repair_rollback_policy:",
		`- path=${autofix.repairRollbackPolicyPath ?? "pending"}`,
		`- status=${autofix.repairRollbackPolicyStatus ?? "missing"}`,
		...(autofix.repairRollbackPolicyErrors?.length
			? autofix.repairRollbackPolicyErrors.slice(0, 8).map((error: any) => `- error=${error}`)
			: ["- errors=none"]),
		`next_autofix_command: ${autofix.mode === "apply" ? "re_replayer run" : "re_autofix apply"}`,
		"source_artifacts:",
		...(autofix.sourceArtifacts.length ? autofix.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
