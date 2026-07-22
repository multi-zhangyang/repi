/** Swarm claim ledger pure helpers (hash chain / ranks). */
import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { hashFileSha256 } from "../text.ts";
import type { FailureRepairArtifactHash, SwarmClaimLedgerEventV1 } from "./types.ts";

export function contextEvidenceRank(kind: string): string {
	if (kind === "artifact_scope_filter") return "persisted_state";
	if (/^memory_/i.test(kind)) return "persisted_state";
	if (/^compact_resume_/i.test(kind)) return "persisted_state";
	if (
		/browser|web_authz|mobile_runtime|native_runtime|exploit_lab|js_signing|js-signing|run|replayer|proof_loop/i.test(
			kind,
		)
	)
		return "runtime_artifact";
	if (/map|knowledge|harness|decision_core|kernel/i.test(kind)) return "process_config";
	if (/compiler|verifier|supervisor|swarm|delegation|operation|reflection|operator|autofix/i.test(kind))
		return "persisted_state";
	return "artifact";
}

export function runtimeArtifactHashes(paths: Array<string | undefined>): FailureRepairArtifactHash[] {
	return Array.from(new Set(paths.filter((path): path is string => Boolean(path))))
		.filter((path: any) => existsSync(path) && statSync(path).isFile())
		.slice(0, 24)
		.map((path: any) => ({
			path,
			sha256: hashFileSha256(path),
			tier: contextEvidenceRank(/evidence\/([^/]+)/.exec(path)?.[1] ?? "runtime"),
		}));
}

export function swarmClaimLedgerEventHash(event: SwarmClaimLedgerEventV1): string {
	const { eventHash: _eventHash, ...withoutHash } = event;
	return createHash("sha256").update(JSON.stringify(withoutHash)).digest("hex");
}

export function appendSwarmClaimLedgerEvent(
	events: SwarmClaimLedgerEventV1[],
	event: Omit<SwarmClaimLedgerEventV1, "kind" | "seq" | "prevHash" | "eventHash" | "timestamp" | "source">,
	timestamp: string,
): SwarmClaimLedgerEventV1 {
	const row: SwarmClaimLedgerEventV1 = {
		kind: "ClaimLedgerEventV1",
		seq: events.length + 1,
		prevHash: events.at(-1)?.eventHash ?? "0".repeat(64),
		eventHash: "",
		timestamp,
		source: "re_swarm",
		...event,
	};
	row.eventHash = swarmClaimLedgerEventHash(row);
	events.push(row);
	return row;
}

export function swarmClaimLedgerHashChainOk(events: SwarmClaimLedgerEventV1[]): boolean {
	let prevHash = "0".repeat(64);
	for (const event of events) {
		if (event.kind !== "ClaimLedgerEventV1" || event.prevHash !== prevHash) return false;
		if (event.eventHash !== swarmClaimLedgerEventHash(event)) return false;
		prevHash = event.eventHash;
	}
	return events.length > 0;
}
