/** Pure swarm plan formatter. */

import { formatSwarmHeaderSections } from "./swarm-format-header.ts";
import { formatSwarmRuntimeSections } from "./swarm-format-runtime.ts";
import type { SwarmFormatView } from "./swarm-format-types.ts";

export function formatSwarm(swarm: SwarmFormatView, path?: string): string {
	return [...formatSwarmHeaderSections(swarm, path), ...formatSwarmRuntimeSections(swarm)].filter(Boolean).join("\n");
}
