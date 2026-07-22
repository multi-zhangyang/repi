/** Context-pack load state (mission/scope). */

import { readCurrentMission } from "../mission.ts";
import { latestReflectionArtifactPath } from "../reflection.ts";
import { ensureReconStorage } from "../resources.ts";
import { latestSupervisorArtifactPath } from "../supervisor.ts";
import { buildContextPackLoadFields } from "./build-core-load-fields.ts";
import {
	activeLane,
	artifactScopeInferTarget,
	autonomousExecutionBudget,
	latestSwarmRetryQueue,
	parseReflectionArtifact,
	parseSupervisorArtifact,
} from "./deps.ts";

export type ContextPackLoadState = Record<string, any>;

export function buildContextPackLoadState(
	options: { target?: string; mode?: "pack" | "resume"; recordCompactResume?: boolean } = {},
): ContextPackLoadState {
	ensureReconStorage();
	const timestamp = new Date().toISOString();
	const mission = readCurrentMission();
	const active = mission ? activeLane(mission) : undefined;
	const requestedTarget = options.target ?? artifactScopeInferTarget(mission?.task);
	const contextLatestScope = requestedTarget
		? { target: requestedTarget, requestedBy: "context_pack_latest_artifact_consumer" }
		: {};
	const supervisorPath = requestedTarget ? latestSupervisorArtifactPath(contextLatestScope) : undefined;
	const reflectionPath = requestedTarget ? latestReflectionArtifactPath(contextLatestScope) : undefined;
	const supervisor = supervisorPath ? parseSupervisorArtifact(supervisorPath) : undefined;
	const reflection = reflectionPath ? parseReflectionArtifact(reflectionPath) : undefined;
	const target = requestedTarget ?? reflection?.target ?? supervisor?.target;
	return buildContextPackLoadFields({
		timestamp,
		mission,
		active,
		requestedTarget,
		contextLatestScope,
		supervisorPath,
		reflectionPath,
		supervisor,
		reflection,
		target,
		autonomousBudget: autonomousExecutionBudget(target),
		swarmRetry: latestSwarmRetryQueue(target),
		options,
	});
}
