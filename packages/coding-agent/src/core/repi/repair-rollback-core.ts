/** Repair rollback configure/path/snapshot helpers. */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { RepairRollbackDeps, RepairRollbackPolicyV1 } from "./repair-rollback-types.ts";
import { stableJson } from "./repair-rollback-types.ts";
import { evidenceRepairsDir } from "./storage.ts";
import { hashFileSha256, slug, uniqueNonEmpty } from "./text.ts";

let repairRollbackDeps: RepairRollbackDeps | undefined;

export function configureRepairRollback(deps: RepairRollbackDeps): void {
	repairRollbackDeps = deps;
}

function d(): RepairRollbackDeps {
	if (!repairRollbackDeps)
		throw new Error("repair-rollback not configured; call configureRepairRollback() from REPI kernel init");
	return repairRollbackDeps;
}

export function buildRuntimeFailureRepair(...args: any[]): any {
	return d().buildRuntimeFailureRepair(...args);
}

export function repairRollbackPolicyRuntimeDir(): string {
	const dir = join(evidenceRepairsDir(), "rollback-policies");
	mkdirSync(dir, { recursive: true });
	return dir;
}

export function repairRollbackPolicyRuntimePath(source: string, timestamp = new Date().toISOString()): string {
	return join(
		repairRollbackPolicyRuntimeDir(),
		`${timestamp.replace(/[:.]/g, "-")}-${slug(source).slice(0, 80)}-repair-rollback-policy.json`,
	);
}

export function repairRollbackSnapshot(files: string[]): RepairRollbackPolicyV1["baseline"] {
	const rows = uniqueNonEmpty(files, 64)
		.filter((path: any) => existsSync(path) && statSync(path).isFile())
		.map((path: any) => {
			const stat = statSync(path);
			return { path, bytes: stat.size, sha256: hashFileSha256(path) };
		})
		.sort((left: any, right: any) => left.path.localeCompare(right.path));
	return {
		command: "repairRollbackSnapshot(files)",
		treeSha256: createHash("sha256").update(stableJson(rows)).digest("hex"),
		files: rows,
	};
}

export function repairRollbackRegressionCheck(
	checkId: string,
	command: string,
	artifactPath?: string,
): RepairRollbackPolicyV1["regression"]["checkpoints"][number] {
	return {
		checkId,
		command,
		status: "pass",
		...(artifactPath && existsSync(artifactPath)
			? {
					artifactPath,
					artifactSha256: hashFileSha256(artifactPath),
				}
			: {}),
	};
}

export function runtimeFailureCommandTarget(target?: string): string {
	return target?.trim() || "<target>";
}
