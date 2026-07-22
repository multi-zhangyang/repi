/** Failure-repair ledger append core. */

import { ensureReconStorage } from "../resources.ts";
import { runtimeFailureLedgerPath, runtimeRepairQueuePath } from "../storage.ts";
import {
	appendText,
	bumpRuntimeFailureSummary,
	rotateRuntimeFailureLedgerIfNeeded,
	rotateRuntimeRepairQueueIfNeeded,
	runtimeFailureCategory,
	runtimeFailureSignature,
} from "./classify.ts";
import { readRuntimeFailureSummary } from "./ledger-read.ts";
import { buildRuntimeFailureRepair } from "./report-build.ts";
import type { FailureLedgerEventV1, RepairQueueItemV1, RuntimeFailureRepairInput } from "./types.ts";

export function appendFailureRepairLedger(params: {
	failures: FailureLedgerEventV1[];
	repairs: RepairQueueItemV1[];
}): void {
	if (!params.failures.length && !params.repairs.length) return;
	ensureReconStorage();
	if (params.failures.length) {
		// Trigger migration BEFORE appending: if the summary file is missing,
		// readRuntimeFailureSummary() rebuilds it from the existing ledger. Doing
		// this after appendText would read a ledger that ALREADY contains the rows
		// we're about to count, then bump would count them again → double count.
		readRuntimeFailureSummary();
		appendText(
			runtimeFailureLedgerPath(),
			`${params.failures.map((item: any) => JSON.stringify(item)).join("\n")}\n`,
		);
		// Count source of truth: bump per-signature counts in the compact summary
		// map, then tail-rotate the audit ledger. Order matters — bump BEFORE
		// rotate so a concurrent runtimeFailureAttempt never sees a stale count.
		bumpRuntimeFailureSummary(params.failures.map((failure: any) => failure.signature));
		rotateRuntimeFailureLedgerIfNeeded();
	}
	if (params.repairs.length) {
		appendText(runtimeRepairQueuePath(), `${params.repairs.map((item: any) => JSON.stringify(item)).join("\n")}\n`);
		// Tail-rotate the repair queue (companion to the failure-ledger rotation
		// above). The repair queue is an append-only audit log of repair actions,
		// read in full by readRuntimeRepairQueueRows for the failure-signature
		// report (which dedups by signature, keeping the latest/best repair — NO
		// per-row count semantics). So dropping old rows is safe: it bounds
		// cross-session disk growth + the O(n) scan, the same class opt #53 fixed
		// for the failure ledger. REPI_REPAIR_QUEUE_MAX_ROWS (default 500, 0 =
		// disable).
		rotateRuntimeRepairQueueIfNeeded();
	}
}

export function appendRuntimeFailureInputs(inputs: RuntimeFailureRepairInput[]): void {
	const failures: FailureLedgerEventV1[] = [];
	const repairs: RepairQueueItemV1[] = [];
	const seen = new Set<string>();
	for (const input of inputs.slice(0, 32)) {
		const category = input.category ?? runtimeFailureCategory(input.reason);
		const signature = runtimeFailureSignature({
			scope: input.scope,
			category,
			command: input.commands?.[0],
			reason: input.reason,
		});
		if (seen.has(signature)) continue;
		seen.add(signature);
		const { failure, repair } = buildRuntimeFailureRepair(input);
		failures.push(failure);
		repairs.push(repair);
	}
	appendFailureRepairLedger({ failures, repairs });
}
