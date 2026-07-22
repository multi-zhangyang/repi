/** Failure-repair ledger read/writeback helpers. */

import { existsSync } from "node:fs";
import { ensureReconStorage } from "../resources.ts";
import {
	readTextFile as readText,
	runtimeFailureLedgerPath,
	runtimeFailureSummaryPath,
	runtimeRepairQueuePath,
} from "../storage.ts";
import { isFailureLedgerEvent, isRepairQueueItem, rebuildRuntimeFailureSummaryFromLedger } from "./classify.ts";
import type { FailureRepairEvidenceWriteback } from "./types.ts";

export function failureRepairEvidenceWriteback(): FailureRepairEvidenceWriteback {
	return {
		failureLedgerPath: runtimeFailureLedgerPath(),
		repairQueuePath: runtimeRepairQueuePath(),
		appendOnly: true,
		mode: "runtime",
	};
}

export function readRuntimeFailureLedgerRows(): any[] {
	return readText(runtimeFailureLedgerPath())
		.split(/\r?\n/)
		.map((line: any) => line.trim())
		.filter(Boolean)
		.map((line: any) => {
			try {
				const row: unknown = JSON.parse(line);
				return isFailureLedgerEvent(row) ? row : undefined;
			} catch {
				return undefined;
			}
		})
		.filter((row): row is any => Boolean(row));
}

export function readRuntimeRepairQueueRows(): any[] {
	return readText(runtimeRepairQueuePath())
		.split(/\r?\n/)
		.map((line: any) => line.trim())
		.filter(Boolean)
		.map((line: any) => {
			try {
				const row: unknown = JSON.parse(line);
				return isRepairQueueItem(row) ? row : undefined;
			} catch {
				return undefined;
			}
		})
		.filter((row): row is any => Boolean(row));
}

export function readRuntimeFailureSummary(): Map<string, number> {
	ensureReconStorage();
	const path = runtimeFailureSummaryPath();
	if (existsSync(path)) {
		try {
			const raw = JSON.parse(readText(path) || "{}") as Record<string, unknown>;
			const map = new Map<string, number>();
			for (const [signature, count] of Object.entries(raw)) {
				if (typeof count === "number" && Number.isFinite(count) && count > 0) {
					map.set(signature, Math.floor(count));
				}
			}
			return map;
		} catch {
			// Corrupt summary file → fall through to a rebuild from the ledger.
		}
	}
	// Migration: summary missing/corrupt. Build it once from the existing ledger
	// so prior failure counts are preserved (otherwise a signature that already
	// exhausted would be treated as fresh after the switch), and persist it so
	// subsequent reads skip the rebuild.
	return rebuildRuntimeFailureSummaryFromLedger();
}
