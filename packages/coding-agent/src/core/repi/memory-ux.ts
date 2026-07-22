/**
 * Memory UX — product lean stubs (memory subsystem removed).
 * Off unless REPI_CONTEXT_MEMORY / REPI_FULL_SURFACE; no-op implementations.
 */
import { envBoolean } from "./text.ts";

export type MemoryUxDeps = {
	appendMemoryEvent?: (...args: any[]) => any;
	[key: string]: any;
};

export function configureMemoryUx(_deps: MemoryUxDeps = {}): void {}

function memoryUxEnabled(): boolean {
	return envBoolean("REPI_CONTEXT_MEMORY") === true || envBoolean("REPI_FULL_SURFACE") === true;
}

export function buildMemoryUxDashboard(
	options: { query?: string; route?: string; target?: string; write?: boolean } = {},
): string {
	if (!memoryUxEnabled()) return "memory_ux_dashboard:\nstatus: disabled\nreason: memory subsystem removed";
	return [
		"memory_ux_dashboard:",
		"status: gated_stub",
		`query: ${options.query ?? ""}`,
		`route: ${options.route ?? ""}`,
		`target: ${options.target ?? ""}`,
		"note: memory subsystem removed from product surface",
	].join("\n");
}

export function findMemoryEventForGovernance(_identifier?: string): any | undefined {
	return undefined;
}

export function applyMemoryUxGovernance(
	_action: any,
	_options: { query?: string; text?: string; title?: string; route?: string } = {},
): string {
	if (!memoryUxEnabled()) return "memory_ux_governance:\nstatus: disabled";
	return "memory_ux_governance:\nstatus: no-op\nnote: memory subsystem removed";
}

export function memoryFileStatusLine(..._args: any[]): string {
	return "memory: removed";
}
export function readMemoryNote(..._args: any[]): string {
	return "";
}
