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
		// Prefer task/intent over domain label: labels like "DFIR / PCAP / stego" falsely
		// promote crypto adapter ahead of pcap when target is bare cwd.
		return [mission.task, mission.route?.intent, mission.route?.skillHint].filter(Boolean).map(String).join("\n");
	} catch {
		return "";
	}
}

export function pickAdapterIdForRun(params: {
	adapter?: string;
	target?: string;
	resolvedTarget?: string;
}): string | undefined {
	const missionBlob = missionLexicalBlob();
	const missionIds = missionBlob ? detectRuntimeAdapterIds(missionBlob) : [];
	const missionStrong =
		Boolean(missionIds[0]) && !/^(?:gdb-native-trace-adapter|r2-native-xref-adapter)$/.test(String(missionIds[0]));
	// Models often force native adapters on agent/cloud/crypto tasks; demote when mission lexical is strong.
	if (params.adapter) {
		const requested = String(params.adapter);
		if (
			missionStrong &&
			/^(?:gdb-native-trace-adapter|r2-native-xref-adapter)$/.test(requested) &&
			missionIds[0] !== requested
		) {
			return missionIds[0];
		}
		return params.adapter;
	}
	const rawTarget = String(params.target ?? "").trim();
	const resolvedTarget = String(params.resolvedTarget ?? "").trim();
	// Prefer mission/task lexical when filesystem target is bare "." / cwd — directory inventory
	// would otherwise demote stego/crypto/mobile into unrelated host adapters.
	// Bare cwd only — never treat an existing concrete path as bare just because
	// resolveAdapterRunTarget returned the same string (e.g. pcap/ELF path).
	const bareFs = !rawTarget || rawTarget === "." || rawTarget === "./";
	// For concrete paths, detect from the path first; blend mission lexical only for bare cwd.
	if (bareFs) {
		const ids = detectRuntimeAdapterIds([missionBlob, rawTarget].filter(Boolean).join("\n"));
		if (ids[0]) return ids[0];
	}
	// Concrete path: prefer path detection, but if path is a generic host ELF/bin and mission
	// has a stronger lexical domain adapter (malware/crypto/stego/dfir/cloud/agent), use mission.
	const pathProbe = rawTarget || resolvedTarget;
	const pathIds = pathProbe ? detectRuntimeAdapterIds(pathProbe) : [];
	const genericNative =
		pathIds[0] &&
		/^(?:gdb-native-trace-adapter|r2-native-xref-adapter)$/.test(pathIds[0]) &&
		/\/(?:usr\/)?(?:local\/)?(?:bin|sbin)\//.test(pathProbe);
	if (genericNative && missionStrong) return missionIds[0];
	if (pathIds[0]) return pathIds[0];
	if (missionIds[0]) return missionIds[0];
	return undefined;
}
