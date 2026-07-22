/** Artifact scope filter report builder and scoped markdown selection. */

import { artifactScopeInferTarget } from "./artifact-scope-pure.ts";
import type { ArtifactScopeFilterOptions } from "./artifact-scope-types.ts";
import { readCurrentMission } from "./mission.ts";
import { sanitizeTargetForCommand } from "./target.ts";

export { buildArtifactScopeFilterReport } from "./artifact-scope-filter-report.ts";
export { latestScopedMarkdownArtifact, scopedMarkdownArtifacts } from "./artifact-scope-filter-select.ts";

export function artifactScopeDefaultOptions(
	options: ArtifactScopeFilterOptions = {},
): Required<Pick<ArtifactScopeFilterOptions, "requestedBy">> &
	Pick<ArtifactScopeFilterOptions, "route" | "target" | "scanLimit" | "write"> {
	const mission = readCurrentMission();
	return {
		route: options.route ?? mission?.route.domain,
		target: sanitizeTargetForCommand(options.target) ?? artifactScopeInferTarget(mission?.task),
		requestedBy: options.requestedBy ?? "latest_artifact_side_channel",
		scanLimit: options.scanLimit,
		write: options.write,
	};
}
