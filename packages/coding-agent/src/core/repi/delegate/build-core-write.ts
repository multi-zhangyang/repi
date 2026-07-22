/** Delegate artifact write. */
import { join } from "node:path";
import { formatDelegate } from "../operator-format.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceDelegationsDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import type { DelegateArtifact } from "./types.ts";

export function writeDelegateArtifact(delegate: DelegateArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceDelegationsDir(),
		`${delegate.timestamp.replace(/[:.]/g, "-")}-${slug(delegate.route ?? "delegation")}-${delegate.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Delegation Artifact",
			"",
			formatDelegate(delegate, path),
			"",
			"## Worker packets",
			"",
			...delegate.packets.map(
				(packet: any) =>
					`- ${packet.id} worker=${packet.worker} status=${packet.status} steps=${packet.steps.length}`,
			),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(delegate, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: "artifact",
		title: `delegation-${delegate.mode} ${delegate.missionId ?? "no-mission"}`,
		fact: `Built delegation plan with ${delegate.packets.length} worker packet(s), ${delegate.mergeQueue.length} merge item(s), ${delegate.gaps.length} gap(s), adaptive_routes=${delegate.adaptiveRoutingHints.length}, promotions=${delegate.workerPromotionQueue.length}`,
		command: `re_delegate ${delegate.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "operation/campaign specialist delegation",
	});
	updateMissionCheckpoint("delegation_packets_ready", "done", path);
	return path;
}
