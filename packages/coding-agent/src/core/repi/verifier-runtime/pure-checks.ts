/** Verifier pure assertion checks. */

import { readCurrentMission } from "../mission.ts";
import { formatCweTags, formatMitreTag } from "../taxonomy.ts";
import { techniqueById } from "../techniques.ts";
import type { VerifierAssertion } from "./types.ts";

export function checkAssertions(): VerifierAssertion[] {
	const mission = readCurrentMission();
	if (!mission) {
		return [
			{
				id: "check:no-mission",
				subject: "mission blackboard",
				claim: "active mission exists for verification",
				status: "missing",
				confidence: 15,
				evidence: [],
				counterEvidence: ["no active mission"],
				requiredFollowups: ["re_mission new <task>", "re_context pack", "re_complete audit"],
			},
		];
	}
	return mission.checkpoints.map((checkpoint: any, index: any) => ({
		id: `check:${index + 1}:${checkpoint.name}`,
		subject: `check:${checkpoint.name}`,
		claim: `mission checkpoint ${checkpoint.name} is ${checkpoint.status}`,
		status: checkpoint.status === "done" ? "proved" : checkpoint.status === "blocked" ? "contradicted" : "missing",
		confidence: checkpoint.status === "done" ? 80 : checkpoint.status === "blocked" ? 20 : 35,
		evidence: checkpoint.note ? [`note: ${checkpoint.note}`] : [],
		counterEvidence: checkpoint.status === "done" ? [] : [`checkpoint status=${checkpoint.status}`],
		requiredFollowups:
			checkpoint.status === "done"
				? ["re_complete audit"]
				: checkpoint.name === "profile_check_ready"
					? ["re_profile_check full", "re_autofix plan profile_check_ready", "re_verifier matrix"]
					: /reverse|native|malware|firmware|pwn|binary/i.test(mission.route.domain)
						? [
								`close check: ${checkpoint.name}`,
								"re_domain_proof_exit show /* + re_runtime_adapter run */",
								"re_complete audit",
								"re_operator escalate",
							]
						: [`close check: ${checkpoint.name}`, "re_operator escalate"],
	}));
}

/** reverse: verifier paths require proof.exit=partial_runtime_capture|runtime_capture_strong; next re_runtime_adapter run and bind_ready=true */
export function verifierTechniqueProofContract(techniqueId?: string): string {
	if (!techniqueId) return "";
	const technique = techniqueById(techniqueId);
	if (!technique) {
		return `technique_proof_contract:\nstatus: unknown technique id '${techniqueId}'\nhint: call re_techniques(format=index) to enumerate ids`;
	}
	const tags = [
		technique.mitre ? technique.mitre.map(formatMitreTag).join(", ") : null,
		technique.cwe ? formatCweTags(technique.cwe) : null,
	]
		.filter(Boolean)
		.join(" | ");
	const counterProbes = technique.pitfalls.map((pitfall: any, index: any) => `  ${index + 1}. [falsify] ${pitfall}`);
	return [
		"technique_proof_contract:",
		`id: ${technique.id}`,
		`domain: ${technique.domain}`,
		tags ? `taxonomy: ${tags}` : null,
		`assertion: ${technique.proofExit}`,
		"counter_evidence_probes (each must be actively attempted to refute the claim):",
		...counterProbes,
		`expected_tool_surface: ${technique.tools.join(", ")}`,
		"verifier_rule: mark 'proved' ONLY if the captured observation satisfies the assertion above AND every counter_evidence_probe was attempted and failed to refute it; otherwise mark 'weak'/'contradicted'/'missing'.",
		"product_gate: technique claims without matching proof_exit evidence must stay weak/missing; run re_domain_proof_exit show /* + re_runtime_adapter run */ and re_complete audit before promotion.",
		`required_followups: re_domain_proof_exit show /* + re_runtime_adapter run */ | re_complete audit | re_techniques(id=${technique.id})`,
		`source: re_techniques(id=${technique.id})`,
	]
		.filter((line): line is string => line !== null)
		.join("\n");
}
