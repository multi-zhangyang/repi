/** Runtime adapter auto-detect ids from target profile. */
import { inspectRuntimeAdapterTarget } from "./target-inspect-profile.ts";

export function detectRuntimeAdapterIds(target?: string): string[] {
	return inspectRuntimeAdapterTarget(target).adapterIds;
}
