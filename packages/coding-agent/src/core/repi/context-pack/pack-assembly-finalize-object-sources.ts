/** Context-pack sourceArtifacts collection for finalize object. */
import { existsSync } from "node:fs";
import { collectContextPackSourceArtifacts } from "./pack-assembly-sources.ts";

export function collectFinalizeObjectSourceArtifacts(params: {
	artifactIndex: any;
	swarmRetry: any;
	autonomousBudget: any;
	compactionResumeTelemetryPath?: any;
	memoryOrchestrator: any;
	memoryDeposition: any;
	memoryExperience: any;
	memorySkillCapsules: any;
	memoryDistillPromotion: any;
	memoryQuality: any;
	memoryReplay: any;
	memoryStrategy: any;
	memoryActiveKernel: any;
	memoryMaturation: any;
	compactResumeLedgerV2: any;
}): any {
	return collectContextPackSourceArtifacts({
		...params,
		existsSync,
	} as any);
}
