/** Evidence control-plane path helpers. */
import { join } from "node:path";
import { reconDir } from "./core.ts";

export function evidenceKernelDir(): string {
	return join(reconDir(), "evidence", "kernel");
}
export function evidenceDecisionsDir(): string {
	return join(reconDir(), "evidence", "decisions");
}
export function evidenceCampaignsDir(): string {
	return join(reconDir(), "evidence", "campaigns");
}
export function evidenceOperationsDir(): string {
	return join(reconDir(), "evidence", "operations");
}
export function evidenceDelegationsDir(): string {
	return join(reconDir(), "evidence", "delegations");
}
export function evidenceSwarmsDir(): string {
	return join(reconDir(), "evidence", "swarms");
}
export function evidenceSupervisorsDir(): string {
	return join(reconDir(), "evidence", "supervisor");
}
export function evidenceReflectionsDir(): string {
	return join(reconDir(), "evidence", "reflections");
}
export function evidenceContextsDir(): string {
	return join(reconDir(), "evidence", "contexts");
}
export function evidenceOperatorsDir(): string {
	return join(reconDir(), "evidence", "operators");
}
export function evidenceVerifiersDir(): string {
	return join(reconDir(), "evidence", "verifiers");
}
export function evidenceCompilersDir(): string {
	return join(reconDir(), "evidence", "compilers");
}
export function evidenceReplayersDir(): string {
	return join(reconDir(), "evidence", "replayers");
}
export function evidenceAutofixDir(): string {
	return join(reconDir(), "evidence", "autofix");
}
export function evidenceKnowledgeDir(): string {
	return join(reconDir(), "evidence", "knowledge");
}
export function evidenceToolCallsDir(): string {
	return join(reconDir(), "evidence", "tool-calls");
}
