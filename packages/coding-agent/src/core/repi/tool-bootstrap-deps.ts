/** Tool-bootstrap DI. */
export type ToolBootstrapDeps = {
	refreshToolIndex: (...args: any[]) => any;
	upsertMissionCheckpoint: (...args: any[]) => any;
};

let toolBootstrapDeps: ToolBootstrapDeps | null = null;

export function configureToolBootstrap(deps: ToolBootstrapDeps): void {
	toolBootstrapDeps = deps;
}

export function d(): ToolBootstrapDeps {
	if (!toolBootstrapDeps)
		throw new Error("tool-bootstrap not configured; call configureToolBootstrap() from REPI kernel init");
	return toolBootstrapDeps;
}

export function refreshToolIndex(...args: any[]): any {
	return d().refreshToolIndex(...args);
}

export function upsertMissionCheckpoint(...args: any[]): any {
	return d().upsertMissionCheckpoint(...args);
}
