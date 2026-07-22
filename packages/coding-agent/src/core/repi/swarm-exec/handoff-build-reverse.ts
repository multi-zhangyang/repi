/** Swarm handoff reverse repair refs. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { uniqueNonEmpty } from "../text.ts";
import { swarmWorkerEvidenceText } from "./pure.ts";

export function swarmHandoffReverseRepairRefs(params: { swarm: any; worker: any; baseRepairRefs: string[] }): string[] {
	const reverseBlob = `${params.worker.workerId ?? ""} ${params.worker.role ?? ""} ${params.worker.status ?? ""} ${swarmWorkerEvidenceText(params.swarm, params.worker.workerId)}`;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: reverseBlob,
				includeGates: true,
			}).slice(0, 2)
		: [];
	return uniqueNonEmpty([...reverseNext, ...params.baseRepairRefs], 16);
}
