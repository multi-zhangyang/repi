/** REPI wire bus slice: swarm-modules. */
import type { PickFn } from "./wire-pick.ts";
import { wireDelegateConfigure } from "./wire-swarm-delegate.ts";
import { wireKernelRuntimeConfigure } from "./wire-swarm-kernel-runtime.ts";
import { wireReflectionConfigure } from "./wire-swarm-reflection.ts";
import { wireSwarmRuntimeConfigure } from "./wire-swarm-runtime.ts";
import { wireSupervisorConfigure } from "./wire-swarm-supervisor.ts";

export function wireSwarmModules(pick: PickFn): void {
	wireDelegateConfigure(pick);
	wireSwarmRuntimeConfigure(pick);
	wireKernelRuntimeConfigure(pick);
	wireReflectionConfigure(pick);
	wireSupervisorConfigure(pick);
}
