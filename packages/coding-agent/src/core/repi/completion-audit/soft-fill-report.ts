/** Soft-fill: lightweight report checkpoint without heavy evidence digest. */
import { join } from "node:path";
import { readCurrentMission, updateMissionCheckpoint } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { reportDir, writePrivateTextFile } from "../storage.ts";

export function writeSoftFillReportScaffold(title = "web-api"): string {
	ensureReconStorage();
	const mission = readCurrentMission();
	const date = new Date().toISOString().replace(/[:.]/g, "-");
	const safeTitle = String(title || mission?.route?.domain || "repi-report")
		.replace(/[^a-z0-9._-]+/gi, "-")
		.slice(0, 80);
	const path = join(reportDir(), `${date}-${safeTitle}-soft.md`);
	const body = [
		"# REPI Soft-Fill Report Scaffold",
		"",
		`mission_id: ${mission?.id ?? "none"}`,
		`task: ${String(mission?.task ?? "").slice(0, 200)}`,
		`generated_at: ${new Date().toISOString()}`,
		"",
		"## Note",
		"",
		"Lightweight soft-fill scaffold written after reverse_runtime_gate was satisfied.",
		"Optional orchestration only — not a full claim-release report.",
		"",
	].join("\n");
	writePrivateTextFile(path, body);
	updateMissionCheckpoint("report_or_writeup_ready", "done", `${path} soft_fill`);
	return path;
}
