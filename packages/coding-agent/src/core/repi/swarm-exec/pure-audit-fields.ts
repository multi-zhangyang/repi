import { shellQuote } from "../target.ts";
import { applySwarmReverseAuditFields } from "./pure-audit-reverse.ts";
import { swarmContractCovered, swarmWorkerEvidenceText } from "./pure-basics.ts";

type SwarmArtifact = any;
export function deriveSwarmAuditFields(
	swarm: SwarmArtifact,
): Pick<SwarmArtifact, "executionAudit" | "coverageMatrix" | "retryQueue"> {
	const executionAudit: string[] = [];
	const coverageMatrix: string[] = [];
	const retryQueue: string[] = [];
	// Surface reverse technique/mitre/cwe/proof_exit query fields from worker/evidence text.
	const reverseCorpus = [
		swarm.target,
		swarm.route,
		...(swarm.workers ?? []).flatMap((worker: any) => [
			worker.id,
			worker.worker,
			...(worker.evidenceContract ?? []),
			...(worker.commands ?? []),
		]),
		...(swarm.executions ?? []).flatMap((execution: any) => [execution.command, execution.output, execution.status]),
	]
		.filter(Boolean)
		.join("\n");
	applySwarmReverseAuditFields({ reverseCorpus, executionAudit, coverageMatrix, retryQueue });
	const target = swarm.target ?? "<target>";
	for (const worker of swarm.workers) {
		const executions = swarm.executions.filter((execution: any) => execution.workerId === worker.id);
		const done = executions.filter((execution: any) => execution.status === "done").length;
		const blocked = executions.filter((execution: any) => execution.status === "blocked").length;
		const retries = executions.filter((execution: any) => (execution.retryAttempt ?? 1) > 1).length;
		const text = swarmWorkerEvidenceText(swarm, worker);
		const hashes = new Set(text.match(/\b(?:stdout_sha256|stderr_sha256|sha256|hash)=[0-9a-f]{8,64}\b/gi) ?? []);
		const artifacts = new Set(
			text.match(/(?:^|\s)(?:\.\/|\.\.\/|\/tmp\/|\/root\/|\/home\/|[A-Za-z0-9_.-]+\/)[^\s`'"]{3,}/g) ?? [],
		);
		const anchors = new Set(
			text.match(/\[[A-Za-z0-9_.:/-]+\]|anchors?:|artifact=|status=|route=|offset=|RIP|EIP/gi) ?? [],
		);
		const coveredContracts = worker.evidenceContract.filter((contract: any) => swarmContractCovered(text, contract));
		const missingContracts = worker.evidenceContract.filter((contract: any) => !swarmContractCovered(text, contract));
		const auditStatus =
			blocked > 0
				? "needs_repair"
				: executions.length === 0
					? "pending_execution"
					: missingContracts.length
						? "needs_evidence"
						: "covered";
		executionAudit.push(
			[
				`worker=${worker.id}`,
				`role=${worker.worker}`,
				`status=${auditStatus}`,
				`commands=${executions.length}/${worker.commands.length}`,
				`passed=${done}`,
				`blocked=${blocked}`,
				`retries=${retries}`,
				`contract=${coveredContracts.length}/${worker.evidenceContract.length}`,
				`hashes=${hashes.size}`,
				`artifacts=${artifacts.size}`,
				`anchors=${anchors.size}`,
			].join(" "),
		);
		for (const contract of worker.evidenceContract) {
			const covered = swarmContractCovered(text, contract);
			coverageMatrix.push(
				`worker=${worker.id} role=${worker.worker} contract=${shellQuote(contract)} status=${covered ? "covered" : "missing"}`,
			);
		}
		if (executions.length === 0 && worker.status === "ready") {
			retryQueue.push(`worker=${worker.id} reason=no_execution next=re_swarm run ${target} 1 1`);
		}
		for (const execution of executions.filter((item: any) => item.status === "blocked")) {
			retryQueue.push(
				`worker=${worker.id} reason=blocked command=${shellQuote(execution.command)} next=re_swarm run ${target} 1 1`,
			);
		}
		if (executions.length > 0 && missingContracts.length > 0) {
			retryQueue.push(
				`worker=${worker.id} reason=contract_gap missing=${missingContracts
					.slice(0, 3)
					.map((item: any) => shellQuote(item))
					.join(",")} next=re_delegate plan ${target} && re_swarm run ${target} 1 1`,
			);
		}
	}
	return {
		executionAudit: executionAudit.slice(0, 48),
		coverageMatrix: coverageMatrix.slice(0, 96),
		retryQueue: Array.from(new Set(retryQueue)).slice(0, 32),
	};
}
