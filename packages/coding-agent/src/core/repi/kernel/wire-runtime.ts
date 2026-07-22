/**
 * REPI runtime module wiring (configure* bus).
 * Domain slices live in wire-*-modules.ts; factory calls wireRepiRuntimeModules().
 */

import { wireDecisionModules } from "./wire-decision-modules.ts";
import { wireLaneModules } from "./wire-lane-modules.ts";
import { wireOperatorModules } from "./wire-operator-modules.ts";
import { wireProofModules } from "./wire-proof-modules.ts";
import { wireReverseModules } from "./wire-reverse-modules.ts";
import { wireSwarmModules } from "./wire-swarm-modules.ts";

export function wireRepiRuntimeModules(overrides: Record<string, any> = {}): void {
	const o = overrides;
	const pick = <T>(name: string, fallback: T): T => (name in o ? o[name] : fallback);

	wireReverseModules(pick);
	wireOperatorModules(pick);
	wireDecisionModules(pick);
	wireProofModules(pick);
	wireLaneModules(pick);
	wireSwarmModules(pick);
}
