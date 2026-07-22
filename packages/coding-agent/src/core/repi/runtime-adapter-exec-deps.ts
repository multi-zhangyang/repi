/** Runtime adapter exec deps bus + local helpers. */
import { writePrivateTextFile } from "./storage.ts";

export type RuntimeAdapterExecDeps = {
	appendEvidence: (...args: any[]) => any;
	parseToolIndex: () => Map<string, { present: boolean; path?: string }>;
	commandKnownTools: (command: string) => string[];
	/** Optional atomic writer; falls back to writePrivateTextFile. */
	atomicWriteFileSync?: (path: string, content: string) => void;
};

let runtimeAdapterExecDeps: RuntimeAdapterExecDeps | null = null;

export function configureRuntimeAdapterExec(deps: RuntimeAdapterExecDeps): void {
	runtimeAdapterExecDeps = deps;
}

export function runtimeAdapterExecDepsOrThrow(): RuntimeAdapterExecDeps {
	if (!runtimeAdapterExecDeps) {
		throw new Error("runtime-adapter-exec not configured; call configureRuntimeAdapterExec() from REPI kernel init");
	}
	return runtimeAdapterExecDeps;
}

export function appendEvidence(...args: any[]): any {
	return runtimeAdapterExecDepsOrThrow().appendEvidence(...args);
}
export function parseToolIndex(): Map<string, { present: boolean; path?: string }> {
	return runtimeAdapterExecDepsOrThrow().parseToolIndex();
}
export function commandKnownTools(command: string): string[] {
	return runtimeAdapterExecDepsOrThrow().commandKnownTools(command);
}
export function atomicWriteFileSync(path: string, content: string, _mode?: number): void {
	const d = runtimeAdapterExecDepsOrThrow();
	if (d.atomicWriteFileSync) d.atomicWriteFileSync(path, content);
	else writePrivateTextFile(path, content);
}
