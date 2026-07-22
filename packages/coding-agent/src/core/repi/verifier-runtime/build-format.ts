/** Verifier format/latest/parse helpers. */

import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { evidenceVerifiersDir, readTextFile as readText } from "../storage.ts";
import type { VerifierArtifact } from "./types.ts";

export function formatVerifier(verifier: any, path?: string): string {
	return [
		"verifier_matrix:",
		path ? `verifier_artifact: ${path}` : undefined,
		`timestamp: ${verifier.timestamp}`,
		`mode: ${verifier.mode}`,
		`mission_id: ${verifier.missionId ?? "none"}`,
		`route: ${verifier.route ?? "none"}`,
		`target: ${verifier.target ?? "<none>"}`,
		`operator_artifact: ${verifier.operatorArtifact ?? "none"}`,
		"operator_feedback:",
		...((verifier.operatorFeedback ?? []).length
			? (verifier.operatorFeedback ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"assertions:",
		...(verifier.assertions.length
			? verifier.assertions.map(
					(assertion: any) =>
						`- ${assertion.id} [${assertion.status}] confidence=${assertion.confidence} subject=${assertion.subject} claim=${assertion.claim}`,
				)
			: ["- none"]),
		"evidence_bindings:",
		...(verifier.assertions.length
			? verifier.assertions.flatMap((assertion: any) =>
					assertion.evidence.length
						? assertion.evidence.slice(0, 4).map((item: any) => `- ${assertion.id}: ${item}`)
						: [`- ${assertion.id}: none`],
				)
			: ["- none"]),
		"counter_evidence:",
		...(verifier.assertions.some((assertion: any) => assertion.counterEvidence.length)
			? verifier.assertions.flatMap((assertion: any) =>
					assertion.counterEvidence.map((item: any) => `- ${assertion.id}: ${item}`),
				)
			: ["- none"]),
		"contradictions:",
		...(verifier.contradictions.length ? verifier.contradictions.map((item: any) => `- ${item}`) : ["- none"]),
		"gaps:",
		...(verifier.gaps.length ? verifier.gaps.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...(verifier.nextActions.length ? verifier.nextActions.map((item: any) => `- ${item}`) : ["- re_complete audit"]),
		`next_verifier_command: ${verifier.mode === "matrix" ? "re_complete audit" : "re_verifier matrix"}`,
		"source_artifacts:",
		...(verifier.sourceArtifacts.length ? verifier.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}

export function latestVerifierArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return (latestScopedMarkdownArtifact as any)("verifier", evidenceVerifiersDir(), options);
}

export function parseVerifierArtifact(path: string): VerifierArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as VerifierArtifact;
	} catch {
		return undefined;
	}
}
