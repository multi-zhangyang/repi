/** Supervisor latest-or-build helper. */

import { buildSupervisor } from "./build.ts";
import { writeSupervisorArtifact } from "./io-write.ts";
import { latestSupervisorArtifactPath, parseSupervisorArtifact } from "./paths.ts";
import type { SupervisorArtifact } from "./types.ts";

export function latestOrBuildSupervisor(options: { target?: string; task?: string } = {}): {
	supervisor: SupervisorArtifact;
	path: string;
} {
	const latest = !options.target && !options.task ? latestSupervisorArtifactPath() : undefined;
	if (latest) {
		const supervisor = parseSupervisorArtifact(latest);
		if (supervisor) return { supervisor, path: latest };
	}
	const supervisor = buildSupervisor({ target: options.target, task: options.task, mode: "review" });
	const path = writeSupervisorArtifact(supervisor);
	return { supervisor, path };
}
