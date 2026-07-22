/** Swarm-exec run DI stubs/config. */
export type SwarmExecDeps = Record<string, never>;

let _swarmExecDeps: SwarmExecDeps | null = null;

export function configureSwarmExec(_deps: SwarmExecDeps = {}): void {
	_swarmExecDeps = _deps;
}
