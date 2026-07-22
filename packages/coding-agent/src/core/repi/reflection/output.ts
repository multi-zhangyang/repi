/** Reflection write/output with reverse next. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceReflectionsDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { buildReflection, formatReflection } from "./build.ts";
import type { ReflectionArtifact } from "./types-config.ts";
import {
	appendEvidence,
	latestReflectionArtifactPath,
	updateMissionCheckpoint,
	writeReflectionMemory,
} from "./types-config.ts";

export function writeReflectionArtifact(reflection: ReflectionArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceReflectionsDir(),
		`${reflection.timestamp.replace(/[:.]/g, "-")}-${slug(reflection.route ?? "reflection")}-${reflection.mode}.md`,
	);
	// Atomic temp+rename (0o600): read back via readText by buildReflectOutput
	// "show"; a torn writeFileSync surfaces truncated reflection with no error.
	// #43/#103.
	writePrivateTextFile(
		path,
		[
			"# REPI Reflection Artifact",
			"",
			formatReflection(reflection, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(reflection, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: "artifact",
		title: `reflection-${reflection.mode} ${reflection.missionId ?? "no-mission"}`,
		fact: `Reflection captured ${reflection.lessons.length} lesson(s), ${reflection.failurePatterns.length} failure pattern(s), ${reflection.repairPlaybook.length} repair action(s)`,
		command: `re_reflect ${reflection.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "supervisor/memory/evolution reflection",
	});
	if (reflection.mode === "write") updateMissionCheckpoint("reflection_memory_ready", "done", path);
	return path;
}

export function buildReflectOutput(
	action: "plan" | "show" | "write" = "plan",
	options: { target?: string; task?: string } = {},
): string {
	if (action === "show") {
		const path = latestReflectionArtifactPath();
		if (!path) return "reflection_cycle:\nstatus: missing\nnext: re_reflect plan";
		return truncateMiddle(readText(path), 16000);
	}
	let reflection = buildReflection({ ...options, mode: action === "write" ? "write" : "plan" });
	if (action === "write") reflection = writeReflectionMemory(reflection);
	const path = writeReflectionArtifact(reflection);
	const text = formatReflection(reflection, path);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: text,
		target: options.target,
	}).slice(0, 3);
	if (!reverseNext.length) return text;
	return `${text}\nreverse_next:\n${reverseNext.map((c: any) => `- ${c}`).join("\n")}`;
}
