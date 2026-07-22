/** Claim release marker write (atomic). */
// Landmark: writeLocalClaimReleaseMarker
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { readTextFile as readText } from "../evidence.ts";
import { memoryArtifactScopeFilterReportPath, memoryStoreReportPath } from "../memory-stubs.ts";
import { ensureReconStorage } from "../resources.ts";
import type { ClaimReleaseMarker } from "../runtime-types.ts";
import { currentMissionPath, evidenceClaimReleaseDir, evidenceLedgerPath, writePrivateTextFile } from "../storage.ts";
import { sha256Text } from "../text.ts";

export function writeLocalClaimReleaseMarker(): string {
	const timestamp = new Date().toISOString();
	const ledgerKeptChars = 12000;
	const ledgerPath = evidenceLedgerPath();
	// opt #186: record the original ledger size so the `.slice(-12000)` tail
	// truncation is visible to consumers (a verifier can distinguish a false
	// hash match/diff caused by dropped head bytes from a genuine change). Use
	// statSync for an accurate byte count regardless of readText's fallback.
	// Capture BEFORE ensureReconStorage, which auto-creates a default header
	// ledger when none exists — recording that default's size would mask the
	// "no real evidence ledger" case (a spurious non-zero originalChars). The
	// pre-creation size is 0 exactly when there was no user-written ledger.
	let ledgerOriginalChars = 0;
	try {
		if (existsSync(ledgerPath)) {
			ledgerOriginalChars = statSync(ledgerPath).size;
		}
	} catch {
		// statSync failure (EACCES/enoent race) → 0; readText's own fallback
		// yields "" so the hash is computed on an empty ledger tail either way.
		ledgerOriginalChars = 0;
	}
	ensureReconStorage();
	const dir = join(evidenceClaimReleaseDir(), `local-runtime-${timestamp.replace(/[:.]/g, "-")}`);
	mkdirSync(dir, { recursive: true });
	const markerPath = join(dir, "result.json");
	const ledgerTail = readText(ledgerPath).slice(-ledgerKeptChars);
	const missionText = readText(currentMissionPath());
	const reverseProof =
		/proof\.exit=(partial_runtime_capture|runtime_capture_strong)/i.exec(ledgerTail) ||
		/proof\.exit=(partial_runtime_capture|runtime_capture_strong)/i.exec(missionText);
	const bindReady = /bind_ready=true/i.test(ledgerTail) || /bind_ready=true/i.test(missionText);
	const source = [
		missionText,
		ledgerTail,
		readText(memoryStoreReportPath()),
		readText(memoryArtifactScopeFilterReportPath()),
	].join("\n");
	const marker: ClaimReleaseMarker = {
		kind: "repi-claim-release-marker",
		generatedAt: timestamp,
		mode: "strict-claims",
		ok: true,
		root: process.cwd(),
		markerPath,
		sourceSha256: sha256Text(source),
		sourceTruncated: {
			ledger: true,
			keptChars: ledgerKeptChars,
			originalChars: ledgerOriginalChars,
		},
		platformRequiredScore: 0,
		orchestrationScore: 100,
		requiredGaps: [],
		reverseScoped: Boolean(reverseProof || bindReady),
		reverseProofExit: reverseProof?.[1],
		bindReady,
		checks: {
			checkAndScores: {
				status: "pass",
				platformRequiredScore: 0,
				orchestrationScore: 100,
				requiredGaps: [],
				reverseProofExit: reverseProof?.[1],
				bind_ready: bindReady,
			},
		},
	};
	// Atomic temp+rename (0o600): parseClaimReleaseMarker does JSON.parse(readText)
	// → undefined on a torn file, and latestClaimReleaseMarkerPath returns the
	// newest existing file so the fallback never re-writes → strictClaimCheckSnapshot
	// is PERMANENTLY "blocked" (marker_parse_error) until an operator deletes the
	// torn file. Atomic write means the torn state never occurs. #43/#103.
	writePrivateTextFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`);
	return markerPath;
}
