/** Write repair rollback baseline snapshot. */

import type { AutofixArtifact } from "./autofix.ts";
import { writePrivateTextFile } from "./storage.ts";
import { runtimeArtifactHashes } from "./swarm-claim-ledger.ts";

export function writeRepairRollbackBaseline(params: {
	autofix: AutofixArtifact;
	autofixArtifactPath: string;
	baselinePath: string;
}): string[] {
	const { autofix, autofixArtifactPath, baselinePath } = params;
	const sourceArtifactHashes = runtimeArtifactHashes([
		autofix.replayArtifact,
		autofix.compilerArtifact,
		...autofix.sourceArtifacts,
	]);
	writePrivateTextFile(
		baselinePath,
		`${JSON.stringify(
			{
				kind: "RepairRollbackBaselineSnapshotV1",
				schemaVersion: 1,
				generatedAt: new Date().toISOString(),
				source: "re_autofix",
				target: autofix.target,
				mode: autofix.mode,
				autofixArtifactPath,
				sourceArtifactHashes,
			},
			null,
			2,
		)}\n`,
	);
	return [
		baselinePath ?? "",
		autofix.replayArtifact ?? "",
		autofix.compilerArtifact ?? "",
		...(autofix.sourceArtifacts ?? []),
	].filter(Boolean) as string[];
}
