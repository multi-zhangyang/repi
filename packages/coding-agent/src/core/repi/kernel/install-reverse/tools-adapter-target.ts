/** Resolve concrete adapter run targets from mission map artifacts. */
import { existsSync, readFileSync } from "node:fs";
import { readCurrentMission } from "../../mission.ts";
import { detectRuntimeAdapterIds } from "../../runtime-adapter/target-inspect-detect.ts";

export function resolveAdapterRunTarget(raw?: string): string | undefined {
	const target = String(raw ?? "").trim();
	if (!target) return undefined;
	if (existsSync(target) || /^https?:\/\//i.test(target)) return target;
	// Lexical-only targets: prefer a concrete mapped ELF/path from mission notes/task/map artifact.
	try {
		const mission = readCurrentMission();
		const mapNote = String(
			mission?.checkpoints?.find((c: { name?: string }) => c.name === "passive_map_done")?.note ?? "",
		);
		const notes = [
			mapNote,
			mission?.checkpoints?.find((c: { name?: string }) => c.name === "repro_commands_ready")?.note,
			mission?.task,
		]
			.filter(Boolean)
			.map(String);
		let blob = notes.join("\n");
		// Map artifact path often encodes target (…-usr-bin-true.md); also read artifact head.
		if (mapNote && existsSync(mapNote)) {
			try {
				blob = `${blob}\n${readFileSync(mapNote, "utf8").slice(0, 4000)}`;
			} catch {
				/* optional */
			}
			const slug = mapNote.match(/-([a-z0-9]+(?:-[a-z0-9]+)+)\.md$/i)?.[1];
			if (slug) {
				const guessed = `/${slug.replace(/-/g, "/")}`;
				if (existsSync(guessed)) return guessed;
			}
		}
		const candidates = [
			...blob.matchAll(/target=(\/[^\s]+)/gi),
			...blob.matchAll(/(\/(?:usr\/)?(?:local\/)?(?:bin|sbin)\/[\w.+-]+)/g),
			...blob.matchAll(/(?:^|[\s`'"=])(\/[\w./+-]+\.(?:so|elf|bin|exe|out))(?:\b|$)/gim),
		]
			.map((m) => m[1])
			.filter((p): p is string => Boolean(p && existsSync(p)));
		if (candidates[0]) return candidates[0];
	} catch {
		/* optional */
	}
	return target;
}

function missionLexicalBlob(): string {
	try {
		const mission = readCurrentMission();
		if (!mission) return "";
		return [
			mission.task,
			mission.route?.domain,
			mission.route?.intent,
			mission.route?.skillHint,
			mission.route?.toolchain,
			...(mission.route?.workflow ?? []),
		]
			.filter(Boolean)
			.map(String)
			.join("\n");
	} catch {
		return "";
	}
}

export function pickAdapterIdForRun(params: {
	adapter?: string;
	target?: string;
	resolvedTarget?: string;
}): string | undefined {
	if (params.adapter) return params.adapter;
	const rawTarget = String(params.target ?? "").trim();
	const resolvedTarget = String(params.resolvedTarget ?? "").trim();
	// Prefer mission/task lexical when filesystem target is bare "." / cwd — directory inventory
	// would otherwise demote stego/crypto/mobile into unrelated host adapters.
	const missionBlob = missionLexicalBlob();
	const bareFs = !rawTarget || rawTarget === "." || rawTarget === "./" || rawTarget === resolvedTarget;
	const lexicalProbe = bareFs ? [missionBlob, rawTarget].filter(Boolean).join("\n") : rawTarget;
	if (lexicalProbe.trim()) {
		const ids = detectRuntimeAdapterIds(lexicalProbe);
		if (ids[0]) return ids[0];
	}
	if (rawTarget && rawTarget !== resolvedTarget) {
		const ids = detectRuntimeAdapterIds(rawTarget);
		if (ids[0]) return ids[0];
	}
	if (resolvedTarget) {
		const ids = detectRuntimeAdapterIds(resolvedTarget);
		if (ids[0]) return ids[0];
	}
	return undefined;
}
