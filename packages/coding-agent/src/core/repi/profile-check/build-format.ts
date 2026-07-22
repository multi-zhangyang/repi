/** Format/write/output profile-check artifact. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceProfileCheckDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildProfileCheckArtifact } from "./build-core.ts";
import { latestProfileCheckArtifactPath } from "./checks.ts";
import { d } from "./deps.ts";
import type { ProfileCheckArtifact, ProfileCheckMode } from "./types.ts";

export function formatProfileCheckArtifact(profileCheck: ProfileCheckArtifact, path?: string): string {
	const reverseHeavy =
		profileCheck.verdict !== "pass" ||
		profileCheck.reverseCapabilityGuards.some((item: any) =>
			/missing|fail|weak|proof_exit|bind_ready|native|frida|r2|gdb/i.test(item),
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `profile_check ${profileCheck.mode} ${profileCheck.reverseCapabilityGuards.join(" ")}`,
				includeGates: true,
			}).slice(0, 3)
		: [];
	const nextActions = Array.from(new Set([...reverseNext, ...profileCheck.nextActions])).slice(0, 16);
	return [
		"profile_check:",
		path ? `profile_check_artifact: ${path}` : undefined,
		`timestamp: ${profileCheck.timestamp}`,
		`mode: ${profileCheck.mode}`,
		`verdict: ${profileCheck.verdict}`,
		"capability_matrix:",
		...profileCheck.capabilityMatrix.map((item: any) => `- ${item}`),
		"checks:",
		...profileCheck.checks.map((check: any) => `- ${check.status} ${check.id}: ${check.evidence.join(" | ")}`),
		"install_readiness:",
		...profileCheck.installReadiness.map((item: any) => `- ${item}`),
		"reverse_capability_guards:",
		...profileCheck.reverseCapabilityGuards.map((item: any) => `- ${item}`),
		"regression_guards:",
		...profileCheck.regressionGuards.map((item: any) => `- ${item}`),
		"next_actions:",
		...(nextActions.length ? nextActions.map((item: any) => `- ${item}`) : ["- none"]),
		`next_profile_check_command: ${profileCheck.verdict === "pass" ? "re_profile_check show" : "re_profile_check full"}`,
		"source_artifacts:",
		...(profileCheck.sourceArtifacts.length
			? profileCheck.sourceArtifacts.map((item: any) => `- ${item}`)
			: ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}

export function writeProfileCheckArtifact(profileCheck: ProfileCheckArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceProfileCheckDir(),
		`${profileCheck.timestamp.replace(/[:.]/g, "-")}-${profileCheck.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Profile Check Artifact",
			"",
			formatProfileCheckArtifact(profileCheck, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(profileCheck, null, 2),
			"```",
			"",
		].join("\n"),
	);
	d().appendEvidence({
		kind: "artifact",
		title: `profile-check-${profileCheck.mode}-${profileCheck.verdict}`,
		fact: `Profile check ${profileCheck.mode}: verdict=${profileCheck.verdict}, checks=${profileCheck.checks.length}, install_readiness=${profileCheck.installReadiness.length}, reverse_capability_guards=${profileCheck.reverseCapabilityGuards.length}, regression_guards=${profileCheck.regressionGuards.length}`,
		command: `re_profile_check ${profileCheck.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "profile/install/regression check",
	});
	d().updateMissionCheckpoint("profile_check_ready", profileCheck.verdict === "fail" ? "blocked" : "done", path);
	return path;
}

export function buildProfileCheckOutput(action: ProfileCheckMode | "show" = "quick"): string {
	if (action === "show") {
		const path = latestProfileCheckArtifactPath();
		if (!path) return "profile_check:\nstatus: missing\nnext: re_profile_check quick";
		return truncateMiddle(readText(path), 24000);
	}
	const profileCheck = buildProfileCheckArtifact(action);
	const path = writeProfileCheckArtifact(profileCheck);
	return formatProfileCheckArtifact(profileCheck, path);
}
