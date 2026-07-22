import { currentMissionPath, ensureRepiStorage, readJsonObjectFileCached, writePrivateTextFile } from "../storage.ts";
import { normalizeMission } from "./io-create.ts";
/** Mission create/read/write/update helpers. */
import type { MissionState } from "./types.ts";

export function readCurrentMission(): MissionState | undefined {
	ensureRepiStorage();
	// opt #75 — mtime+size-keyed cache (readJsonObjectFileCached, the #65 primitive) instead
	// of an uncached readTextFile + JSON.parse on every call. readCurrentMission is called
	// 3-4× per deposit tool_result (recall buildPerTurnMemoryRecall + appendMemoryEvent
	// Transaction + appendMemoryDepositionRuntimeEvent + currentMemoryScope) plus once per
	// most re_* command handlers — each was a readFileSync + JSON.parse of current-mission
	// .json, a file that only changes on re_mission ops (writeCurrentMission atomic temp+
	// rename bumps mtime+size → auto-invalidate). normalizeMission does NOT mutate its input
	// (it builds a fresh lanes array via .map + spreads), so it is safe to call on the shared
	// cached raw object; each caller still gets a fresh normalized copy it can mutate freely.
	const raw = readJsonObjectFileCached<MissionState>(currentMissionPath());
	if (!raw) return undefined;
	try {
		return normalizeMission(raw);
	} catch {
		return undefined;
	}
}

/**
 * Map a mission lane to a builtin specialist spec for opt-in specialist
 * dispatch. Returns undefined when no specialist clearly owns the lane (the
 * caller then falls back to the inline autopilot path). Matching is keyword
 * based over lane.name + lane.objective + route.domain so it stays generic
 * across all routes — no per-route special-casing.
 */

export function writeCurrentMission(mission: MissionState): MissionState {
	ensureRepiStorage();
	const next = normalizeMission({ ...mission, updatedAt: new Date().toISOString() });
	// opt #75 — atomic temp+rename (writePrivateTextFile, 0o600) instead of a bare
	// writeFileSync truncate-then-write. A crash (SIGKILL/OOM/SIGTERM) mid-writeFileSync
	// truncated current-mission.json → readCurrentMission returned undefined → the agent
	// silently lost its mission/route/lanes context (same class as opts #38/#41/#42/#43;
	// this recon-profile.ts site was missed by the atomic-write audit). temp+rename means a
	// reader sees either the complete prior or the complete new mission. The rename also
	// guarantees a fresh mtime+size → readCurrentMission's readJsonObjectFileCached
	// invalidates cleanly (no stale-cache-on-same-ms-tick risk a same-file truncate could
	// have). 0o600 tightens the mode to match the rest of REPI state (#43 doctrine).
	writePrivateTextFile(currentMissionPath(), `${JSON.stringify(next, null, 2)}\n`);
	return next;
}
