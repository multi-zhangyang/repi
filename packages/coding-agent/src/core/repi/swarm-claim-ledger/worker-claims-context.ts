/** Build per-worker claim evaluation context (includes reverse gate). */
import { slug } from "../text.ts";
import type { SwarmClaimLedgerInput } from "./types.ts";
import {
	buildWorkerClaimReverseBlob,
	evaluateWorkerClaimReverseGate,
	type WorkerClaimReverseGate,
} from "./worker-claims-reverse.ts";

export type WorkerClaimContext = {
	executions: any[];
	runtimeManifests: any[];
	runtimeManifestRefs: string[];
	blocked: any[];
	coverageRows: string[];
	missingCoverageRows: string[];
	auditRows: string[];
	claimPassed: boolean;
	reverseGate: WorkerClaimReverseGate;
	claimId: string;
};

export function buildWorkerClaimContext(input: {
	swarm: SwarmClaimLedgerInput;
	worker: any;
	planId: string;
}): WorkerClaimContext {
	const { swarm, worker, planId } = input;
	const executions = swarm.executions.filter((execution: any) => execution.workerId === worker.id);
	const runtimeManifests = (swarm.subagentRuntimeManifests ?? []).filter(
		(manifest: any) => manifest.workerId === worker.id,
	);
	const runtimeManifestRefs = runtimeManifests.flatMap((manifest: any) => [
		manifest.runtimeManifestFile,
		manifest.stdoutPath,
		manifest.stderrPath,
	]);
	const blocked = executions.filter((execution: any) => execution.status === "blocked");
	const coverageRows = ((swarm.coverageMatrix as any[]) ?? []).filter((row: any) =>
		row.includes(`worker=${worker.id}`),
	);
	const missingCoverageRows = coverageRows.filter((row: any) => /status=missing/i.test(row));
	const auditRows = ((swarm.executionAudit as any[]) ?? []).filter((row: any) => row.includes(`worker=${worker.id}`));
	let claimPassed = executions.length > 0 && blocked.length === 0 && missingCoverageRows.length === 0;
	const reverseBlob = buildWorkerClaimReverseBlob({
		route: swarm.route,
		target: swarm.target,
		worker: worker as any,
		executions: executions as any,
	});
	const reverseGate = evaluateWorkerClaimReverseGate(reverseBlob);
	if (reverseGate.blocked) {
		claimPassed = false;
	}
	const claimId = `${planId}:worker:${slug(worker.id).slice(0, 48)}`;
	return {
		executions,
		runtimeManifests,
		runtimeManifestRefs,
		blocked,
		coverageRows,
		missingCoverageRows,
		auditRows,
		claimPassed,
		reverseGate,
		claimId,
	};
}
