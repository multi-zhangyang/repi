/** Proof-loop pure types. */
export type RepiProofLoopDelegateWorker =
	| "web-authz"
	| "identity"
	| "cloud"
	| "mobile-runtime"
	| "native-runtime"
	| "pwn-exploit"
	| "firmware-dfir"
	| "agentsec"
	| "malware"
	| "reporting"
	| "general";

export type RepiProofLoopGapSource =
	| "compact_resume"
	| "failure_signature"
	| "operator_feedback"
	| "verifier"
	| "compiler"
	| "replayer"
	| "autofix"
	| "checkpoint"
	| "attack_graph"
	| "artifact";

export type RepiProofLoopGapItem = {
	source: RepiProofLoopGapSource;
	text: string;
	worker: RepiProofLoopDelegateWorker;
	sourceArtifacts: string[];
};

export type RepiProofLoopGapClass =
	| "missing_artifact"
	| "contradiction"
	| "replay_failure"
	| "tool_or_dependency"
	| "target_or_state"
	| "runtime_adapter_gap"
	| "proof_spine_seed"
	| "weak_evidence"
	| "timeout_or_flake"
	| "compact_resume"
	| "unknown";

export type RepiProofLoopGapClassification = {
	klass: RepiProofLoopGapClass;
	priority: number;
	action: string;
};

export type RepiProofLoopQuickPlanPhaseV1 = {
	phase:
		| "attack_graph_refresh"
		| "compact_resume_reentry"
		| "toolchain_repair"
		| "target_state_refresh"
		| "runtime_adapter_frontload"
		| "proof_spine"
		| "replay_repair"
		| "contradiction_repair"
		| "delegate_unknown"
		| "final_loop";
	reason: string;
	classes: RepiProofLoopGapClass[];
	commands: string[];
	evidenceRefs: string[];
};

export type RepiProofLoopQuickPlanV1 = {
	kind: "ProofLoopQuickPlanV1";
	schemaVersion: 1;
	target: string;
	classOrder: Array<{
		klass: RepiProofLoopGapClass;
		priority: number;
		count: number;
		workers: RepiProofLoopDelegateWorker[];
		sources: RepiProofLoopGapSource[];
	}>;
	phases: RepiProofLoopQuickPlanPhaseV1[];
	commands: string[];
	omittedCommands: string[];
	finalLoopCommand: string;
	assertions: {
		bounded: boolean;
		deduplicated: boolean;
		runtimeAdapterBeforeReplay: boolean;
		autofixApplyBeforeFinalReplay: boolean;
		finalLoopLast: boolean;
	};
};

export type RepiProofLoopRuntimeAdapterClosureRowV1 = {
	kind: "ProofLoopRuntimeAdapterClosureRowV1";
	schemaVersion: 1;
	adapterId: string;
	status: "needs_adapter_rerun" | "proof_spine_ready";
	missingProofSignals: string[];
	matchedProofSignals: string[];
	sourceArtifacts: string[];
	commands: string[];
};
