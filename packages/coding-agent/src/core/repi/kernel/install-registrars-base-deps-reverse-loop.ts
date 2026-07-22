/** Install reverse proof-loop / adapter / toolchain deps. */
import { buildAutofixOutput, latestAutofixArtifactPath } from "../autofix.ts";
import { buildCompilerOutput, latestCompilerArtifactPath } from "../compiler-runtime.ts";
import {
	buildReLaneSpecialistCommandPackGate,
	formatReLaneSpecialistCommandPackGate,
} from "../lanes/specialist-pack-gate.ts";
import { buildProfileCheckOutput, latestProfileCheckArtifactPath } from "../profile-check.ts";
import { buildProofLoopOutput, latestProofLoopArtifactPath, runProofLoop } from "../proof-loop-runtime.ts";
import { buildReplayerOutput, latestReplayerArtifactPath, runReplayer } from "../replayer-runtime.ts";
import { formatRuntimeAdapterExecutionGate } from "../runtime-adapter.ts";
import {
	buildRuntimeAdapterExecutionGate,
	runRuntimeAdapterExecution,
	writeRuntimeAdapterExecutionArtifact,
} from "../runtime-adapter-exec.ts";
import {
	buildToolDigest,
	createBootstrapPlan,
	formatBootstrapPlan,
	installBootstrapTools,
	refreshToolIndex,
} from "../tool-index.ts";
import {
	buildToolchainDomainCapability,
	buildToolchainDomainCapabilityOutput,
	formatToolchainDomainCapability,
	writeToolchainDomainCapabilityArtifact,
} from "../toolchain-runtime.ts";
import { buildVerifierOutput, latestVerifierArtifactPath } from "../verifier-runtime.ts";

export const installBaseReverseLoopDeps = {
	buildAutofixOutput,
	latestAutofixArtifactPath,
	buildCompilerOutput,
	latestCompilerArtifactPath,
	buildProfileCheckOutput,
	latestProfileCheckArtifactPath,
	buildProofLoopOutput,
	latestProofLoopArtifactPath,
	runProofLoop,
	buildReLaneSpecialistCommandPackGate,
	formatReLaneSpecialistCommandPackGate,
	buildReplayerOutput,
	latestReplayerArtifactPath,
	runReplayer,
	buildRuntimeAdapterExecutionGate,
	runRuntimeAdapterExecution,
	writeRuntimeAdapterExecutionArtifact,
	formatRuntimeAdapterExecutionGate,
	buildToolchainDomainCapability,
	buildToolchainDomainCapabilityOutput,
	formatToolchainDomainCapability,
	writeToolchainDomainCapabilityArtifact,
	buildVerifierOutput,
	latestVerifierArtifactPath,
	buildToolDigest,
	createBootstrapPlan,
	formatBootstrapPlan,
	installBootstrapTools,
	refreshToolIndex,
} as const;
