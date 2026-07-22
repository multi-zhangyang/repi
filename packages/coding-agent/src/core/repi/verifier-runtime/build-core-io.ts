/** Verifier write/output/latest helpers. */
import { join } from "node:path";
import { artifactTargetMatches } from "../replayer-runtime/deps.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceVerifiersDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { buildVerifier } from "./build-core-build.ts";
import { formatVerifier, latestVerifierArtifactPath, parseVerifierArtifact } from "./build-format.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import { verifierTechniqueProofContract } from "./pure.ts";
import type { VerifierArtifact } from "./types.ts";

/** reverse: verifier paths require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true */
export function writeVerifierArtifact(verifier: VerifierArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceVerifiersDir(),
		`${verifier.timestamp.replace(/[:.]/g, "-")}-${slug(verifier.route ?? "verifier")}-${verifier.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Verifier Artifact",
			"",
			formatVerifier(verifier, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(verifier, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: "artifact",
		title: `verifier-${verifier.mode} ${verifier.missionId ?? "no-mission"}`,
		fact: `Verifier matrix ${verifier.mode}: ${verifier.assertions.length} assertion(s), ${verifier.contradictions.length} contradiction(s), ${verifier.gaps.length} gap(s), operator_feedback=${(verifier.operatorFeedback ?? []).length}`,
		command: `re_verifier ${verifier.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "operator/evidence assertion verifier",
	});
	updateMissionCheckpoint("verifier_matrix_ready", "done", path);
	return path;
}

export function buildVerifierOutput(
	action: "check" | "show" | "matrix" = "check",
	options: { target?: string; techniqueId?: string } = {},
): string {
	if (action === "show") {
		const path = latestVerifierArtifactPath();
		if (!path) return "verifier_matrix:\nstatus: missing\nnext: re_verifier check";
		return truncateMiddle(readText(path), 18000);
	}
	const verifier = buildVerifier({ target: options.target, mode: action === "matrix" ? "matrix" : "check" });
	const path = writeVerifierArtifact(verifier);
	const base = formatVerifier(verifier, path);
	const contract = verifierTechniqueProofContract(options.techniqueId);
	const text = contract ? `${base}\n\n${contract}` : base;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${options.target ?? ""} ${options.techniqueId ?? ""} ${text}`,
		target: options.target,
		includeGates: true,
	}).slice(0, 3);
	if (!reverseNext.length) return text;
	return `${text}\nreverse_next:\n${reverseNext.map((c: any) => `- ${c}`).join("\n")}`;
}

export function latestOrBuildVerifier(options: { target?: string } = {}): { verifier: VerifierArtifact; path: string } {
	const latest = latestVerifierArtifactPath(
		options.target ? { target: options.target, requestedBy: "latest_or_build_verifier" } : {},
	);
	if (latest) {
		const verifier = parseVerifierArtifact(latest);
		if (verifier && artifactTargetMatches(options.target, verifier.target)) return { verifier, path: latest };
	}
	const verifier = buildVerifier({ target: options.target, mode: "matrix" });
	const path = writeVerifierArtifact(verifier);
	return { verifier, path };
}
