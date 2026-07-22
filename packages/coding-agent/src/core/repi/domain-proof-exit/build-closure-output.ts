/** Domain proof-exit closure output. */

import { writeDomainProofExitClosureArtifact } from "../completion-audit/format.ts";
import { readCurrentMission } from "../mission.ts";
import { buildDomainProofExitClosure } from "./build-closure-core.ts";
import { formatDomainProofExitClosure } from "./pure.ts";

export function buildDomainProofExitClosureOutput(action: "show" | "write" = "show", domainFilter?: string): string {
	const report = buildDomainProofExitClosure(readCurrentMission(), domainFilter);
	if (action === "write") {
		const path = writeDomainProofExitClosureArtifact(report);
		return formatDomainProofExitClosure(report, path);
	}
	return formatDomainProofExitClosure(report);
}
