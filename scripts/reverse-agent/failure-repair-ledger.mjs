import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const FAILURE_REPAIR_WRITEBACK = {
	failureLedgerPath: ".pi/evidence/failures/ledger.jsonl",
	repairQueuePath: ".pi/evidence/repairs/queue.jsonl",
	appendOnly: true,
	mode: "offline-runtime-control-plane",
};

export const FAILURE_REPAIR_CONTRACT_MARKERS = ["FailureLedgerEventV1", "RepairQueueItemV1"];

export function sha256Bytes(data) {
	return createHash("sha256").update(data).digest("hex");
}

export function relPath(root, path) {
	const resolvedRoot = resolve(root || ".");
	const value = String(path || "");
	const resolved = value.startsWith("/") ? value : resolve(resolvedRoot, value);
	return resolved.startsWith(resolvedRoot) ? resolved.slice(resolvedRoot.length + 1) : value;
}

export function artifactHash(root, path, tier = "runtime_artifact") {
	if (!path) return null;
	const full = String(path).startsWith("/") ? String(path) : join(root, String(path));
	if (!existsSync(full)) return null;
	const bytes = readFileSync(full);
	const stat = statSync(full);
	return {
		path: relPath(root, full),
		sha256: sha256Bytes(bytes),
		tier,
		bytes: bytes.length,
		mtime: stat.mtime.toISOString(),
	};
}

export function failureRepairFromGap(params) {
	const root = resolve(params.root || ".");
	const source = params.source || "pi-recon-runtime";
	const scope = params.scope || `${source}:gap`;
	const failedGates = (params.failedGates || []).filter(Boolean);
	const reason = params.reason || `failed gates: ${failedGates.join(",") || scope}`;
	const attempt = Math.max(0, Number(params.attempt ?? 1));
	const maxAttempts = Math.max(attempt, Number(params.maxAttempts ?? attempt));
	const remainingAttempts = Math.max(0, maxAttempts - attempt);
	const signature = sha256Bytes(`${source}:${scope}:${failedGates.join(",")}:${reason}`).slice(0, 24);
	const failureId = `fail:${source}:${signature}`;
	const repairId = `repair:${source}:${signature}`;
	const evidenceWriteback = params.evidenceWriteback || { ...FAILURE_REPAIR_WRITEBACK, mode: source };
	const artifactRows = (params.artifacts || [])
		.map((artifact) => (typeof artifact === "string" ? artifactHash(root, artifact, "runtime_artifact") : artifact))
		.filter(Boolean);
	const blockedConditions = [
		{
			reason,
			unblock: params.unblock || (params.commands || [])[0] || `inspect ${source} failed gates`,
		},
	];
	const rollback = {
		required: Boolean(params.rollbackRequired),
		baseline: params.baseline || "git status --short",
		allowlist: params.allowlist || [],
		criteria: params.rollbackCriteria || ["no unrelated file changes", "previous passed gates remain passed"],
		restored: false,
	};
	const retryBudget = {
		retryKey: signature,
		remainingAttempts,
		exhaustedAction: params.exhaustedAction || "queue repair and escalate to operator",
	};
	const failure = {
		id: failureId,
		ts: new Date().toISOString(),
		source,
		scope,
		category: params.category || "contract_gap",
		signature,
		attempt,
		maxAttempts,
		status: params.status || (remainingAttempts > 0 ? "repair_queued" : "exhausted"),
		failedGates,
		artifacts: artifactRows,
		artifactHashes: artifactRows.map(({ path, sha256 }) => ({ path, sha256 })),
		repairId,
		budget: retryBudget,
		retryBudget,
		evidenceWriteback,
		blockedConditions,
		rollback,
	};
	const action = params.action || "rerun";
	const repair = {
		repairId,
		fromFailureId: failureId,
		signature,
		scope,
		action,
		repairAction: action,
		commands: params.commands || [],
		expectedArtifacts: params.expectedArtifacts || artifactRows.map((artifact) => artifact.path),
		expectedGates: failedGates,
		preconditions: {
			liveAllowed: Boolean(params.liveAllowed),
			providerAllowed: Boolean(params.providerAllowed),
			requiredSecrets: params.requiredSecrets || [],
		},
		paused: params.paused ?? !(params.liveAllowed || params.providerAllowed),
		allowlist: rollback.allowlist,
		rollbackCriteria: {
			baseline: rollback.baseline,
			mustRestore: rollback.allowlist,
			verificationCommand: params.verificationCommand || "npm run gate:autonomous-contracts",
		},
		blockedConditions,
		evidenceWriteback,
		regressionGates: params.regressionGates || failedGates,
	};
	return { failure, repair };
}

export function failureRepairFromGaps(params) {
	const failures = [];
	const repairs = [];
	for (const gap of params.gaps || []) {
		const name = gap.name || gap.gate || gap.id || "gap";
		const failedGates = gap.failedGates || [name];
		const { failure, repair } = failureRepairFromGap({
			...params,
			scope: params.scope || `${params.source}:${name}`,
			reason: gap.reason || gap.required || `gate ${name} did not pass`,
			failedGates,
			artifacts: params.artifacts,
		});
		failures.push(failure);
		repairs.push(repair);
	}
	return {
		failureLedgerEvents: failures,
		repairQueue: repairs,
		failureRepairWriteback: params.evidenceWriteback || { ...FAILURE_REPAIR_WRITEBACK, mode: params.source || "pi-recon-runtime" },
	};
}

export function appendFailureRepairWriteback(root, failures, repairs, evidenceWriteback = FAILURE_REPAIR_WRITEBACK) {
	const resolvedRoot = resolve(root || ".");
	const failurePath = join(resolvedRoot, evidenceWriteback.failureLedgerPath);
	const repairPath = join(resolvedRoot, evidenceWriteback.repairQueuePath);
	mkdirSync(dirname(failurePath), { recursive: true });
	mkdirSync(dirname(repairPath), { recursive: true });
	if (failures?.length) {
		const current = existsSync(failurePath) ? readFileSync(failurePath, "utf8") : "";
		writeFileSync(
			failurePath,
			`${current}${current.endsWith("\n") || !current ? "" : "\n"}${failures.map((item) => JSON.stringify(item)).join("\n")}\n`,
			"utf8",
		);
	}
	if (repairs?.length) {
		const current = existsSync(repairPath) ? readFileSync(repairPath, "utf8") : "";
		writeFileSync(
			repairPath,
			`${current}${current.endsWith("\n") || !current ? "" : "\n"}${repairs.map((item) => JSON.stringify(item)).join("\n")}\n`,
			"utf8",
		);
	}
	return { failurePath: relPath(resolvedRoot, failurePath), repairPath: relPath(resolvedRoot, repairPath) };
}
