/** Compact-resume context-pack verify signal. */
import { existsSync } from "node:fs";
import { contextBranchId, contextPackSha256, hashFileSha256 } from "../deps.ts";

export function verifyContextPackResume(
	pack: any | undefined,
	sourcePath: string | undefined,
	loadedBy: any["loadedBy"],
	target?: string,
	ref?: string,
): any {
	const reverseCaptureGate =
		"reverse capture gate: require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true; next re_domain_proof_exit / re_runtime_adapter";

	const blocked: string[] = [];
	const warnings: string[] = [];
	if (!pack || !sourcePath) {
		return {
			ref,
			sourcePath,
			loadedBy: "missing",
			contextSha256: "missing",
			artifactHashes: "missing",
			scope: "missing",
			blocked: ["context pack not found"],
			warnings,
		};
	}
	const actualContextHash = contextPackSha256(pack);
	const contextSha256 = !pack.contextSha256 ? "missing" : pack.contextSha256 === actualContextHash ? "pass" : "drift";
	if (contextSha256 !== "pass") blocked.push(`contextSha256 ${contextSha256}`);
	let scope: any["scope"] = "pass";
	if (!pack.scope) {
		scope = "missing";
		warnings.push("scope missing");
	} else {
		if (target && pack.scope.target && pack.scope.target !== target) {
			scope = "mismatch";
			blocked.push(`target mismatch: ${pack.scope.target} != ${target}`);
		}
		if (pack.scope.workspaceRoot && pack.scope.workspaceRoot !== process.cwd()) {
			scope = "mismatch";
			blocked.push(`workspaceRoot mismatch: ${pack.scope.workspaceRoot} != ${process.cwd()}`);
		}
		const currentBranchId = contextBranchId();
		const packBranch = pack.scope.branchId;
		const packBranchKey =
			packBranch == null ? "" : typeof packBranch === "string" ? packBranch : JSON.stringify(packBranch);
		const currentBranchKey =
			currentBranchId == null
				? ""
				: typeof currentBranchId === "string"
					? currentBranchId
					: JSON.stringify(currentBranchId);
		// Ignore legacy memory-stub {} branch ids; only compare non-empty string ids.
		if (
			packBranchKey &&
			currentBranchKey &&
			packBranchKey !== "{}" &&
			currentBranchKey !== "{}" &&
			packBranchKey !== currentBranchKey
		) {
			scope = "mismatch";
			blocked.push(`branch mismatch: ${packBranchKey} != ${currentBranchKey}`);
		}
	}
	let artifactHashes: any["artifactHashes"] = "pass";
	if (!pack.artifactHashes?.length) {
		artifactHashes = "missing";
		blocked.push("artifactHashes missing");
	} else {
		for (const artifact of pack.artifactHashes.filter((item: any) => item.required)) {
			if (!existsSync(artifact.path)) {
				artifactHashes = "drift";
				blocked.push(`artifact missing: ${artifact.path}`);
				continue;
			}
			const current = hashFileSha256(artifact.path);
			if (artifact.sha256 && current !== artifact.sha256) {
				artifactHashes = "drift";
				blocked.push(`artifact hash drift: ${artifact.path}`);
			}
		}
	}
	if (
		reverseCaptureGate &&
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|proof_exit|bind_ready/i.test(
			JSON.stringify(pack ?? {}),
		)
	) {
		warnings.push(reverseCaptureGate);
	}
	return {
		ref,
		sourcePath,
		loadedBy,
		contextSha256,
		artifactHashes,
		scope,
		blocked: Array.from(new Set(blocked)),
		warnings,
	};
}
