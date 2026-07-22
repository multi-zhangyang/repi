/** Memory-scope stubs (memory product removed). */
import type { RepiMemoryScope } from "./artifact-scope.ts";

export type MemoryScopeV1 = RepiMemoryScope;
export function currentMemoryScope(..._args: any[]): RepiMemoryScope {
	return {};
}
export function buildCurrentMemoryScope(..._args: any[]): RepiMemoryScope {
	return {};
}
export function memoryRouteMatches(..._args: any[]): boolean {
	return false;
}
export function memoryTargetScope(..._args: any[]): string {
	return "";
}
export function buildMemoryScopeIsolationReport(..._args: any[]): any {
	return { checkedSourceCount: 0, blockedSourceCount: 0, warnSourceCount: 0, quarantinedSourceArtifacts: [] };
}
export function formatMemoryScopeIsolation(..._args: any[]): string {
	return "memory: removed";
}
export function memoryScopeIsolationRow(..._args: any[]): any {
	return {};
}
