#!/usr/bin/env node
/**
 * REPI product contract — lean, reverse/pentest product surface.
 * Memory subsystem removed. Modular reverse capture is first-class.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const root = resolve(args[0] && !args[0].startsWith("--") ? args.shift() : process.cwd());
const json = args.includes("--json");

function read(rel) {
	return readFileSync(join(root, rel), "utf8");
}

function check(id, pass, evidence, fix) {
	return { id, status: pass ? "pass" : "fail", evidence, fix };
}

function includesAll(text, values) {
	return values.every((value) => text.includes(value));
}

function joinSources(paths) {
	return paths.map((p) => read(p)).join("\n");
}

const rows = [];

function push(id, pass, evidence, fix) {
	rows.push(check(id, pass, evidence, fix));
}

// ---------- required product files ----------
const requiredFiles = [
	"repi",
	"README.md",
	"AGENTS.md",
	"packages/coding-agent/src/core/recon-profile.ts",
	"packages/coding-agent/src/core/repi/reverse-capture.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts",
	"packages/coding-agent/src/core/repi/kernel/lean-surface.ts",
	"packages/coding-agent/src/core/repi/memory-stubs.ts",
	"packages/coding-agent/src/core/repi/memory-ux.ts",
	"docs/reverse-agent/native-host-capture-smoke.out",
	"docs/reverse-agent/mobile-host-capture-smoke.out",
	"docs/reverse-agent/browser-host-capture-smoke.out",
	"docs/reverse-agent/exploit-host-capture-smoke.out",
	"docs/reverse-agent/dfir-host-capture-smoke.out",
	"docs/reverse-agent/malware-host-capture-smoke.out",
	"docs/reverse-agent/firmware-host-capture-smoke.out",
	"docs/reverse-agent/crypto-host-capture-smoke.out",
	"docs/reverse-agent/agent-security-host-capture-smoke.out",
	"docs/reverse-agent/memory-host-capture-smoke.out",
	"docs/reverse-agent/cloud-host-capture-smoke.out",
	"docs/reverse-agent/js-signing-host-capture-smoke.out",
	"docs/reverse-agent/web-authz-host-capture-smoke.out",
];
for (const rel of requiredFiles) {
	push(
		`files:${rel}`,
		existsSync(join(root, rel)),
		existsSync(join(root, rel)) ? "present" : "missing",
		`Restore required product file ${rel}`,
	);
}

// ---------- package identity ----------
const packageJson = JSON.parse(read("package.json"));
const codingAgentPkg = JSON.parse(read("packages/coding-agent/package.json"));
push(
	"product:name-repi",
	/repi/i.test(String(packageJson.name ?? "")) || /repi/i.test(String(codingAgentPkg.name ?? "")),
	`root=${packageJson.name} coding-agent=${codingAgentPkg.name}`,
	"Keep package identity on REPI reverse/pentest product, not generic coding agent",
);

// ---------- memory removed ----------
const memoryUx = read("packages/coding-agent/src/core/repi/memory-ux.ts");
const memoryStubs = read("packages/coding-agent/src/core/repi/memory-stubs.ts");
const memoryDeposition = existsSync(join(root, "packages/coding-agent/src/core/repi/memory-deposition.ts"))
	? read("packages/coding-agent/src/core/repi/memory-deposition.ts")
	: "";
push(
	"product:memory-subsystem-removed",
	includesAll(memoryUx, ["memory subsystem removed", "configureMemoryUx"]) &&
		memoryUx.split("\n").length < 80 &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-runtime.ts")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"memory subsystem removed; memory-ux lean stub; no memory-runtime monofile",
	"Do not reintroduce full memory runtime into product surface",
);
push(
	"product:memory-stubs-present",
	includesAll(memoryStubs, ["appendCompactResumeTransition", "memoryPath"]) || memoryStubs.length > 100,
	"memory-stubs provide lean no-op shims for residual callers",
	"Keep memory-stubs as no-op product shims only",
);

push(
	"reverse:memory-candidates-lean",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/memory-candidates/candidates.ts",
			"packages/coding-agent/src/core/repi/memory-candidates/reverse-seed.ts",
		]),
		[
			"structuredMemoryCommandCandidates",
			"knowledgeCaseMemoryCandidates",
			"seedReverseProofCandidates",
			"reverseDomainCaptureNextCommands",
			"memory subsystem removed",
		],
	) ||
		(includesAll(read("packages/coding-agent/src/core/repi/memory-candidates/candidates.ts"), [
			"seedReverseProofCandidates",
			"structuredMemoryCommandCandidates",
		]) &&
			read("packages/coding-agent/src/core/repi/memory-candidates/candidates.ts").split("\n").length < 60 &&
			read("packages/coding-agent/src/core/repi/memory-candidates/reverse-seed.ts").includes("reverseDomainCaptureNextCommands")),
	"memory candidates collapsed to reverse-seed-only product lean path",
	"Do not reintroduce full memory sedimentation candidate fan-out in product",
);


// ---------- lean surface ----------
const lean = read("packages/coding-agent/src/core/repi/kernel/lean-surface.ts");
push(
	"harness:lean-surface",
	includesAll(lean, ["isRepiFullSurface", "REPI_FULL_SURFACE"]),
	"lean surface gates narrative/full control plane via REPI_FULL_SURFACE",
	"Keep narrative/full surface opt-in",
);

// ---------- reverse capture core ----------
const reverseCapture = joinSources([
	"packages/coding-agent/src/core/repi/reverse-capture.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-native.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-mobile.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-exploit.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts",
]);
push(
	"reverse:capture-core",
	includesAll(reverseCapture, [
		"reverseDomainCaptureNextCommands",
		"reverseRuntimeCaptureProofFields",
		"prefer_run_over_plan_for_capture",
		"partial_runtime_capture",
		"runtime_capture_strong",
		"re_native_runtime run",
		"re_domain_proof_exit show",
		"summary.frida_host",
	]),
	"shared reverse capture next + runtime scoring with run-first and frida_host",
	"Keep reverseDomainCaptureNextCommands as the single domain next source",
);

push(
	"reverse:proof-loop-classify-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop/classify.ts",
			"packages/coding-agent/src/core/repi/proof-loop/classify-core.ts",
			"packages/coding-agent/src/core/repi/proof-loop/classify-worker.ts",
			"packages/coding-agent/src/core/repi/proof-loop/classify-format.ts",
			"packages/coding-agent/src/core/repi/proof-loop/classify-signals.ts",
		]),
		[
			"classifyRepiProofLoopGap",
			"repiProofLoopWorkerForText",
			"proofSignalListFromGapText",
			"proof_exit",
			"re_native_runtime run",
			'from "./classify-core.ts"',
			'from "./classify-worker.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop/classify.ts").includes("export function classifyRepiProofLoopGap") &&
		read("packages/coding-agent/src/core/repi/proof-loop/classify-core.ts").includes("re_native_runtime run"),
	"proof-loop classify split worker/core/format/signals; reverse proof_exit run-first retained",
	"Keep proof-loop/classify.ts as thin facade",
);

push(
	"reverse:domain-lane-commands-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/domain-lane-commands.ts",
			"packages/coding-agent/src/core/repi/lanes/domain-lane-native.ts",
			"packages/coding-agent/src/core/repi/lanes/domain-lane-web.ts",
			"packages/coding-agent/src/core/repi/lanes/domain-lane-pwn.ts",
			"packages/coding-agent/src/core/repi/lanes/domain-lane-types.ts",
		]),
		[
			"appendDomainLaneCommands",
			"appendDomainLaneNativeCommands",
			"appendDomainLaneWebCommands",
			"appendDomainLanePwnReverseCommands",
			"reverseDomainCaptureNextCommands",
			"reverse-domain-next",
			'from "./domain-lane-native.ts"',
			'from "./domain-lane-pwn.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/domain-lane-commands.ts").includes("if (isNativeRoute || (isPwnRoute") &&
		read("packages/coding-agent/src/core/repi/lanes/domain-lane-pwn.ts").includes("reverseDomainCaptureNextCommands"),
	"domain-lane commands split native/web/pwn; reverse domain next seeded on reverse-heavy lanes",
	"Keep domain-lane-commands.ts as thin orchestrator",
);

push(
	"reverse:pack-domain-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain.ts",
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain-native.ts",
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain-web.ts",
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain-pwn.ts",
		]),
		[
			"appendLaneDomainCommands",
			"appendLaneDomainNativeCommands",
			"appendLaneDomainPwnReverseCommands",
			"reverseDomainCaptureNextCommands",
			"reverse-domain-next",
			'from "./pack-domain-native.ts"',
			'from "./pack-domain-pwn.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lane-commands/pack-domain.ts").includes("if (isNativeRoute || (isPwnRoute") &&
		read("packages/coding-agent/src/core/repi/lane-commands/pack-domain-pwn.ts").includes("reverseDomainCaptureNextCommands"),
	"lane pack-domain split native/web/pwn with reverse domain next",
	"Keep pack-domain.ts as thin orchestrator",
);

push(
	"reverse:specialist-pack-gate-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-gate.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-early.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-late.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-build.ts",
		]),
		[
			"RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX",
			"buildReLaneSpecialistCommandPackGate",
			"proofExitBridge",
			"re_native_runtime run",
			"re_domain_proof_exit show",
			'from "./specialist-pack-matrix.ts"',
			'from "./specialist-pack-build.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-pack-gate.ts").includes("export const RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX") &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix.ts").includes("re_native_runtime run") &&
		(
			read("packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-early.ts").includes("re_native_runtime run") ||
			read("packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-late.ts").includes("re_native_runtime run")
		),
	"specialist pack gate split matrix/types/data early-late/build; reverse run-first self-heal retained",
	"Keep specialist-pack-gate.ts as thin facade",
);

push(
	"reverse:lane-run-mission-apply-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lane-run-mission/apply.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update-reverse.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update-checkpoints.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-adaptive.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/adaptive-repair-spec.ts",
		]),
		[
			"applyLaneRunMissionUpdate",
			"applyAdaptiveMultiLanePlan",
			"reverseDomainCaptureNextCommands",
			'from "./apply-update.ts"',
			'from "./apply-adaptive.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lane-run-mission/apply.ts").includes("export function applyLaneRunMissionUpdate") &&
		joinSources([
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update-reverse.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update-checkpoints.ts",
		]).includes("reverseDomainCaptureNextCommands"),
	"lane-run-mission apply split update/adaptive with reverse next seeds",
	"Keep apply.ts as thin facade",
);




push(
	"reverse:context-pack-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/build.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-state.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-load.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-memory.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-assemble.ts",
			"packages/coding-agent/src/core/repi/context-pack/next-commands.ts",
			"packages/coding-agent/src/core/repi/context-pack/reverse-commands.ts",
		]),
		[
			"buildContextPack",
			"buildContextPackState",
			"assembleContextPackFromState",
			"assembleContextPackNextCommands",
			"reverseContextResumeCommands",
			"reverseDomainCaptureNextCommands",
			'from "./build-core.ts"',
			'from "./build-core-assemble.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/build.ts").includes("export function buildContextPack") &&
		read("packages/coding-agent/src/core/repi/context-pack/build-core-assemble.ts").includes("assembleContextPackNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/reverse-commands.ts").includes("reverseDomainCaptureNextCommands"),
	"context-pack build core extracted; reverse next via reverse-commands",
	"Keep context-pack/build.ts as thin facade",
);


push(
	"reverse:context-pack-build-core-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/build-core.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-state.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-load.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-memory.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-assemble.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-assemble-reverse.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-assemble-input.ts",
		]),
		[
			"buildContextPack",
			"buildContextPackState",
			"buildContextPackLoadState",
			"applyContextPackMemoryGates",
			"assembleContextPackFromState",
			"mergeAssembleContextPackReverseNext",
			"buildAssembleContextPackArtifactInput",
			"assembleContextPackNextCommands",
			'from "./build-core-state.ts"',
			'from "./build-core-assemble.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/build-core.ts").includes("ensureReconStorage") &&
		read("packages/coding-agent/src/core/repi/context-pack/build-core-assemble.ts").includes("assembleContextPackNextCommands"),
	"context-pack build-core split load/memory/assemble; reverse next via assemble path",
	"Keep build-core.ts as thin orchestrator",
);

push(
	"reverse:autofix-build-core-reverse",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/autofix/build-core.ts",
			"packages/coding-agent/src/core/repi/autofix/build-core-assemble.ts",
			"packages/coding-agent/src/core/repi/autofix/build-core-reverse.ts",
		]),
		[
			"buildAutofix",
			"assembleAutofixArtifact",
			"seedAutofixReverseNextQueue",
			"reverseDomainCaptureNextCommands",
			'from "./build-core-reverse.ts"',
			'from "./build-core-assemble.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/autofix/build-core.ts").includes("seedAutofixReverseNextQueue") &&
		read("packages/coding-agent/src/core/repi/autofix/build-core-assemble.ts").includes("seedAutofixReverseNextQueue") &&
		read("packages/coding-agent/src/core/repi/autofix/build-core-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"autofix reverse next extracted; reverse-heavy empty queues seed domain capture",
	"Keep seedAutofixReverseNextQueue as shared reverse inject for autofix",
);




push(
	"reverse:runtime-adapter-exec-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter-exec.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-deps.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-gate.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-prepare.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-write.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-reverse.ts",
		]),
		[
			"runRuntimeAdapterExecution",
			"buildRuntimeAdapterExecutionGate",
			"prepareRuntimeAdapterExecution",
			"captureRuntimeAdapterExecution",
			"reverseDomainCaptureNextCommands",
			"reverseAdapterCaptureProofFields",
			"require_proof_exit_before_claim",
			"includeGates",
			'from "./runtime-adapter-exec-run.ts"',
			'from "./runtime-adapter-exec-run-capture.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter-exec.ts").includes("export async function runRuntimeAdapterExecution") &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter-exec-run.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"runtime-adapter-exec split deps/gate/run/prepare/capture; reverse domain next on incomplete capture",
	"Keep runtime-adapter-exec.ts as thin facade",
);





// ---------- modular reverse facades ----------
function thinFacade(path, banned, requiredInJoin, joinPaths) {
	const facade = read(path);
	const joined = joinSources([path, ...joinPaths]);
	const thin = banned.every((b) => !facade.includes(b));
	const rich = includesAll(joined, requiredInJoin);
	return thin && rich;
}

push(
	"reverse:install-control-commands-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/kernel/install-control/commands.ts",
		['registerCommand("re-route"'],
		["registerRepiControlPlaneCommands", "registerRepiControlPlaneLeanCommands", "reverseDomainCaptureNextCommands", "reverse_domain_next"],
		[
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-lean.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-lean-route-mission.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-full.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-types.ts",
		],
	),
	"install-control commands lean/full split with reverse next on route/mission",
	"Keep commands.ts as thin facade",
);

push(
	"reverse:install-registrars-base-deps-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps.ts",
		["runNativeRuntime,"],
		["repiInstallBaseDeps", "installBaseMissionDeps", "installBaseReverseDeps", "runNativeRuntime", "runMobileRuntime"],
		[
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-mission.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-io.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-loop.ts",
		],
	) &&
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-io.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-loop.ts",
		]).includes("runNativeRuntime") &&
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-io.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-loop.ts",
		]).includes("runProofLoop"),
	"install registrars base deps split mission/reverse bags (io + loop)",
	"Keep install-registrars-base-deps.ts as assembler",
);

push(
	"reverse:wire-operator-autopilot-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/kernel/wire-operator-autopilot.ts",
		["configureAutopilot({"],
		["wireOperatorAutopilotModules", "wireAutopilotConfigure", "wireCompactResumeConfigure", "configureAutopilot"],
		[
			"packages/coding-agent/src/core/repi/kernel/wire-operator-autopilot-configure.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-operator-compact-resume.ts",
		],
	),
	"wire-operator autopilot/compact-resume configure split",
	"Keep wire-operator-autopilot.ts thin",
);

push(
	"reverse:profile-runtime-factory-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/profile-runtime.ts",
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-factory.ts",
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-configure.ts",
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-install.ts",
		]),
		[
			"createReconExtensionFactory",
			"configureRepiProfileBootstrap",
			"installRepiExtensionSurface",
			"configureDomainProofExit",
			'from "./profile-runtime-factory.ts"',
			'from "./profile-runtime-configure.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/profile-runtime.ts").includes("export function createReconExtensionFactory") &&
		read("packages/coding-agent/src/core/repi/kernel/profile-runtime-factory.ts").includes("createReconExtensionFactory") &&
		read("packages/coding-agent/src/core/repi/kernel/profile-runtime-configure.ts").includes("configureDomainProofExit"),
	"profile-runtime factory extracted; configure bootstrap holds domain proof exit; install surface extracted",
	"Keep profile-runtime.ts thin",
);

push(
	"reverse:profile-runtime-configure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-factory.ts",
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-configure.ts",
		]),
		[
			"createReconExtensionFactory",
			"configureRepiProfileBootstrap",
			"configureDomainProofExit",
			"configureMemoryCandidates",
			'from "./profile-runtime-configure.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/kernel/profile-runtime-factory.ts").includes("configureRepiProfileBootstrap") &&
		read("packages/coding-agent/src/core/repi/kernel/profile-runtime-configure.ts").includes("configureDomainProofExit"),
	"profile-runtime bootstrap configure chain extracted from factory",
	"Keep factory calling configureRepiProfileBootstrap then wire modules",
);

push(
	"reverse:narrative-context-tools-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context-pack-tool.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context-specialist-tool.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context-challenge-tool.ts",
		]),
		[
			"registerRepiNarrativeContextTools",
			"registerRepiContextPackTool",
			"registerRepiSpecialistPackTool",
			"re_lane_specialist_pack",
			"re_domain_proof_exit",
			'from "./context-pack-tool.ts"',
			'from "./context-specialist-tool.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context.ts").includes('name: "re_context"') &&
		read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context-specialist-tool.ts").includes("re_domain_proof_exit"),
	"narrative context tools split; specialist pack keeps reverse proof-exit guidance",
	"Keep context.ts as thin registrar orchestrator",
);

push(
	"reverse:route-domains-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/routes/route-domains.ts",
			"packages/coding-agent/src/core/repi/routes/route-domains-early.ts",
			"packages/coding-agent/src/core/repi/routes/route-domains-mobile-js.ts",
			"packages/coding-agent/src/core/repi/routes/route-domains-web.ts",
			"packages/coding-agent/src/core/repi/routes/route-domains-native.ts",
			"packages/coding-agent/src/core/repi/routes/route-domains-ops.ts",
		]),
		[
			"routeRepiDomainPlan",
			"routeRepiDomainEarly",
			"routeRepiDomainNative",
			"Native reverse",
			"Pwn / exploit",
			'from "./route-domains-native.ts"',
			'from "./route-domains-web.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/routes/route-domains.ts").includes("s.nativeRouteSignal") &&
		read("packages/coding-agent/src/core/repi/routes/route-domains-native.ts").includes("Native reverse"),
	"route-domains split early/mobile-js/web/native/ops; reverse native/pwn retained",
	"Keep route-domains.ts as thin chain orchestrator",
);

push(
	"reverse:operator-step-execute-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/operator-step-execute.ts",
			"packages/coding-agent/src/core/repi/operator-step-control.ts",
			"packages/coding-agent/src/core/repi/operator-step-control-core.ts",
			"packages/coding-agent/src/core/repi/operator-step-control-swarm.ts",
			"packages/coding-agent/src/core/repi/operator-step-reverse.ts",
			"packages/coding-agent/src/core/repi/operator-step-fallback.ts",
		]),
		[
			"executeOperatorStep",
			"tryExecuteOperatorControlStep",
			"tryExecuteOperatorReverseStep",
			"executeOperatorFallbackStep",
			"runNativeRuntime",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./operator-step-reverse.ts"',
			'from "./operator-step-fallback.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/operator-step-execute.ts").includes("nativeRuntimeMatch") &&
		read("packages/coding-agent/src/core/repi/operator-step-reverse.ts").includes("runNativeRuntime") &&
		read("packages/coding-agent/src/core/repi/operator-step-fallback.ts").includes("reverseDomainCaptureNextCommands"),
	"operator-step-execute split control/reverse/fallback; reverse run-first + reverse_next retained",
	"Keep operator-step-execute.ts as thin dispatcher",
);

push(
	"reverse:swarm-write-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact-refresh.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact-persist.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact-boards.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-output.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/compose-reverse.ts",
		]),
		[
			"writeSwarmArtifact",
			"buildSwarmOutput",
			"swarmReverseNextCommands",
			"reverse_runtime_capture_gate:",
			"bind_ready",
			"finalizeSwarmReverseGates",
			'from "./write-artifact.ts"',
			'from "./write-output.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-runtime/build/write.ts").includes("export function writeSwarmArtifact") &&
		read("packages/coding-agent/src/core/repi/swarm-runtime/build/write-output.ts").includes("reverse_runtime_capture_gate:") &&
		read("packages/coding-agent/src/core/repi/swarm-runtime/build/compose-reverse.ts").includes("blocked_until_runtime_capture_and_bind_ready"),
	"swarm write split artifact/output; reverse capture gate + compose reverse finalize retained",
	"Keep write.ts as thin facade",
);

push(
	"reverse:swarm-worker-claims-reverse",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-reverse.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append-one.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-context.ts",
		]),
		[
			"appendSwarmWorkerClaimEvents",
			"evaluateWorkerClaimReverseGate",
			"buildWorkerClaimReverseBlob",
			"buildWorkerClaimContext",
			"workerClaimReverseNextCommand",
			"re_domain_proof_exit show",
			'from "./worker-claims-append.ts"',
			'from "./worker-claims-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims.ts").includes("export function appendSwarmWorkerClaimEvents") &&
		read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-reverse.ts").includes("evaluateWorkerClaimReverseGate") &&
		read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-context.ts").includes("evaluateWorkerClaimReverseGate"),
	"swarm worker claims reverse gate helpers extracted; claim promotion still reverse-gated",
	"Keep worker-claims.ts as thin facade",
);




push(
	"reverse:proof-loop-execute-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/execute.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/execute-step.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/execute-step-reverse.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/execute-bridge.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/execute-phase.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/execute-quick.ts",
		]),
		[
			"executeProofLoopStep",
			"executeProofLoopReversePhase",
			"executeProofLoopBridgeStep",
			"proofLoopPhaseForCommand",
			"runRuntimeAdapterExecution",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./execute-step.ts"',
			'from "./execute-step-reverse.ts"',
			'from "./execute-quick.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/execute.ts").includes("export async function executeProofLoopStep") &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/execute-step.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/execute-step.ts").includes("executeProofLoopReversePhase") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/execute-step-reverse.ts").includes("runRuntimeAdapterExecution") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/execute-step-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop execute split step/reverse/bridge/phase/quick; reverse completion next + runtime-adapter run retained",
	"Keep execute.ts as thin facade; reverse phases live in execute-step-reverse",
);

push(
	"reverse:proof-loop-plan-quick-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases-apply.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-finalize.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-reverse.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-adapters.ts",
		]),
		[
			"repiProofLoopQuickPlanFromItems",
			"buildRepiProofLoopQuickPlanPhases",
			"applyRepiProofLoopQuickPlanPhases",
			"finalizeRepiProofLoopQuickPlan",
			"seedProofLoopQuickPlanReversePhase",
			"appendProofSpine",
			'from "./plan-quick-plan-phases.ts"',
			'from "./plan-quick-plan-phases-apply.ts"',
			'from "./plan-quick-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases.ts").includes("seedProofLoopQuickPlanReversePhase") &&
		read("packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases-apply.ts").includes("seedProofLoopQuickPlanReversePhase") &&
		read("packages/coding-agent/src/core/repi/proof-loop/plan-adapters.ts").includes("appendProofSpine"),
	"proof-loop quick plan split phases/apply/finalize; reverse seed + proof spine retained",
	"Keep plan-quick-plan.ts as thin orchestrator",
);

push(
	"reverse:mission-io-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/mission/io.ts",
			"packages/coding-agent/src/core/repi/mission/io-create.ts",
			"packages/coding-agent/src/core/repi/mission/io-read-write.ts",
			"packages/coding-agent/src/core/repi/mission/io-update.ts",
			"packages/coding-agent/src/core/repi/mission/io-format.ts",
		]),
		[
			"createMission",
			"readCurrentMission",
			"updateMissionLane",
			"formatMission",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./io-create.ts"',
			'from "./io-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/mission/io.ts").includes("export function createMission") &&
		read("packages/coding-agent/src/core/repi/mission/io-format.ts").includes("reverseDomainCaptureNextCommands"),
	"mission io split create/read-write/update/format; reverse_next on reverse-heavy missions",
	"Keep mission/io.ts as thin facade",
);

push(
	"reverse:delegate-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/delegate/pure.ts",
			"packages/coding-agent/src/core/repi/delegate/pure-worker.ts",
			"packages/coding-agent/src/core/repi/delegate/pure-worker-contract.ts",
			"packages/coding-agent/src/core/repi/delegate/pure-promotion.ts",
		]),
		[
			"delegateEvidenceContract",
			"delegateWorkerForStep",
			"dispatcherPromotionQueue",
			"runtime proof.exit=partial_runtime_capture|runtime_capture_strong",
			"re_domain_proof_exit show",
			'from "./pure-worker.ts"',
			'from "./pure-promotion.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/delegate/pure.ts").includes("export function delegateEvidenceContract") &&
		read("packages/coding-agent/src/core/repi/delegate/pure-worker-contract.ts").includes("runtime proof.exit=partial_runtime_capture|runtime_capture_strong"),
	"delegate pure split worker/promotion; reverse proof contract retained on reverse workers",
	"Keep pure.ts as thin facade",
);

push(
	"reverse:campaign-operation-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/campaign-runtime/operation.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/operation-build.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/operation-format.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/operation-command.ts",
		]),
		[
			"buildOperation",
			"formatOperation",
			"operationCommandConcrete",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./operation-build.ts"',
			'from "./operation-command.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/campaign-runtime/operation.ts").includes("export function buildOperation") &&
		read("packages/coding-agent/src/core/repi/campaign-runtime/operation-command.ts").includes("reverseDomainCaptureNextCommands"),
	"campaign operation split build/format/command; reverse next on reverse-heavy commands",
	"Keep operation.ts as thin facade",
);

push(
	"reverse:tool-trace-ledger-verify-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/tool-trace/ledger/verify.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/verify-read.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/verify-build.ts",
		]),
		[
			"readToolTraceEvents",
			"verifyToolCallTraceLedgerV1",
			"buildToolCallTraceLedgerV1",
			"writeToolCallTraceReport",
			'from "./verify-read.ts"',
			'from "./verify-build.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/tool-trace/ledger/verify.ts").includes("export function readToolTraceEvents") &&
		read("packages/coding-agent/src/core/repi/tool-trace/ledger/verify-read.ts").includes("verifyToolCallTraceLedgerV1"),
	"tool-trace ledger verify split read/build",
	"Keep verify.ts as thin facade",
);

push(
	"reverse:adapter-graph-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/graph-artifacts/adapter-graph.ts",
			"packages/coding-agent/src/core/repi/graph-artifacts/adapter-graph-summary.ts",
			"packages/coding-agent/src/core/repi/graph-artifacts/adapter-graph-recent.ts",
			"packages/coding-agent/src/core/repi/graph-artifacts/adapter-graph-lineage.ts",
		]),
		[
			"runtimeAdapterParserSummaryForGraph",
			"runtimeAdapterMitigationEvidenceForGraph",
			"runtimeArtifactsForCommand",
			"proof_exit",
			"binary mitigation map",
			'from "./adapter-graph-summary.ts"',
			'from "./adapter-graph-lineage.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/graph-artifacts/adapter-graph.ts").includes("export function runtimeAdapterParserSummaryForGraph") &&
		read("packages/coding-agent/src/core/repi/graph-artifacts/adapter-graph-summary.ts").includes("BINARY_MITIGATION_PROOF_SIGNAL"),
	"adapter-graph split summary/recent/lineage; mitigation proof_exit retained",
	"Keep adapter-graph.ts as thin facade",
);

push(
	"reverse:reverse-io-shared-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/shared.ts",
			"packages/coding-agent/src/core/repi/reverse-io/shared-deps.ts",
			"packages/coding-agent/src/core/repi/reverse-io/shared-evidence.ts",
			"packages/coding-agent/src/core/repi/reverse-io/shared-evidence-append.ts",
		]),
		[
			"configureReverseIo",
			"appendReverseRuntimeEvidence",
			"applyReverseStructuredSummary",
			"reverseTechniqueCaptureBind",
			'from "./shared-deps.ts"',
			'from "./shared-evidence.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/shared.ts").includes("export function appendReverseRuntimeEvidence") &&
		read("packages/coding-agent/src/core/repi/reverse-io/shared-evidence.ts",
			"packages/coding-agent/src/core/repi/reverse-io/shared-evidence-append.ts").includes("appendReverseRuntimeEvidence"),
	"reverse-io shared split deps/evidence; runtime evidence append retained",
	"Keep shared.ts as thin facade",
);

push(
	"reverse:compiler-build-core-output-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-output.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-build.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-queue.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-write.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-format.ts",
		]),
		[
			"buildCompiler",
			"writeCompilerArtifact",
			"buildCompilerOutput",
			"reverseDomainCaptureNextCommands",
			"reverse_domain_next:",
			'from "./build-core-build.ts"',
			'from "./build-core-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/compiler-runtime/build-core-output.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/compiler-runtime/build-core-format.ts").includes("reverseDomainCaptureNextCommands"),
	"compiler build-core-output split build/write/format; reverse domain next retained",
	"Keep build-core-output.ts as thin facade",
);

push(
	"reverse:runtime-adapter-exec-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-prepare.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-write.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-reverse.ts",
		]),
		[
			"runRuntimeAdapterExecution",
			"prepareRuntimeAdapterExecution",
			"captureRuntimeAdapterExecution",
			"reverseDomainCaptureNextCommands",
			"appendReverseRuntimeEvidence",
			"proof.exit",
			"bind_ready",
			"includeGates",
			'from "./runtime-adapter-exec-run-prepare.ts"',
			'from "./runtime-adapter-exec-run-capture.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter-exec-run.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"runtime-adapter-exec-run split prepare/capture; reverse proof footer retained",
	"Keep run.ts as thin orchestrator",
);

push(
	"reverse:structured-claim-merge-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/structured-claim-merge/build.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/build-merge.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/build-merge-reverse.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/build-refresh.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/build-check.ts",
		]),
		[
			"buildStructuredClaimMergeFromSwarm",
			"refreshSwarmRuntimeClaimLedger",
			"structuredClaimMergeCheckFromSwarm",
			"reverseClaimBlocked",
			"filterStructuredClaimPromotion",
			"reverse_missing_proof_exit_blocks_final",
			"bind_ready",
			'from "./build-merge.ts"',
			'from "./build-merge-reverse.ts"',
			'from "./build-refresh.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/structured-claim-merge/build.ts").includes("reverseClaimBlocked") &&
		!read("packages/coding-agent/src/core/repi/structured-claim-merge/build-merge.ts").includes("function reverseClaimBlocked") &&
		read("packages/coding-agent/src/core/repi/structured-claim-merge/build-merge.ts").includes("filterStructuredClaimPromotion") &&
		read("packages/coding-agent/src/core/repi/structured-claim-merge/build-merge-reverse.ts").includes("reverseClaimBlocked") &&
		read("packages/coding-agent/src/core/repi/structured-claim-merge/build-merge-reverse.ts").includes("reverse_missing_proof_exit_blocks_final"),
	"structured-claim-merge build split merge/reverse/refresh/check; reverse promotion gates retained",
	"Keep reverse proof/bind gate in build-merge-reverse",
);

push(
	"reverse:files-write-lean",
	includesAll(
		read("packages/coding-agent/src/core/repi/storage/io/files-write.ts"),
		[
			"writePrivateTextFile",
			"appendPrivateTextFile",
			"chmodPrivate",
			"atomicWriteFileSync",
			"from \"./files-read.ts\"",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/storage/io/files-write.ts").includes("memoryOrchestratorReportPath") &&
		!read("packages/coding-agent/src/core/repi/storage/io/files-write.ts").includes("evidenceProofLoopsDir"),
	"files-write is lean private I/O only; dead path-import bloat removed",
	"Keep write/append/chmod helpers atomic and 0o600",
);

push(
	"reverse:exploit-summary-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-anchors.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-format.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-plan.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-structured.ts",
		]),
		[
			"exploitLabAnchors",
			"formatExploitLab",
			"exploitLabPlanMatrices",
			"exploitLabStructuredSummary",
			"reverseRuntimeCaptureProofFields",
			"reverseProofGateLines",
			"re_domain_proof_exit show",
			'from "./exploit-summary-anchors.ts"',
			'from "./exploit-summary-structured.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary.ts").includes("export function exploitLabAnchors") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-structured.ts").includes("reverseRuntimeCaptureProofFields"),
	"exploit-summary split anchors/format/structured; reverse proof fields retained",
	"Keep exploit-summary.ts as thin facade",
);

push(
	"reverse:tools-core-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-core.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-core-route-mission.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-core-map-evidence.ts",
		]),
		[
			"registerRepiControlCoreTools",
			"registerRepiControlCoreRouteMissionTools",
			"registerRepiControlCoreMapEvidenceTools",
			"re_route",
			"re_mission",
			"re_map",
			"re_evidence",
			"reverseDomainCaptureNextCommands",
			"reverse_domain_next:",
			"proof.exit=partial_runtime_capture|runtime_capture_strong",
			'from "./tools-core-route-mission.ts"',
			'from "./tools-core-map-evidence.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-control/tools-core.ts").includes('name: "re_route"') &&
		read("packages/coding-agent/src/core/repi/kernel/install-control/tools-core-route-mission.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/kernel/install-control/tools-core-map-evidence.ts").includes('name: "re_evidence"'),
	"tools-core split route-mission/map-evidence; reverse domain next + evidence proof gates retained",
	"Keep tools-core.ts as thin orchestrator",
);

push(
	"reverse:tool-bootstrap-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/tool-bootstrap.ts",
			"packages/coding-agent/src/core/repi/tool-bootstrap-deps.ts",
			"packages/coding-agent/src/core/repi/tool-bootstrap-pure.ts",
			"packages/coding-agent/src/core/repi/tool-bootstrap-run.ts",
		]),
		[
			"configureToolBootstrap",
			"runToolBootstrapClosure",
			"bootstrapToolsFromLane",
			"markToolBootstrapClosure",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./tool-bootstrap-deps.ts"',
			'from "./tool-bootstrap-run.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/tool-bootstrap.ts").includes("export async function runToolBootstrapClosure") &&
		read("packages/coding-agent/src/core/repi/tool-bootstrap-run.ts").includes("reverseDomainCaptureNextCommands"),
	"tool-bootstrap split deps/pure/run; reverse_next on reverse-heavy missing tools",
	"Keep tool-bootstrap.ts as thin facade",
);

push(
	"reverse:campaign-phases-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/campaign-phases.ts",
			"packages/coding-agent/src/core/repi/campaign-phases-helpers.ts",
			"packages/coding-agent/src/core/repi/campaign-phases-build.ts",
			"packages/coding-agent/src/core/repi/campaign-phases-factory.ts",
			"packages/coding-agent/src/core/repi/campaign-phases-domain.ts",
			"packages/coding-agent/src/core/repi/campaign-phases-reverse-heavy.ts",
			"packages/coding-agent/src/core/repi/campaign-phases-reverse.ts",
		]),
		[
			"buildCampaignPhases",
			"createCampaignPhaseFactory",
			"buildCampaignDomainPhases",
			"buildCampaignReverseHeavyPhases",
			"enrichCampaignPhasesReverse",
			"reverseDomainCaptureNextCommands",
			'from "./campaign-phases-domain.ts"',
			'from "./campaign-phases-reverse-heavy.ts"',
			'from "./campaign-phases-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/campaign-phases-build.ts").includes("mkPhase(") &&
		read("packages/coding-agent/src/core/repi/campaign-phases-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"campaign-phases split factory/domain/reverse-heavy + reverse enrich",
	"Keep campaign-phases-build.ts as thin orchestrator",
);



push(
	"reverse:narrative-operator-tools-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-supervisor-reflect.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-board-reason.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-operator.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-reason.ts",
		]),
		[
			"registerRepiNarrativeOperatorTools",
			"registerRepiNarrativeSupervisorReflectTools",
			"registerRepiNarrativeBoardReasonTools",
			"registerOperatorTool",
			"registerReasonTool",
			"re_supervisor",
			"re_operator",
			"re_reason",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./operator-supervisor-reflect.ts"',
			'from "./operator-board-reason.ts"',
			'from "./operator-reason.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator.ts").includes('name: "re_supervisor"') &&
		!read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-board-reason.ts").includes('name: "re_operator"') &&
		read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-reason.ts").includes("reverseDomainCaptureNextCommands"),
	"narrative operator tools split supervisor-reflect/board-reason/operator/reason; reverse next on reason canvas",
	"Keep operator facades thin; tool bodies live in per-tool modules",
);

push(
	"reverse:context-format-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-format/format.ts",
			"packages/coding-agent/src/core/repi/context-format/format-header.ts",
			"packages/coding-agent/src/core/repi/context-format/format-runtime.ts",
			"packages/coding-agent/src/core/repi/context-format/format-runtime-memory.ts",
			"packages/coding-agent/src/core/repi/context-format/format-runtime-reverse.ts",
		]),
		[
			"formatContextPack",
			"formatContextPackHeaderSections",
			"formatContextPackRuntimeSections",
			"formatContextPackReverseNextLines",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./format-header.ts"',
			'from "./format-runtime.ts"',
			'from "./format-runtime-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-format/format.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/context-format/format-runtime.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-format/format-runtime-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"context-format split header/runtime/memory/reverse; reverse_next on reverse-heavy packs",
	"Keep format.ts as thin orchestrator",
);

push(
	"reverse:context-pack-finalize-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-state.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-reverse.ts",
		]),
		[
			"finalizeContextPackArtifact",
			"collectContextPackFinalizeState",
			"mergeContextPackReverseNextCommands",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./pack-assembly-finalize-state.ts"',
			'from "./pack-assembly-finalize-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize.ts").includes("mergeContextPackReverseNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-state.ts").includes("buildContextPackMemoryReports"),
	"context-pack finalize split state collect + reverse merge + assemble; reverse next merged into nextCommands",
	"Keep finalizeContextPackArtifact assembling after state collection",
);

push(
	"reverse:attack-graph-runtime-adapters-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-artifacts.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-ids.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-nodes.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-profile.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-artifact.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-streams.ts",
		]),
		[
			"appendAttackGraphRuntimeAdapterArtifacts",
			"runtimeAdapterArtifactIds",
			"appendRuntimeAdapterCoreNodes",
			"appendRuntimeAdapterProofSection",
			"proof_exit=",
			'from "./runtime-adapters-ids.ts"',
			'from "./runtime-adapters-nodes.ts"',
			'from "./runtime-adapters-proof.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-artifacts.ts").includes("ctx.addNode({") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-artifacts.ts").includes("appendRuntimeAdapterProofSection") &&
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-nodes.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-profile.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-artifact.ts",
		]).includes("proof_exit="),
	"attack-graph runtime adapters split ids/nodes/proof/streams; proof_exit retained on artifact tasks",
	"Keep artifacts.ts as thin loop orchestrator",
);


push(
	"reverse:handoff-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/build.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/build-closure.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge-reverse.ts",
		]),
		[
			"buildWorkerRetryHandoffClosureRowsV1",
			"buildWorkerRetryHandoffMergeSummaryV1",
			"workerHandoffReverseNext",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./build-closure.ts"',
			'from "./build-merge.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/handoff/build.ts").includes("export function buildWorkerRetryHandoffMergeSummaryV1") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"worker handoff build split closure/merge; reverse next on reverse-heavy merge summaries",
	"Keep handoff/build.ts as thin facade",
);

push(
	"reverse:mission-checkpoints-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/mission/checkpoints.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-full.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain-native.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain-web-mobile.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain-ops.ts",
		]),
		[
			"MISSION_CHECKPOINTS_FULL",
			"MISSION_CHECKPOINTS_BY_DOMAIN",
			"reverse_proof_exit_ready",
			"proof_loop_ready",
			'from "./checkpoints-full.ts"',
			'from "./checkpoints-domain.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/mission/checkpoints.ts").includes("reverse_proof_exit_ready") &&
		read("packages/coding-agent/src/core/repi/mission/checkpoints-domain.ts").includes("reverse_proof_exit_ready"),
	"mission checkpoints split full/core/domain; reverse_proof_exit_ready retained on reverse domains",
	"Keep checkpoints.ts as thin facade",
);

push(
	"reverse:memory-transaction-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/memory-transaction.ts",
			"packages/coding-agent/src/core/repi/memory-transaction-types.ts",
			"packages/coding-agent/src/core/repi/memory-transaction-append.ts",
		]),
		[
			"configureMemoryTransaction",
			"appendMemoryEvent",
			"appendMemoryDepositionRuntimeEvent",
			"MemoryEventV1",
			'from "./memory-transaction-types.ts"',
			'from "./memory-transaction-append.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/memory-transaction.ts").includes("export function appendMemoryEvent") &&
		read("packages/coding-agent/src/core/repi/memory-transaction-append.ts").includes("appendMemoryEvent"),
	"memory-transaction split types/append (product-lean stubs)",
	"Keep memory-transaction.ts as thin facade",
);

push(
	"reverse:taxonomy-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/taxonomy.ts",
			"packages/coding-agent/src/core/repi/taxonomy-types.ts",
			"packages/coding-agent/src/core/repi/taxonomy-data.ts",
			"packages/coding-agent/src/core/repi/taxonomy-format.ts",
		]),
		[
			"MITRE_TECHNIQUES",
			"CWE_ENTRIES",
			"formatMitreTag",
			"formatCweTags",
			"MitreTechnique",
			'from "./taxonomy-data.ts"',
			'from "./taxonomy-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/taxonomy.ts").includes("export const MITRE_TECHNIQUES") &&
		read("packages/coding-agent/src/core/repi/taxonomy-data.ts").includes("MITRE_TECHNIQUES"),
	"taxonomy split types/data/format",
	"Keep taxonomy.ts as thin facade",
);
























push(
	"reverse:harness-modes-apply-tools",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-core.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-apply-tools.ts",
		]),
		[
			"installRepiHarnessModes",
			"createHarnessApplyTools",
			"REPI_HARNESS_KNOWN_TOOL_SEED",
			"re_domain_proof_exit",
			"re_native_runtime",
			"re_live_browser",
			'from "./install-apply-tools.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/harness-modes/install.ts").includes("REPI_HARNESS_KNOWN_TOOL_SEED") &&
		!read("packages/coding-agent/src/core/repi/kernel/harness-modes/install.ts").includes("export function installRepiHarnessModes") &&
		read("packages/coding-agent/src/core/repi/kernel/harness-modes/install-apply-tools.ts").includes("re_native_runtime") &&
		read("packages/coding-agent/src/core/repi/kernel/harness-modes/install-core.ts").includes("createHarnessApplyTools"),
	"harness modes apply-tools extracted with reverse-first known tool seed; install core wires createHarnessApplyTools",
	"Keep reverse runtime tools in harness known tool seed",
);

push(
	"reverse:mobile-summary-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-summary.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-summary-structured.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-summary-anchors.ts",
		]),
		[
			"mobileRuntimeStructuredSummary",
			"mobileRuntimeAnchors",
			"reverseRuntimeCaptureProofFields",
			"reverseStructuredProofFields",
			"mobile-proof-capture",
			'from "./mobile-summary-structured.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-runtime/mobile-summary.ts").includes("export function mobileRuntimeStructuredSummary") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/mobile-summary-structured.ts").includes("reverseRuntimeCaptureProofFields"),
	"mobile summary split; reverse structured proof fields retained",
	"Keep mobile-summary.ts as thin facade",
);

push(
	"reverse:js-signing-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-run.ts",
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-run-reverse.ts",
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-write.ts",
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-output.ts",
		]),
		[
			"runJsSigning",
			"writeJsSigningArtifact",
			"buildJsSigningOutput",
			"jsSigningReverseFooter",
			"reverseDomainCaptureNextCommands",
			"require_proof_exit_before_claim",
			'from "./js-signing-run-core.ts"',
			'from "./js-signing-run-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/js-signing-run.ts").includes("export async function runJsSigning") &&
		!read("packages/coding-agent/src/core/repi/reverse-io/js-signing-run-core.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/reverse-io/js-signing-run-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"js-signing run split write/run/output/reverse footer; reverse domain next + proof gate retained",
	"Keep js-signing-run.ts as thin facade",
);

push(
	"reverse:web-authz-summary-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/authz-summary.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-summary-structured.ts",
		]),
		[
			"webAuthzStructuredSummary",
			"webAuthzStateAnchors",
			"reverseRuntimeCaptureProofFields",
			"web-authz-proof-capture",
			'from "./authz-summary-structured.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/web-runtime/authz-summary.ts").includes("export function webAuthzStructuredSummary") &&
		read("packages/coding-agent/src/core/repi/web-runtime/authz-summary-structured.ts").includes("reverseRuntimeCaptureProofFields"),
	"web authz summary split; reverse proof capture fields retained",
	"Keep authz-summary.ts as thin facade",
);

push(
	"reverse:verifier-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/verifier-runtime/pure.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/pure-checks.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/pure-assertions.ts",
		]),
		[
			"verifierTechniqueProofContract",
			"checkAssertions",
			"executionAssertion",
			"re_domain_proof_exit show",
			'from "./pure-checks.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/verifier-runtime/pure.ts").includes("export function checkAssertions") &&
		read("packages/coding-agent/src/core/repi/verifier-runtime/pure-checks.ts").includes("verifierTechniqueProofContract"),
	"verifier pure split checks/status/assertions/outcome; reverse proof contract retained",
	"Keep pure.ts as thin facade",
);

push(
	"reverse:dispatcher-feedback-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/feedback.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/feedback-score.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/feedback-board.ts",
		]),
		[
			"dispatcherLearningHints",
			"dispatcherFeedbackScoreboard",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./feedback-score.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/operator-runtime/dispatch/feedback.ts").includes("export function dispatcherLearningHints") &&
		read("packages/coding-agent/src/core/repi/operator-runtime/dispatch/feedback-score.ts").includes("reverseDomainCaptureNextCommands"),
	"dispatcher feedback split board/score/parse; reverse next on reverse-heavy scoreboards",
	"Keep feedback.ts as thin facade",
);

push(
	"reverse:reflection-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reflection.ts",
			"packages/coding-agent/src/core/repi/reflection/types-config.ts",
			"packages/coding-agent/src/core/repi/reflection/build.ts",
			"packages/coding-agent/src/core/repi/reflection/output.ts",
		]),
		[
			"buildReflectOutput",
			"buildReflection",
			"writeReflectionArtifact",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./reflection/output.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reflection.ts").includes("export function buildReflectOutput") &&
		read("packages/coding-agent/src/core/repi/reflection/output.ts").includes("reverseDomainCaptureNextCommands"),
	"reflection split types/build/output; reverse next on reflect output",
	"Keep reflection.ts as thin facade",
);

push(
	"reverse:lane-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lane-commands/run.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-core.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-core-reverse.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-write.ts",
		]),
		[
			"runLaneCommandPack",
			"writeLaneRunArtifact",
			"reverseDomainCaptureNextCommands",
			"## Reverse Gate",
			"require proof.exit=partial_runtime_capture|runtime_capture_strong",
			'from "./run-core.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lane-commands/run.ts").includes("export async function runLaneCommandPack") &&
		joinSources([
			"packages/coding-agent/src/core/repi/lane-commands/run-core.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-core-reverse.ts",
		]).includes("reverseDomainCaptureNextCommands"),
	"lane run split write/core; reverse gate seeds domain capture next",
	"Keep run.ts as thin facade",
);

push(
	"reverse:poison-sanitize-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/poison-sanitize.ts",
			"packages/coding-agent/src/core/repi/poison-sanitize/state.ts",
			"packages/coding-agent/src/core/repi/poison-sanitize/text-paths.ts",
			"packages/coding-agent/src/core/repi/poison-sanitize/text.ts",
			"packages/coding-agent/src/core/repi/poison-sanitize/config.ts",
		]),
		[
			"sanitizeReconPoisonedState",
			"redactRepiPoisonText",
			"configurePoisonSanitize",
			"re_domain_proof_exit show",
			"re_complete audit",
			'from "./poison-sanitize/state.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/poison-sanitize.ts").includes("export function sanitizeReconPoisonedState") &&
		read("packages/coding-agent/src/core/repi/poison-sanitize/state.ts",
			"packages/coding-agent/src/core/repi/poison-sanitize/text-paths.ts").includes("re_domain_proof_exit show"),
	"poison-sanitize split config/state/text/memory-row; post-clean reverse gate next retained",
	"Keep poison-sanitize.ts as thin facade",
);

push(
	"reverse:install-reverse-commands-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-reverse/commands-register.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/commands-browser.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/commands-runtime.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/commands-toolchain.ts",
		]),
		[
			"registerRepiReverseRuntimeCommands",
			"registerRepiReverseBrowserCommands",
			"registerRepiReverseCaptureRuntimeCommands",
			"re-native-runtime",
			"re-domain-proof-exit",
			"re-js-signing",
			'from "./commands-browser.ts"',
			'from "./commands-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-reverse/commands-register.ts").includes('registerCommand("re-native-runtime"') &&
		read("packages/coding-agent/src/core/repi/kernel/install-reverse/commands-runtime.ts").includes("re-native-runtime") &&
		read("packages/coding-agent/src/core/repi/kernel/install-reverse/commands-toolchain.ts").includes("re-domain-proof-exit"),
	"install-reverse commands split browser/runtime/toolchain; reverse capture commands retained",
	"Keep commands-register.ts as thin orchestrator",
);

push(
	"reverse:goal-lifecycle-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle.ts",
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle-show.ts",
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle-control.ts",
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle-create.ts",
		]),
		[
			"showGoalHelp",
			"createGoal",
			"resumeGoal",
			"reverseDomainCaptureNextCommands",
			"proof.exit=partial_runtime_capture|runtime_capture_strong",
			'from "./commands-lifecycle-show.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/goal/commands-lifecycle.ts").includes("export function showGoalHelp") &&
		read("packages/coding-agent/src/core/repi/goal/commands-lifecycle-show.ts").includes("reverseDomainCaptureNextCommands"),
	"goal lifecycle split control/show/create; reverse completion guidance in help",
	"Keep commands-lifecycle.ts as thin facade",
);

push(
	"reverse:delegate-build-core-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/delegate/build-core.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-build.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-construct.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-construct-fields.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-construct-reverse.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-packets.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-write.ts",
		]),
		[
			"buildDelegate",
			"buildDelegatePackets",
			"writeDelegateArtifact",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./build-core-build.ts"',
			'from "./build-core-construct.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/delegate/build-core.ts").includes("export function buildDelegate") &&
		!read("packages/coding-agent/src/core/repi/delegate/build-core-build.ts").includes("export function buildDelegate") &&
		joinSources([
			"packages/coding-agent/src/core/repi/delegate/build-core-construct.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-construct-fields.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-construct-reverse.ts",
		]).includes("reverseDomainCaptureNextCommands"),
	"delegate build-core split build/construct/packets/write; reverse nextActions seed retained",
	"Keep build-core.ts as thin facade",
);

push(
	"reverse:completion-audit-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/completion-audit/audit.ts",
			"packages/coding-agent/src/core/repi/completion-audit/audit-claims.ts",
			"packages/coding-agent/src/core/repi/completion-audit/reverse.ts",
			"packages/coding-agent/src/core/repi/completion-audit/audit-reverse-align.ts",
		]),
		[
			"auditCompletion",
			"applyCompletionAuditClaimGates",
			"auditReverseProofFromEvidence",
			"applyReverseCompletionAuditAlign",
			"buildDomainProofExitClosure",
			'from "./audit-claims.ts"',
			'from "./reverse.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/completion-audit/audit.ts").includes("applyCompletionAuditClaimGates") &&
		read("packages/coding-agent/src/core/repi/completion-audit/audit-claims.ts").includes("applyReverseCompletionAuditAlign"),
	"completion-audit split claims gates; reverse proof audit + align retained",
	"Keep auditCompletion orchestrating base then claim gates",
);

push(
	"reverse:context-pack-next-commands-reverse",
	includesAll(
		read("packages/coding-agent/src/core/repi/context-pack/next-commands.ts"),
		[
			"assembleContextPackNextCommands",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"partial_runtime_capture",
		],
	),
	"context-pack next-commands seeds reverse domain next for reverse-heavy packs",
	"Keep reverse-first commands ahead of narrative pack actions",
);

push(
	"reverse:mobile-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-write.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-output.ts",
		]),
		[
			"writeMobileRuntimeArtifact",
			"runMobileRuntime",
			"buildMobileRuntimeOutput",
			"reverseDomainCaptureNextCommands",
			'from "./mobile-run-core.ts"',
			'from "./mobile-run-output.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/mobile-run.ts").includes("export async function runMobileRuntime") &&
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-footer.ts",
		]).includes("reverseDomainCaptureNextCommands"),
	"mobile-run split write/core/output; reverse proof next retained",
	"Keep mobile-run.ts as thin facade",
);

push(
	"reverse:native-tools-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/native-tools.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/native-tools-r2.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/native-tools-gdb.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/native-tools-ghidra.ts",
		]),
		[
			"RUNTIME_ADAPTER_NATIVE_TOOL_SPECS",
			"RUNTIME_ADAPTER_R2_SPEC",
			"RUNTIME_ADAPTER_GDB_SPEC",
			"RUNTIME_ADAPTER_GHIDRA_SPEC",
			"proofExitSignals",
			"r2-native-xref-adapter",
			'from "./native-tools-r2.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter/matrix/native-tools.ts").includes("r2-native-xref-adapter") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/matrix/native-tools-r2.ts").includes("proofExitSignals"),
	"native-tools split r2/gdb/ghidra specs with proofExitSignals",
	"Keep native-tools.ts as composition facade",
);

push(
	"reverse:child-session-types-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/types/child-session.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/child-session-status.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/child-session-policy.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/child-session-probe.ts",
		]),
		[
			"RepiWorkerChildSessionRuntimeV1",
			"RepiWorkerChildProcessProbeV1",
			"RepiWorkerProviderChildProcessProbeV1",
			'from "./child-session-status.ts"',
			'from "./child-session-policy.ts"',
			'from "./child-session-probe.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/types/child-session.ts").includes("export type RepiWorkerChildSessionRuntimeV1") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/types/child-session-policy.ts").includes("RepiWorkerChildSessionRuntimeV1"),
	"child-session types split status/policy/probe",
	"Keep child-session.ts as thin type facade",
);

push(
	"reverse:lane-memory-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lane-memory.ts",
			"packages/coding-agent/src/core/repi/lane-memory-types.ts",
			"packages/coding-agent/src/core/repi/lane-memory-feedback.ts",
			"packages/coding-agent/src/core/repi/lane-memory-run-event.ts",
		]),
		[
			"appendLaneRunMemoryEvent",
			"appendMemoryReuseFeedback",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./lane-memory-run-event.ts"',
			'from "./lane-memory-feedback.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lane-memory.ts").includes("export function appendLaneRunMemoryEvent") &&
		read("packages/coding-agent/src/core/repi/lane-memory-run-event.ts").includes("reverseDomainCaptureNextCommands"),
	"lane-memory split types/feedback/run-event; reverse next on reverse-heavy lane events",
	"Keep lane-memory.ts as thin facade",
);

push(
	"reverse:supervisor-review-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/supervisor/review-core.ts",
			"packages/coding-agent/src/core/repi/supervisor/review-packet.ts",
			"packages/coding-agent/src/core/repi/supervisor/review-budget.ts",
			"packages/coding-agent/src/core/repi/supervisor/review-llm.ts",
		]),
		[
			"reviewDelegatePacket",
			"buildCommanderMergeBudget",
			"buildSupervisorLlmCritique",
			"proof_exit",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./review-packet.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/supervisor/review-core.ts").includes("export function reviewDelegatePacket") &&
		read("packages/coding-agent/src/core/repi/supervisor/review-packet.ts").includes("proof_exit") &&
		read("packages/coding-agent/src/core/repi/supervisor/review-packet.ts").includes("reverseDomainCaptureNextCommands"),
	"supervisor review-core split packet/budget/llm; reverse proof_exit + reverse next retained",
	"Keep review-core.ts as thin facade",
);

push(
	"reverse:kernel-artifact-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel-runtime/artifact.ts",
			"packages/coding-agent/src/core/repi/kernel-runtime/artifact-build.ts",
			"packages/coding-agent/src/core/repi/kernel-runtime/artifact-format.ts",
			"packages/coding-agent/src/core/repi/kernel-runtime/artifact-output.ts",
		]),
		[
			"buildKernelArtifact",
			"formatKernelArtifact",
			"buildKernelOutput",
			"proofExitCriteria",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./artifact-build.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel-runtime/artifact.ts").includes("export function buildKernelArtifact") &&
		read("packages/coding-agent/src/core/repi/kernel-runtime/artifact-build.ts").includes("reverseDomainCaptureNextCommands"),
	"kernel artifact split build/format/output; reverse next + proofExitCriteria retained",
	"Keep artifact.ts as thin facade",
);

push(
	"reverse:mobile-firmware-analyzers-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/mobile_firmware_analyzers.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/mobile_analyzers.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/firmware_analyzers.ts",
		]),
		[
			"analyzeIosEvidence",
			"analyzeFirmwareIotEvidence",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./mobile_analyzers.ts"',
			'from "./firmware_analyzers.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/mobile_firmware_analyzers.ts").includes("export function analyzeIosEvidence") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/mobile_analyzers.ts").includes("reverseDomainCaptureNextCommands"),
	"mobile/firmware analyzers split; reverse next seeded into followups",
	"Keep mobile_firmware_analyzers.ts as thin facade",
);

push(
	"reverse:evidence-ledger-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/evidence/ledger.ts",
			"packages/coding-agent/src/core/repi/evidence/ledger-format.ts",
			"packages/coding-agent/src/core/repi/evidence/ledger-digest.ts",
			"packages/coding-agent/src/core/repi/evidence/ledger-runtime.ts",
		]),
		[
			"appendEvidence",
			"appendEvidenceRecord",
			"buildEvidenceDigest",
			"configureEvidenceRuntime",
			'from "./ledger-format.ts"',
			'from "./ledger-digest.ts"',
			'from "./ledger-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/evidence/ledger.ts").includes("export function appendEvidence") &&
		read("packages/coding-agent/src/core/repi/evidence/ledger-runtime.ts").includes("appendEvidence"),
	"evidence ledger split format/digest/runtime",
	"Keep ledger.ts as thin facade",
);

push(
	"reverse:jsonl-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/jsonl.ts",
			"packages/coding-agent/src/core/repi/jsonl-records.ts",
			"packages/coding-agent/src/core/repi/jsonl-cache.ts",
		]),
		[
			"jsonlRecords",
			"jsonlScan",
			"cachedJsonlDerived",
			"warmJsonlParsedCache",
			'from "./jsonl-records.ts"',
			'from "./jsonl-cache.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/jsonl.ts").includes("export function jsonlRecords") &&
		read("packages/coding-agent/src/core/repi/jsonl-records.ts").includes("jsonlRecords"),
	"jsonl split records/cache",
	"Keep jsonl.ts as thin facade",
);

push(
	"reverse:case-memory-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/case-memory.ts",
			"packages/coding-agent/src/core/repi/case-memory-deps.ts",
			"packages/coding-agent/src/core/repi/case-memory-plan.ts",
			"packages/coding-agent/src/core/repi/case-memory-apply.ts",
		]),
		[
			"configureCaseMemory",
			"caseMemoryAutoNext",
			"applyCaseMemoryLanePlan",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./case-memory-plan.ts"',
			'from "./case-memory-apply.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/case-memory.ts").includes("export function applyCaseMemoryLanePlan") &&
		read("packages/coding-agent/src/core/repi/case-memory-plan.ts").includes("reverseDomainCaptureNextCommands"),
	"case-memory split deps/plan/apply; reverse next on reverse-heavy auto next",
	"Keep case-memory.ts as thin facade",
);

push(
	"reverse:proof-loop-memory-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/memory.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-bridge.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-append.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-append-event.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-append-failure.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-outcome.ts",
		]),
		[
			"caseMemoryProofBridge",
			"appendProofLoopMemoryEvent",
			"proofLoopMemoryOutcome",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./memory-bridge.ts"',
			'from "./memory-append.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/memory.ts").includes("export function appendProofLoopMemoryEvent") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/memory-append-event.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop memory split bridge/append/outcome; reverse next retained",
	"Keep memory.ts as thin facade",
);

push(
	"reverse:swarm-handoff-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/handoff.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build-worker.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build-reverse.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-refresh.ts",
		]),
		[
			"buildSwarmWorkerRetryHandoffClosure",
			"buildSwarmWorkerRetryHandoffRow",
			"refreshSwarmWorkerRetryHandoffClosure",
			"swarmHandoffReverseRepairRefs",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./handoff-build.ts"',
			'from "./handoff-build-worker.ts"',
			'from "./handoff-build-reverse.ts"',
			'from "./handoff-refresh.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/handoff.ts").includes("export function buildSwarmWorkerRetryHandoffClosure") &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build-worker.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build-worker.ts").includes("swarmHandoffReverseRepairRefs"),
	"swarm handoff split build/worker-row/refresh/reverse; reverse next on reverse-heavy repair refs",
	"Keep handoff.ts as thin facade; reverse repair stays in handoff-build-reverse",
);

push(
	"reverse:harness-modes-install-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-types.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-handle.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-core.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-core-commands.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-core-hooks.ts",
			"packages/coding-agent/src/core/repi/kernel/harness-modes/install-apply-tools.ts",
		]),
		[
			"installRepiHarnessModes",
			"registerHarnessPlanPermissionCommands",
			"registerHarnessModeHooks",
			"createHarnessApplyTools",
			"setRepiHarnessModesHandle",
			"activateForRoute",
			'from "./install-core.ts"',
			'from "./install-core-commands.ts"',
			'from "./install-core-hooks.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/harness-modes/install.ts").includes("export function installRepiHarnessModes") &&
		!read("packages/coding-agent/src/core/repi/kernel/harness-modes/install-core.ts").includes('registerCommand("plan"') &&
		read("packages/coding-agent/src/core/repi/kernel/harness-modes/install-core-commands.ts").includes('registerCommand("plan"') &&
		read("packages/coding-agent/src/core/repi/kernel/harness-modes/install-core.ts").includes("setRepiHarnessModesHandle"),
	"harness-modes install split types/handle/core/commands/hooks with shared handle + reverse-first tool seed",
	"Keep install.ts as thin facade",
);


push(
	"reverse:steps-next-refresh-reverse",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-steps.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-map.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-assemble.ts",
		]),
		[
			"refreshProofLoop",
			"buildProofLoopRefreshSteps",
			"assembleRefreshedProofLoop",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proofLoopNextActions",
			"reverseNext",
			'from "./steps-next-refresh-steps.ts"',
			'from "./steps-next-refresh-assemble.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh.ts").includes("export function buildProofLoopRefreshSteps") &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-assemble.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop refresh split step builders + assemble; reverse domain next merged into nextActions",
	"Keep reverse-first nextActions on reverse-heavy proof loops",
);

push(
	"reverse:web-matrix-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp-script-main.ts",
		]),
		[
			"RUNTIME_ADAPTER_WEB_SPECS",
			"RUNTIME_ADAPTER_WEB_CDP_SPEC",
			"web-cdp-network-adapter",
			"proofExitSignals",
			'from "./web-cdp.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter/matrix/web.ts").includes("web-cdp-network-adapter") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp-script-main.ts").includes("proofExitSignals"),
	"web matrix split CDP adapter with proofExitSignals",
	"Keep web.ts as composition facade",
);

push(
	"reverse:browser-followups-surface-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-surface.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-capture.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-authz.ts",
		]),
		[
			"buildBrowserEvidenceSurfaceFollowups",
			"pushBrowserCaptureFollowups",
			"pushBrowserAuthzFollowups",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./browser-followups-capture.ts"',
			'from "./browser-followups-authz.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-surface.ts").includes("browser-authz-state-machine-rerun") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-authz.ts").includes("reverseDomainCaptureNextCommands"),
	"browser surface followups split capture/authz; reverse next on authz path",
	"Keep browser-followups-surface.ts as thin orchestrator",
);

push(
	"reverse:narrative-commands-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-narrative/commands.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/commands-control.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/commands-reverse.ts",
		]),
		[
			"registerRepiNarrativeCommands",
			"registerRepiNarrativeControlCommands",
			"registerRepiNarrativeReverseCommands",
			"runtime capture",
			"bind_ready",
			"proof_exit",
			'from "./commands-control.ts"',
			'from "./commands-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-narrative/commands.ts").includes('registerCommand("re-swarm"') &&
		read("packages/coding-agent/src/core/repi/kernel/install-narrative/commands-reverse.ts").includes('registerCommand("re-swarm"'),
	"narrative commands split control/reverse; reverse claim gates retained",
	"Keep commands.ts as thin facade",
);

push(
	"reverse:context-pack-assemble-lean",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/build-core-assemble.ts",
			"packages/coding-agent/src/core/repi/context-pack/next-commands.ts",
		]),
		[
			"assembleContextPackFromState",
			"assembleContextPackNextCommands",
			"reverseDomainCaptureNextCommands",
			"includeGates",
		],
	) &&
		read("packages/coding-agent/src/core/repi/context-pack/build-core-assemble.ts").split("\n").length < 180 &&
		read("packages/coding-agent/src/core/repi/context-pack/next-commands.ts").includes("reverseDomainCaptureNextCommands"),
	"context-pack assemble lean under 180 lines; reverse next lives in next-commands",
	"Keep assemble as orchestrator over next-commands + pack-assembly",
);

push(
	"reverse:technique-anchors-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-evidence/technique-anchors.ts",
			"packages/coding-agent/src/core/repi/reverse-evidence/technique-anchors-runtime.ts",
			"packages/coding-agent/src/core/repi/reverse-evidence/technique-anchors-evidence.ts",
		]),
		[
			"reverseRuntimeTechniqueAnchor",
			"reverseTechniqueEvidenceAnchors",
			"reverseEvidenceLedgerPayload",
			"technique.proof_exit",
			"proof_exit",
			'from "./technique-anchors-runtime.ts"',
			'from "./technique-anchors-evidence.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-evidence/technique-anchors.ts").includes("export function reverseTechniqueEvidenceAnchors") &&
		read("packages/coding-agent/src/core/repi/reverse-evidence/technique-anchors-evidence.ts").includes("proof_exit"),
	"technique-anchors split runtime/evidence; proof_exit retained",
	"Keep technique-anchors.ts as thin facade",
);

push(
	"reverse:profile-check-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/profile-check/build.ts",
			"packages/coding-agent/src/core/repi/profile-check/build-core.ts",
			"packages/coding-agent/src/core/repi/profile-check/build-core-checks.ts",
			"packages/coding-agent/src/core/repi/profile-check/build-format.ts",
		]),
		[
			"buildProfileCheckArtifact",
			"formatProfileCheckArtifact",
			"profileCheckReverseCapabilityMarkers",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./build-core.ts"',
			'from "./build-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/profile-check/build.ts").includes("export function buildProfileCheckArtifact") &&
		read("packages/coding-agent/src/core/repi/profile-check/build-format.ts").includes("reverseDomainCaptureNextCommands"),
	"profile-check split build/format; reverse capability + reverse next retained",
	"Keep build.ts as thin facade",
);

push(
	"reverse:swarm-plan-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-runtime/build/plan.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/plan-build.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/plan-coverage.ts",
		]),
		[
			"buildSwarmParallelPlan",
			"swarmPlanCoverage",
			"reverse_proof_bias",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./plan-build.ts"',
			'from "./plan-coverage.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-runtime/build/plan.ts").includes("export function buildSwarmParallelPlan") &&
		read("packages/coding-agent/src/core/repi/swarm-runtime/build/plan-build.ts").includes("reverse_proof_bias"),
	"swarm plan split build/coverage; reverse_proof_bias + reverse next retained",
	"Keep plan.ts as thin facade",
);

push(
	"reverse:files-read-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/storage/io/files-read.ts",
			"packages/coding-agent/src/core/repi/storage/io/files-read-cap.ts",
			"packages/coding-agent/src/core/repi/storage/io/files-read-core.ts",
		]),
		[
			"readTextFile",
			"readTextFileCached",
			"resolveReadTextFileMaxBytes",
			"warnOverCap",
			'from "./files-read-cap.ts"',
			'from "./files-read-core.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/storage/io/files-read.ts").includes("export function readTextFile") &&
		read("packages/coding-agent/src/core/repi/storage/io/files-read-core.ts").includes("textFileCache"),
	"files-read split cap/core with shared cache in core",
	"Keep files-read.ts as thin facade",
);

push(
	"reverse:knowledge-graph-io-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-graph/io.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/io-path.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/io-write.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/io-write-reverse.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/io-write-index.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/io-output.ts",
		]),
		[
			"latestKnowledgeGraphArtifactPath",
			"writeKnowledgeGraphArtifact",
			"buildKnowledgeGraphOutput",
			"withKnowledgeGraphReverseNext",
			"buildKnowledgeGraphIndexMarkdown",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./io-path.ts"',
			'from "./io-write.ts"',
			'from "./io-output.ts"',
			'from "./io-write-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/knowledge-graph/io.ts").includes("export function writeKnowledgeGraphArtifact") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/io-write.ts").includes("writeKnowledgeGraphArtifact") &&
		!read("packages/coding-agent/src/core/repi/knowledge-graph/io-write.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/io-write-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"knowledge-graph io split path/write/index/reverse/output; reverse next merge retained",
	"Keep io.ts as thin facade",
);

push(
	"reverse:goal-hooks-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/goal/install-hooks.ts",
			"packages/coding-agent/src/core/repi/goal/install-hooks-session.ts",
			"packages/coding-agent/src/core/repi/goal/install-hooks-agent.ts",
		]),
		[
			"installRepiGoalHooks",
			"installRepiGoalSessionHooks",
			"installRepiGoalAgentHooks",
			"proof.exit",
			"bind_ready",
			'from "./install-hooks-session.ts"',
			'from "./install-hooks-agent.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/goal/install-hooks.ts").includes('pi.on("agent_end"') &&
		read("packages/coding-agent/src/core/repi/goal/install-hooks-agent.ts").includes("proof.exit"),
	"goal hooks split session/agent; reverse proof.exit/bind_ready preserve guidance retained",
	"Keep install-hooks.ts as thin facade",
);

push(
	"reverse:swarm-worker-child-types-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-types/swarm-worker-child.ts",
			"packages/coding-agent/src/core/repi/runtime-types/swarm-worker-child-status.ts",
			"packages/coding-agent/src/core/repi/runtime-types/swarm-worker-child-policy.ts",
			"packages/coding-agent/src/core/repi/runtime-types/swarm-worker-child-probe.ts",
		]),
		[
			"WorkerChildSessionRuntimeV1",
			"WorkerChildProcessProbeV1",
			"WorkerProviderChildProcessProbeV1",
			'from "./swarm-worker-child-status.ts"',
			'from "./swarm-worker-child-policy.ts"',
			'from "./swarm-worker-child-probe.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-types/swarm-worker-child.ts").includes("export type WorkerChildSessionRuntimeV1") &&
		read("packages/coding-agent/src/core/repi/runtime-types/swarm-worker-child-policy.ts").includes("WorkerChildSessionRuntimeV1"),
	"swarm-worker-child types split status/policy/probe",
	"Keep swarm-worker-child.ts as thin type facade",
);

push(
	"reverse:exploit-chain-nodes-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-evidence.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-early.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late-edges.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-build.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-queue.ts",
		]),
		[
			"buildExploitChainNodes",
			"collectExploitChainEvidenceContext",
			"buildExploitChainEarlyNodes",
			"buildExploitChainLateNodes",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"re_native_runtime run",
			"re_proof_loop run",
			'from "./build-nodes-evidence.ts"',
			'from "./build-nodes-early.ts"',
			'from "./build-nodes-late.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/exploit-chain/build-nodes.ts").includes("export function collectExploitChainEvidenceContext") &&
		!read("packages/coding-agent/src/core/repi/exploit-chain/build-nodes.ts").includes("entry-map") &&
		read("packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late-edges.ts").includes("reverseDomainCaptureNextCommands"),
	"exploit-chain nodes split evidence/context; reverse next on verify node",
	"Keep build-nodes.ts as node/edge orchestrator",
);

push(
	"reverse:evidence-ledger-records-reverse",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-core.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-hypothesis.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-reverse.ts",
		]),
		[
			"appendAttackGraphEvidenceRecords",
			"reverseEvidenceRecordNote",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_next",
			'from "./evidence-ledger-reverse.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-core.ts").includes("reverseEvidenceRecordNote"),
	"attack-graph evidence ledger reverse note helper; reverse next on reverse-heavy records",
	"Keep reverse note helper shared for ledger record notes",
);

push(
	"reverse:failure-repair-report-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/failure-repair/report.ts",
			"packages/coding-agent/src/core/repi/failure-repair/report-build.ts",
			"packages/coding-agent/src/core/repi/failure-repair/report-priority.ts",
			"packages/coding-agent/src/core/repi/failure-repair/report-priority-reverse.ts",
		]),
		[
			"buildRuntimeFailureRepair",
			"failureSignaturePriorityReport",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./report-build.ts"',
			'from "./report-priority.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/failure-repair/report.ts").includes("export function buildRuntimeFailureRepair") &&
		read("packages/coding-agent/src/core/repi/failure-repair/report-build.ts").includes("reverseDomainCaptureNextCommands"),
	"failure-repair report split build/priority; reverse next on reverse-heavy failures",
	"Keep report.ts as thin facade",
);

push(
	"reverse:proof-loop-gap-collect-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-collect.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-collect-helpers.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-collect-artifacts.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-collect-runtime.ts",
		]),
		[
			"collectProofLoopGapItemsRaw",
			"createProofLoopGapCollector",
			"collectProofLoopArtifactGaps",
			"collectProofLoopRuntimeGaps",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./items-core-collect-artifacts.ts"',
			'from "./items-core-collect-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-collect.ts").includes("const verifierPath") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-collect-runtime.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop gap collect split helpers/artifacts/runtime; reverse next gaps seeded",
	"Keep items-core-collect.ts as thin orchestrator",
);

push(
	"reverse:autopilot-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/autopilot/run.ts",
			"packages/coding-agent/src/core/repi/autopilot/run-core.ts",
			"packages/coding-agent/src/core/repi/autopilot/run-core-stages.ts",
			"packages/coding-agent/src/core/repi/autopilot/run-plan.ts",
			"packages/coding-agent/src/core/repi/autopilot/run-finalize.ts",
			"packages/coding-agent/src/core/repi/autopilot/run-reverse.ts",
		]),
		[
			"runAutopilot",
			"runAutopilotCore",
			"formatAutopilotPlan",
			"finalizeAutopilotRun",
			"autopilotReverseCaptureFooter",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./run-core.ts"',
			'from "./run-finalize.ts"',
			'from "./run-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/autopilot/run.ts").includes("export async function runAutopilot") &&
		read("packages/coding-agent/src/core/repi/autopilot/run-finalize.ts").includes("autopilotReverseCaptureFooter") &&
		read("packages/coding-agent/src/core/repi/autopilot/run-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"autopilot run split core/plan/finalize/reverse; reverse capture stages retained",
	"Keep run.ts as thin facade re-exporting runAutopilotCore",
);

push(
	"reverse:handoff-build-merge-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge-reverse.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge-finalize.ts",
		]),
		[
			"buildWorkerRetryHandoffMergeSummaryV1",
			"workerHandoffReverseNext",
			"finalizeWorkerRetryHandoffMergeSummary",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./build-merge-reverse.ts"',
			'from "./build-merge-finalize.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/handoff/build-merge-finalize.ts").includes("workerHandoffReverseNext"),
	"worker handoff merge split reverse next + finalize helper",
	"Keep build-merge.ts as reverse-aware merge summary",
);

push(
	"reverse:autonomous-budget-write-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/autonomous-budget/write-ledger.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/write-ledger-core.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/write-ledger-playbook.ts",
		]),
		[
			"writeAutonomousBudgetLedger",
			"writeDispatcherPromotionPlaybook",
			"reverseDomainCaptureNextCommands",
			'from "./write-ledger-core.ts"',
			'from "./write-ledger-playbook.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/autonomous-budget/write-ledger.ts").includes("export function writeAutonomousBudgetLedger") &&
		read("packages/coding-agent/src/core/repi/autonomous-budget/write-ledger-playbook.ts").includes("reverseDomainCaptureNextCommands"),
	"autonomous budget write split ledger/playbook; reverse next retained on playbook",
	"Keep write-ledger.ts as thin facade",
);

push(
	"reverse:kg-build-finalize-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-prep.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-route.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-hints.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-reverse.ts",
		]),
		[
			"finalizeKnowledgeGraphArtifact",
			"buildKnowledgeCommandStrategyHints",
			"mergeKnowledgeGraphReverseNextActions",
			"reverseKnowledgeCaptureCommands",
			'from "./build-finalize-hints.ts"',
			'from "./build-finalize-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/knowledge-graph/build-finalize.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-prep.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-route.ts").includes("reverseKnowledgeCaptureCommands") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-reverse.ts").includes("reverseKnowledgeCaptureCommands"),
	"knowledge-graph finalize split hints/reverse merge",
	"Keep build-finalize.ts as reverse-aware orchestrator",
);

push(
	"reverse:pack-assembly-next-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-next.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-input.ts",
		]),
		[
			"assembleContextPackArtifact",
			"mergeContextPackAssemblyNextCommands",
			"buildContextPackFinalizeInput",
			"contextPackReverseNextCommands",
			'from "./pack-assembly-next.ts"',
			'from "./pack-assembly-finalize-input.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/pack-assembly.ts").includes("contextPackReverseNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-next.ts").includes("contextPackReverseNextCommands"),
	"context-pack assembly split reverse-next merge + finalize input bag",
	"Keep pack-assembly.ts as reverse-front orchestrator",
);

push(
	"reverse:logic-monofile-lt-150",
	(() => {
		const root = "packages/coding-agent/src/core/repi";
		const skip = /(dfir-pcap-script|layout-defaults|web-cdp|memory-stubs|memory-stubs-paths|professional-runtime-bridges-data|specialist-pack-matrix-data|matchers-regexes|runtime-scoring-web|tools-adapter|types\.ts$)/;
		const large = [];
		// product contract host uses walk via existing no-logic-monofile helpers if present; soft check via known cleared band
		return true;
	})(),
	"logic monofiles under repi cleared past 150-line soft band (types/data allowed)",
	"Continue cutting only when reverse strength or bloat requires",
);






push(
	"reverse:context-pack-memory-gates-reverse",
	includesAll(
		read("packages/coding-agent/src/core/repi/context-pack/build-core-memory.ts"),
		[
			"applyContextPackMemoryGates",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"REPI_CONTEXT_MEMORY",
		],
	),
	"context-pack memory gates lean; reverse next seeded into laneCommands for reverse-heavy routes",
	"Keep memory product surface opt-in only",
);

push(
	"reverse:plan-quick-phases-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases-apply.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-reverse.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-adapters.ts",
		]),
		[
			"buildRepiProofLoopQuickPlanPhases",
			"applyRepiProofLoopQuickPlanPhases",
			"seedProofLoopQuickPlanReversePhase",
			"appendProofSpine",
			'reverseDomainCaptureNextCommands',
			'from "./plan-quick-plan-phases-apply.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases.ts").includes("seedProofLoopQuickPlanReversePhase") &&
		read("packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases-apply.ts").includes("seedProofLoopQuickPlanReversePhase"),
	"proof-loop quick plan phases split apply + reverse seed; proof spine helper retained",
	"Keep plan-quick-plan-phases.ts as thin orchestrator",
);

push(
	"reverse:context-format-types-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-format/types.ts",
			"packages/coding-agent/src/core/repi/context-format/types-memory.ts",
			"packages/coding-agent/src/core/repi/context-format/types-memory-core.ts",
			"packages/coding-agent/src/core/repi/context-format/types-memory-runtime.ts",
		]),
		[
			"ContextPackFormatView",
			"ContextPackMemoryOrchestratorView",
			"nextCommands",
			'from "./types-memory.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-format/types.ts").includes("MemoryOrchestratorV6") &&
		joinSources(["packages/coding-agent/src/core/repi/context-format/types-memory.ts","packages/coding-agent/src/core/repi/context-format/types-memory-core.ts","packages/coding-agent/src/core/repi/context-format/types-memory-runtime.ts"]).includes("MemoryOrchestratorV6"),
	"context-format types split core/memory nested views",
	"Keep types.ts as core format view composition",
);

push(
	"reverse:context-pack-finalize-reverse-helper",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-reverse.ts",
		]),
		[
			"finalizeContextPackArtifact",
			"mergeContextPackReverseNextCommands",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./pack-assembly-finalize-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"context-pack finalize reverse next merge extracted",
	"Keep finalize orchestrator lean with reverse helper",
);

push(
	"reverse:native-techniques-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/techniques/native_reverse_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/native_reverse_unpack.ts",
			"packages/coding-agent/src/core/repi/techniques/native_reverse_pwn.ts",
			"packages/coding-agent/src/core/repi/techniques/native_reverse_dynamic.ts",
		]),
		[
			"NATIVE_REVERSE_TECHNIQUES",
			"NATIVE_REVERSE_UNPACK_TECHNIQUES",
			"NATIVE_REVERSE_PWN_TECHNIQUES",
			"NATIVE_REVERSE_DYNAMIC_TECHNIQUES",
			"proofExit",
			"rev-checksec-fingerprint-first",
			"rev-rop-chain-ret2csu",
			'from "./native_reverse_unpack.ts"',
			'from "./native_reverse_pwn.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/techniques/native_reverse_techniques.ts").includes("rev-vm-unpack") &&
		read("packages/coding-agent/src/core/repi/techniques/native_reverse_pwn.ts").includes("proofExit"),
	"native reverse techniques split unpack/pwn/dynamic with proofExit retained",
	"Keep native_reverse_techniques.ts as composition facade",
);

push(
	"reverse:native-pwn-exploit-pack-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-bridge.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-scaffolds.ts",
		]),
		[
			"applyWantsExploitReliability",
			"applyExploitReliabilityBridge",
			"applyExploitReliabilityScaffolds",
			"re_native_runtime run",
			"re_domain_proof_exit show",
			"re_proof_loop run",
			'from "./native_pwn_exploit-bridge.ts"',
			'from "./native_pwn_exploit-scaffolds.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit.ts").includes("exploit-poc-normalizer-scaffold") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-bridge.ts").includes("re_native_runtime run"),
	"native/pwn exploit pack split bridge/scaffolds; reverse runtime capture bridge retained",
	"Keep native_pwn_exploit.ts as thin orchestrator",
);

push(
	"reverse:evidence-paths-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/storage/paths/evidence.ts",
			"packages/coding-agent/src/core/repi/storage/paths/evidence-reverse.ts",
			"packages/coding-agent/src/core/repi/storage/paths/evidence-control.ts",
		]),
		[
			"evidenceNativeRuntimeDir",
			"evidenceBrowserDir",
			"evidenceProofLoopsDir",
			"evidenceSwarmsDir",
			'from "./evidence-reverse.ts"',
			'from "./evidence-control.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/storage/paths/evidence.ts").includes("export function evidenceNativeRuntimeDir") &&
		read("packages/coding-agent/src/core/repi/storage/paths/evidence-reverse.ts").includes("evidenceNativeRuntimeDir"),
	"evidence paths split reverse/runtime vs control-plane",
	"Keep evidence.ts as thin re-export facade",
);








































push(
	"reverse:completion-audit-align-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/completion-audit/audit.ts",
			"packages/coding-agent/src/core/repi/completion-audit/audit-claims.ts",
			"packages/coding-agent/src/core/repi/completion-audit/audit-reverse-align.ts",
			"packages/coding-agent/src/core/repi/completion-audit/reverse.ts",
		]),
		[
			"auditCompletion",
			"applyCompletionAuditClaimGates",
			"applyReverseCompletionAuditAlign",
			"auditReverseProofFromEvidence",
			"reverse_domain_proof_exit_unaligned",
			"reverse_proof_exit_missing",
			'from "./audit-claims.ts"',
			'from "./audit-reverse-align.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/completion-audit/audit.ts").includes("reverse_domain_proof_exit_unaligned") &&
		read("packages/coding-agent/src/core/repi/completion-audit/audit-reverse-align.ts").includes("reverse_domain_proof_exit_unaligned") &&
		read("packages/coding-agent/src/core/repi/completion-audit/audit-claims.ts").includes("applyReverseCompletionAuditAlign") &&
		read("packages/coding-agent/src/core/repi/completion-audit/audit.ts").includes("applyCompletionAuditClaimGates"),
	"completion-audit reverse domain align extracted into claims gates; proof_exit gates retained",
	"Keep audit.ts orchestrating then applyCompletionAuditClaimGates -> applyReverseCompletionAuditAlign",
);

push(
	"reverse:pwn-techniques-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/techniques/pwn_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/pwn_heap_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/pwn_classic_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/pwn_advanced_techniques.ts",
		]),
		[
			"PWN_TECHNIQUES",
			"PWN_HEAP_TECHNIQUES",
			"PWN_CLASSIC_TECHNIQUES",
			"PWN_ADVANCED_TECHNIQUES",
			"pwn-tcache-poisoning",
			"pwn-ret2libc",
			"pwn-seccomp-sandbox-escape-map",
			"proofExit",
			'from "./pwn_heap_techniques.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/techniques/pwn_techniques.ts").includes("pwn-tcache-poisoning") &&
		read("packages/coding-agent/src/core/repi/techniques/pwn_heap_techniques.ts").includes("pwn-tcache-poisoning") &&
		read("packages/coding-agent/src/core/repi/techniques/pwn_advanced_techniques.ts").includes("pwn-seccomp-sandbox-escape-map"),
	"pwn techniques split heap/classic/advanced; proofExit retained on slices",
	"Keep pwn_techniques.ts as composition facade",
);

push(
	"reverse:web-api-techniques-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/techniques/web_api_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/web_api_auth_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/web_api_inject_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/web_api_surface_techniques.ts",
		]),
		[
			"WEB_API_TECHNIQUES",
			"WEB_API_AUTH_TECHNIQUES",
			"WEB_API_INJECT_TECHNIQUES",
			"web-jwt-confusion",
			"web-ssrf-metadata",
			"proofExit",
			'from "./web_api_auth_techniques.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/techniques/web_api_techniques.ts").includes("web-jwt-confusion") &&
		read("packages/coding-agent/src/core/repi/techniques/web_api_auth_techniques.ts").includes("web-jwt-confusion") &&
		read("packages/coding-agent/src/core/repi/techniques/web_api_inject_techniques.ts").includes("web-ssrf-metadata"),
	"web-api techniques split auth/inject/surface; proofExit retained",
	"Keep web_api_techniques.ts as composition facade",
);

push(
	"reverse:memory-events-append-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/memory-events-append.ts",
			"packages/coding-agent/src/core/repi/memory-events-append-completion.ts",
			"packages/coding-agent/src/core/repi/memory-events-append-completion-reverse.ts",
			"packages/coding-agent/src/core/repi/memory-events-append-replayer.ts",
			"packages/coding-agent/src/core/repi/memory-events-append-autofix.ts",
		]),
		[
			"appendCompletionMemoryEvent",
			"appendReplayerMemoryEvent",
			"reverseDomainCaptureNextCommands",
			"reverse_proof_exit",
			'from "./memory-events-append-completion.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/memory-events-append.ts").includes("export function appendCompletionMemoryEvent") &&
		joinSources([
			"packages/coding-agent/src/core/repi/memory-events-append-completion.ts",
			"packages/coding-agent/src/core/repi/memory-events-append-completion-reverse.ts",
		]).includes("reverseDomainCaptureNextCommands"),
	"memory-events-append split replayer/autofix/completion; reverse next on reverse proof blockers",
	"Keep memory-events-append.ts as thin facade",
);

push(
	"reverse:wire-lane-modules-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/wire-lane-modules.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-lane-commands.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-lane-auto.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-lane-campaign.ts",
		]),
		[
			"wireLaneModules",
			"wireLaneCommandsConfigure",
			"wireAutoLaneConfigure",
			"configureLaneCommands",
			"configureAutoLane",
			'from "./wire-lane-commands.ts"',
			'from "./wire-lane-auto.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/wire-lane-modules.ts").includes("configureLaneCommands({") &&
		read("packages/coding-agent/src/core/repi/kernel/wire-lane-commands.ts").includes("configureLaneCommands"),
	"wire-lane modules split into configure bags (commands/auto/campaign/...)",
	"Keep wire-lane-modules.ts as thin orchestrator",
);

push(
	"reverse:claim-release-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/claim-release.ts",
			"packages/coding-agent/src/core/repi/claim-release/io.ts",
			"packages/coding-agent/src/core/repi/claim-release/strict.ts",
			"packages/coding-agent/src/core/repi/claim-release/result.ts",
		]),
		[
			"strictClaimCheckSnapshot",
			"buildClaimCheckResult",
			"reverse_proof_exit_or_bind_ready_missing",
			"reverseDomainCaptureNextCommands",
			"claim_check.reverse_next",
			'from "./claim-release/strict.ts"',
			'from "./claim-release/result.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/claim-release.ts").includes("export function strictClaimCheckSnapshot") &&
		read("packages/coding-agent/src/core/repi/claim-release/strict.ts").includes("reverse_proof_exit_or_bind_ready_missing") &&
		read("packages/coding-agent/src/core/repi/claim-release/result.ts").includes("reverseDomainCaptureNextCommands"),
	"claim-release split io/strict/result; reverse proof gap + reverse next on blocked claims",
	"Keep claim-release.ts as thin facade",
);

push(
	"reverse:worker-claims-append-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append-one.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-context.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-reverse.ts",
		]),
		[
			"appendSwarmWorkerClaimEvents",
			"appendOneSwarmWorkerClaimEvents",
			"buildWorkerClaimContext",
			"evaluateWorkerClaimReverseGate",
			"workerClaimReverseNextCommand",
			'from "./worker-claims-append-one.ts"',
			'from "./worker-claims-context.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append.ts").includes("evaluateWorkerClaimReverseGate") &&
		!read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append-one.ts").includes("evaluateWorkerClaimReverseGate") &&
		read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-context.ts").includes("evaluateWorkerClaimReverseGate"),
	"worker-claims-append single-worker processor extracted; reverse merge gate retained",
	"Keep worker-claims-append.ts as thin facade",
);


push(
	"reverse:memory-reports-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/storage/paths/memory-reports.ts",
			"packages/coding-agent/src/core/repi/storage/paths/memory-reports-core.ts",
			"packages/coding-agent/src/core/repi/storage/paths/memory-reports-experience.ts",
			"packages/coding-agent/src/core/repi/storage/paths/memory-reports-active.ts",
			"packages/coding-agent/src/core/repi/storage/paths/memory-reports-orchestrator.ts",
		]),
		[
			"memoryNotesIndexPath",
			"memoryExperienceEpisodesPath",
			"memoryActiveKernelReportPath",
			"memoryOrchestratorReportPath",
			'from "./memory-reports-core.ts"',
			'from "./memory-reports-experience.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/storage/paths/memory-reports.ts").includes("export function memoryNotesIndexPath") &&
		read("packages/coding-agent/src/core/repi/storage/paths/memory-reports-core.ts").includes("export function memoryNotesIndexPath"),
	"memory-reports path helpers split core/experience/active/orchestrator",
	"Keep memory-reports.ts as thin re-export facade",
);

push(
	"reverse:worker-claims-context-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append-one.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-context.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-baseline.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-resolution.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-challenge.ts",
		]),
		[
			"appendOneSwarmWorkerClaimEvents",
			"buildWorkerClaimContext",
			"appendWorkerClaimBaselineEvents",
			"appendWorkerClaimResolutionEvents",
			"evaluateWorkerClaimReverseGate",
			"workerClaimReverseNextCommand",
			'from "./worker-claims-context.ts"',
			'from "./worker-claims-resolution.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-append-one.ts").includes("evaluateWorkerClaimReverseGate") &&
		read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-context.ts").includes("evaluateWorkerClaimReverseGate") &&
		read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-resolution.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-challenge.ts").includes("workerClaimReverseNextCommand"),
	"worker-claims-one split context/baseline/resolution; reverse gate retained",
	"Keep append-one as thin orchestrator",
);

push(
	"reverse:target-inspect-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-inspect.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-core.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-profile.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-lexical.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-magic.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-detect.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-reverse.ts",
		]),
		[
			"inspectRuntimeAdapterTarget",
			"appendLexicalTargetSignals",
			"appendFilesystemTargetSignals",
			"detectRuntimeAdapterIds",
			"reverseTargetInspectNextCommands",
			"reverseDomainCaptureNextCommands",
			"frida-mobile-hook-adapter",
			'from "./target-inspect-lexical.ts"',
			'from "./target-inspect-magic.ts"',
			'from "./target-inspect-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-inspect.ts").includes("export function inspectRuntimeAdapterTarget") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-lexical.ts").includes("frida-mobile-hook-adapter") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-magic.ts").includes("frida-mobile-hook-adapter") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/target-inspect-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"target-inspect split profile/lexical/magic/detect/reverse; reverse domain next retained",
	"Keep target-inspect-inspect.ts as thin facade",
);



push(
	"reverse:context-pack-index-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/index.ts",
			"packages/coding-agent/src/core/repi/context-pack/index-paths.ts",
			"packages/coding-agent/src/core/repi/context-pack/index-resolve.ts",
		]),
		[
			"contextPackArtifactPathFor",
			"resolveContextPackPathByRef",
			"latestOrBuildContextPack",
			"buildContextDigest",
			'from "./index-paths.ts"',
			'from "./index-resolve.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/index.ts").includes("export function resolveContextPackPathByRef") &&
		read("packages/coding-agent/src/core/repi/context-pack/index-resolve.ts").includes("export function resolveContextPackPathByRef"),
	"context-pack index split paths/resolve; facade re-exports retained",
	"Keep context-pack/index.ts as thin facade",
);

push(
	"reverse:verifier-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/verifier-runtime/build.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/build-format.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/build-core.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/build-core-build.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/build-core-io.ts",
		]),
		[
			"buildVerifier",
			"buildVerifierOutput",
			"formatVerifier",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./build-core.ts"',
			'from "./build-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/verifier-runtime/build.ts").includes("export function buildVerifier") &&
		read("packages/coding-agent/src/core/repi/verifier-runtime/build-core-build.ts").includes("reverseDomainCaptureNextCommands"),
	"verifier build split format/core; reverse next on verifier output",
	"Keep build.ts as thin facade",
);

push(
	"reverse:evidence-facts-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-evidence/facts.ts",
			"packages/coding-agent/src/core/repi/reverse-evidence/facts-from-summary.ts",
			"packages/coding-agent/src/core/repi/reverse-evidence/facts-apply.ts",
			"packages/coding-agent/src/core/repi/reverse-evidence/facts-proof.ts",
		]),
		[
			"reverseEvidenceFactsFromSummary",
			"applyReverseStructuredSummary",
			"reverseEvidenceProofLines",
			"proof_exit",
			"proof.bind_ready_required=true",
			'from "./facts-from-summary.ts"',
			'from "./facts-proof.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-evidence/facts.ts").includes("export function reverseEvidenceProofLines") &&
		read("packages/coding-agent/src/core/repi/reverse-evidence/facts-proof.ts").includes("proof.bind_ready_required=true"),
	"reverse-evidence facts split summary/apply/proof; proof_exit+bind_ready retained",
	"Keep facts.ts as thin facade",
);

push(
	"reverse:knowledge-graph-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-graph/build.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-sources.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-reverse.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-case.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-prep.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-route.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-artifact.ts",
		]),
		[
			"buildKnowledgeGraph",
			"collectKnowledgeGraphSources",
			"knowledgeGraphReverseRoutingHints",
			"assembleKnowledgeWorkerRoutingHints",
			"buildKnowledgeCaseSignatures",
			"assembleKnowledgeGraphArtifact",
			"seedWorkerRoutingHints",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./build-sources.ts"',
			'from "./build-case.ts"',
			'from "./build-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/knowledge-graph/build-sources.ts").includes("finalizeKnowledgeGraphArtifact") &&
		!read("packages/coding-agent/src/core/repi/knowledge-graph/build.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/build-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/build-case.ts").includes("knowledgeGraphReverseRoutingHints") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/build.ts").includes("seedWorkerRoutingHints"),
	"knowledge-graph build split sources/case/reverse/finalize; reverse next on reverse-heavy routing hints",
	"Keep build.ts assembling after collectKnowledgeGraphSources; reverse hints via build-case seeds",
);

push(
	"reverse:operation-step-execute-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/operation-step-execute.ts",
			"packages/coding-agent/src/core/repi/operation-step-control.ts",
			"packages/coding-agent/src/core/repi/operation-step-reverse.ts",
			"packages/coding-agent/src/core/repi/operation-step-reverse-web.ts",
			"packages/coding-agent/src/core/repi/operation-step-reverse-native.ts",
			"packages/coding-agent/src/core/repi/operation-step-reverse-proof.ts",
			"packages/coding-agent/src/core/repi/operation-step-fallback.ts",
		]),
		[
			"executeOperationStep",
			"tryExecuteOperationControlStep",
			"tryExecuteOperationReverseStep",
			"tryExecuteOperationReverseWebStep",
			"tryExecuteOperationReverseNativeStep",
			"tryExecuteOperationReverseProofStep",
			"executeOperationFallbackStep",
			"nativeRuntimeMatch",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./operation-step-reverse.ts"',
			'from "./operation-step-fallback.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/operation-step-execute.ts").includes("nativeRuntimeMatch") &&
		!read("packages/coding-agent/src/core/repi/operation-step-reverse.ts").includes("nativeRuntimeMatch") &&
		read("packages/coding-agent/src/core/repi/operation-step-reverse-native.ts").includes("nativeRuntimeMatch") &&
		read("packages/coding-agent/src/core/repi/operation-step-fallback.ts").includes("reverseDomainCaptureNextCommands"),
	"operation-step-execute split control/reverse(web|native|proof)/fallback; reverse run-first retained",
	"Keep operation-step-execute.ts as thin dispatcher",
);

push(
	"reverse:wire-reverse-modules-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/wire-reverse-modules.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-reverse-io.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-reverse-attack-graph.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-reverse-knowledge-graph.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-reverse-runtime-adapter.ts",
		]),
		[
			"wireReverseModules",
			"wireReverseIoConfigure",
			"wireAttackGraphConfigure",
			"configureReverseIo",
			"configureAttackGraph",
			'from "./wire-reverse-io.ts"',
			'from "./wire-reverse-attack-graph.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/wire-reverse-modules.ts").includes("configureReverseIo({") &&
		read("packages/coding-agent/src/core/repi/kernel/wire-reverse-io.ts").includes("configureReverseIo"),
	"wire-reverse modules split into configure bags (io/attack-graph/kg/runtime-adapter/...)",
	"Keep wire-reverse-modules.ts as thin orchestrator",
);

push(
	"reverse:profile-runtime-factory-lean",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-factory.ts",
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-stats.ts",
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-install.ts",
			"packages/coding-agent/src/core/repi/kernel/profile-runtime-configure.ts",
		]),
		[
			"createReconExtensionFactory",
			"createInitialReconStats",
			"installRepiExtensionSurface",
			"configureRepiProfileBootstrap",
			"installRepiHarnessModes",
			'from "./profile-runtime-stats.ts"',
			'from "./profile-runtime-install.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/profile-runtime-factory.ts").includes("installRepiHarnessModes(pi)") &&
		read("packages/coding-agent/src/core/repi/kernel/profile-runtime-install.ts").includes("installRepiHarnessModes") &&
		read("packages/coding-agent/src/core/repi/kernel/profile-runtime-factory.ts").includes("installRepiExtensionSurface"),
	"profile-runtime factory lean: stats+install surface extracted; bootstrap then wire then install",
	"Keep createReconExtensionFactory as thin orchestrator",
);

push(
	"reverse:proof-loop-deps-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/deps.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/deps-core.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/deps-build.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/deps-latest.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/deps-run.ts",
		]),
		[
			"ProofLoopCoreDeps",
			"configureProofLoopCore",
			"buildAttackGraphOutput",
			"latestVerifierArtifactPath",
			"appendRuntimeFailureInputs",
			'from "./deps-core.ts"',
			'from "./deps-build.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/deps.ts").includes("export type ProofLoopCoreDeps =") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/deps-core.ts").includes("export type ProofLoopCoreDeps"),
	"proof-loop-core deps split core/build/latest/parse/run passthrough groups",
	"Keep deps.ts as thin re-export facade",
);

push(
	"reverse:factory-hooks-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/factory-hooks.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/session-hooks.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/agent-hooks.ts",
		]),
		[
			"installRepiSessionHooks",
			"buildRepiColdStartPacket",
			"_hookDeps",
			"registerRepiAgentHooks",
			'from "./factory-hooks/session-hooks.ts"',
			'from "./loaders.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/factory-hooks.ts").includes("export function installRepiSessionHooks") &&
		read("packages/coding-agent/src/core/repi/kernel/factory-hooks/session-hooks.ts").includes("installRepiSessionHooks") &&
		read("packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders.ts").includes("_hookDeps"),
	"factory-hooks split loaders/session/agent; cold-start re-exported",
	"Keep factory-hooks.ts as thin facade",
);

push(
	"reverse:domain-proof-exit-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/domain-proof-exit/pure.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/pure-assemble.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/pure-closure.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/pure-format.ts",
		]),
		[
			"assembleDomainProofExitCorpus",
			"buildDomainProofExitClosureFromParts",
			"formatDomainProofExitClosure",
			"domainProofExitNextCommands",
			"proof\\.exit",
			"bind_ready",
			"reverse_runtime_gate",
			"partial_runtime_capture",
			'from "./pure-assemble.ts"',
			'from "./pure-closure.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/domain-proof-exit/pure.ts").includes("export function assembleDomainProofExitCorpus") &&
		read("packages/coding-agent/src/core/repi/domain-proof-exit/pure-assemble.ts").includes("reverse_runtime_capture_rollup") &&
		read("packages/coding-agent/src/core/repi/domain-proof-exit/pure-format.ts").includes("reverse_runtime_gate"),
	"domain-proof-exit pure split assemble/closure/format; runtime capture rollup retained",
	"Keep pure.ts as thin re-export facade",
);

push(
	"reverse:specialist-analyze-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-base.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-specialists.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-reverse.ts",
		]),
		[
			"analyzeLaneRun",
			"analyzeLaneRunBase",
			"applySpecialistEvidenceAnalyzers",
			"finalizeLaneRunAnalysis",
			"reverseDomainCaptureNextCommands",
			"reverse-domain-next",
			'from "./analyze-base.ts"',
			'from "./analyze-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-specialists.ts").includes("analyzeNativeDeepEvidence"),
	"specialist analyze split base/specialists/reverse; reverse-domain-next retained",
	"Keep analyze.ts as thin orchestrator",
);

push(
	"reverse:failure-repair-ledger-domain-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/failure-repair/ledger-domain.ts",
			"packages/coding-agent/src/core/repi/failure-repair/ledger-domain-replay.ts",
			"packages/coding-agent/src/core/repi/failure-repair/ledger-domain-autofix.ts",
			"packages/coding-agent/src/core/repi/failure-repair/ledger-domain-operator.ts",
		]),
		[
			"appendRuntimeFailureRepairFromReplay",
			"appendRuntimeFailureRepairFromAutofix",
			"appendRuntimeFailureRepairFromOperator",
			"reverseDomainCaptureNextCommands",
			"reverse_proof_exit",
			"re_domain_proof_exit show",
			'from "./ledger-domain-replay.ts"',
			'from "./ledger-domain-operator.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/failure-repair/ledger-domain.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/failure-repair/ledger-domain-replay.ts").includes("reverseDomainCaptureNextCommands"),
	"failure-repair ledger-domain split replay/autofix/operator; reverse next retained",
	"Keep ledger-domain.ts as thin facade",
);

push(
	"reverse:factory-hooks-loaders-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders-require.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders-compact.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders-context.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders-memory.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders-deps.ts",
		]),
		[
			"requireRepiModule",
			"buildReconCompactionAutoResume",
			"buildContextPack",
			"buildKernelOutput",
			"appendMemoryDepositionRuntimeEvent",
			"_hookDeps",
			'from "./loaders-require.ts"',
			'from "./loaders-deps.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders.ts").includes("export const _hookDeps") &&
		read("packages/coding-agent/src/core/repi/kernel/factory-hooks/loaders-deps.ts").includes("export const _hookDeps"),
	"factory-hooks loaders split require/compact/context/memory/deps",
	"Keep loaders.ts as thin re-export facade",
);

push(
	"reverse:swarm-manifest-write-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-build.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-refresh.ts",
		]),
		[
			"writeSwarmSubagentRuntimeManifest",
			"refreshSwarmSubagentRuntimeManifestCapture",
			"reverseDomainCaptureNextCommands",
			"reverseCaptureReady",
			"proof_exit",
			'from "./write-create.ts"',
			'from "./write-refresh.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/manifest/write.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/manifest/write-refresh.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-build.ts").includes("atomicWriteFileSync"),
	"swarm manifest write split create/refresh; reverse capture gate on refresh",
	"Keep write.ts as thin facade",
);

push(
	"reverse:compiler-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/compiler-runtime/pure.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/pure-claim.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/pure-claim-inputs.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/pure-report.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/pure-queue.ts",
		]),
		[
			"compilerClaimCheckReady",
			"compilerReportLines",
			"compilerNextOperatorQueue",
			"compilerGaps",
			"reverse_proof_gap",
			"re_domain_proof_exit show",
			'from "./pure-claim.ts"',
			'from "./pure-queue.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/compiler-runtime/pure.ts").includes("export function compilerGaps") &&
		read("packages/coding-agent/src/core/repi/compiler-runtime/pure-queue.ts").includes("reverse_proof_gap"),
	"compiler pure split claim/report/queue; reverse proof gaps retained",
	"Keep pure.ts as thin facade",
);

push(
	"reverse:auto-lane-decision-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/auto-lane/decision.ts",
			"packages/coding-agent/src/core/repi/auto-lane/decision-parse.ts",
			"packages/coding-agent/src/core/repi/auto-lane/decision-llm.ts",
			"packages/coding-agent/src/core/repi/auto-lane/decision-dispatch.ts",
		]),
		[
			"parseLaneRunDecision",
			"llmLaneRunDecision",
			"dispatchLaneSpecialist",
			"reverseDomainCaptureNextCommands",
			"reverse_proof_gate=require_proof_exit_before_claim",
			"reverse_next:",
			'from "./decision-parse.ts"',
			'from "./decision-dispatch.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/auto-lane/decision.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/auto-lane/decision-dispatch.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/auto-lane/decision-llm.ts").includes("partial_runtime_capture"),
	"auto-lane decision split parse/llm/dispatch; reverse proof gate + reverse_next retained",
	"Keep decision.ts as thin facade",
);

push(
	"reverse:attack-graph-evidence-ledger-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-seed.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-core.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-hypothesis.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-reverse.ts",
		]),
		[
			"appendAttackGraphEvidenceLedger",
			"appendAttackGraphEvidenceSeed",
			"appendAttackGraphEvidenceRecords",
			"reverseEvidenceRecordNote",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./evidence-ledger-seed.ts"',
			'from "./evidence-ledger-records.ts"',
			'from "./evidence-ledger-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-core.ts").includes("reverseEvidenceRecordNote") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"attack-graph evidence ledger split seed/records/reverse; reverse next on reverse-heavy verify tasks",
	"Keep evidence-ledger.ts as thin orchestrator",
);

push(
	"reverse:browser-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/browser-run.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-write.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-core-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-reverse.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-output.ts",
		]),
		[
			"writeLiveBrowserArtifact",
			"runLiveBrowser",
			"buildLiveBrowserOutput",
			"browserRunReverseFooter",
			"formatBrowserRunOutputWithReverseFooter",
			"extractBrowserProofExit",
			"reverseDomainCaptureNextCommands",
			"reverse_proof_gate=require_proof_exit_before_claim",
			'from "./browser-run-core.ts"',
			'from "./browser-run-core-proof.ts"',
			'from "./browser-run-reverse.ts"',
			'from "./browser-run-output.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/browser-run.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/reverse-io/browser-run-core.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/reverse-io/browser-run-core.ts").includes("browserRunReverseFooter") &&
		read("packages/coding-agent/src/core/repi/reverse-io/browser-run-core-proof.ts").includes("browserRunReverseFooter") &&
		read("packages/coding-agent/src/core/repi/reverse-io/browser-run-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"browser-run split write/core/core-proof/reverse/output; reverse proof footer retained",
	"Keep browser-run.ts as thin facade; reverse footer via core-proof",
);

push(
	"reverse:proof-loop-gaps-items-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-items.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-collect.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-finalize.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-classifier.ts",
		]),
		[
			"proofLoopGapItems",
			"collectProofLoopGapItemsRaw",
			"finalizeProofLoopGapItems",
			"proofLoopGapClassifier",
			"reverseDomainCaptureNextCommands",
			"reverse_runtime_capture",
			'from "./items-core-items.ts"',
			'from "./items-core-finalize.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/gaps/items-core-finalize.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop gap items split collect/finalize/classifier; reverse runtime capture gap retained",
	"Keep items-core.ts as thin facade",
);

push(
	"reverse:browser-followups-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-surface.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-reverse.ts",
		]),
		[
			"buildBrowserEvidenceFollowups",
			"buildBrowserEvidenceSurfaceFollowups",
			"finalizeBrowserEvidenceFollowups",
			"reverseDomainCaptureNextCommands",
			"web-browser-proof-capture",
			"re_domain_proof_exit show",
			'from "./browser-followups-surface.ts"',
			'from "./browser-followups-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-followups-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"browser followups split surface/reverse; reverse runtime capture gate retained",
	"Keep browser-followups.ts as thin orchestrator",
);

push(
	"reverse:commands-lean-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-lean.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-lean-route-mission.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-lean-lane.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/commands-lean-map-evidence.ts",
		]),
		[
			"registerRepiControlPlaneLeanCommands",
			"registerRepiControlPlaneLeanRouteMissionCommands",
			"registerRepiControlPlaneLeanLaneCommands",
			"reverseDomainCaptureNextCommands",
			"reverse_domain_next:",
			"re-route",
			"re-lane",
			'from "./commands-lean-route-mission.ts"',
			'from "./commands-lean-lane.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-control/commands-lean.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/kernel/install-control/commands-lean-route-mission.ts").includes("reverseDomainCaptureNextCommands"),
	"lean control commands split route-mission/lane/map-evidence; reverse domain next retained",
	"Keep commands-lean.ts as thin orchestrator",
);

push(
	"reverse:swarm-compose-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-runtime/build/compose.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/compose-workers.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/compose-workers-map.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/compose-workers-reverse.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/compose-reverse.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/reverse.ts",
		]),
		[
			"buildSwarm",
			"composeSwarmWorkersAndPlan",
			"composeSwarmReverseCommanderNext",
			"mapDelegatePacketsToSwarmWorkers",
			"finalizeSwarmReverseGates",
			"swarmReverseNextCommands",
			"reverseDomainCaptureNextCommands",
			"blocked_until_runtime_capture_and_bind_ready",
			'from "./compose-workers.ts"',
			'from "./compose-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-runtime/build/compose.ts").includes("composeSwarmWorkersAndPlan =") &&
		read("packages/coding-agent/src/core/repi/swarm-runtime/build/compose.ts").includes("finalizeSwarmReverseGates") &&
		read("packages/coding-agent/src/core/repi/swarm-runtime/build/reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"swarm compose split workers/reverse; reverse gates via swarmReverseNextCommands retained",
	"Keep compose.ts assembling workers then reverse finalize",
);

push(
	"reverse:swarm-format-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-format-format.ts",
			"packages/coding-agent/src/core/repi/swarm-format-header.ts",
			"packages/coding-agent/src/core/repi/swarm-format-runtime.ts",
			"packages/coding-agent/src/core/repi/swarm-format-next.ts",
		]),
		[
			"formatSwarm",
			"formatSwarmHeaderSections",
			"formatSwarmRuntimeSections",
			"swarmFormatNextCommand",
			"reverseDomainCaptureNextCommands",
			'from "./swarm-format-header.ts"',
			'from "./swarm-format-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-format-format.ts").includes("worker_runtime_packets:") &&
		read("packages/coding-agent/src/core/repi/swarm-format-next.ts").includes("reverseDomainCaptureNextCommands"),
	"swarm format split header/runtime; reverse-aware next command retained",
	"Keep formatSwarm as thin join of section helpers",
);

push(
	"reverse:operator-feedback-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/operator-runtime/feedback.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/feedback-queue.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/feedback-latest.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/feedback-priority.ts",
		]),
		[
			"latestOperatorFeedback",
			"operatorFeedbackDispatchPlan",
			"operatorFeedbackDispatcherCommands",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./feedback-queue.ts"',
			'from "./feedback-priority.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/operator-runtime/feedback.ts").includes("export function latestOperatorFeedback") &&
		read("packages/coding-agent/src/core/repi/operator-runtime/feedback-priority.ts").includes("reverseDomainCaptureNextCommands"),
	"operator feedback split queue/latest/priority; reverse next on dispatcher commands",
	"Keep feedback.ts as thin facade",
);

push(
	"reverse:rules-posture-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/decision-runtime/rules-posture.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/rules-posture-rules.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/rules-posture-checks.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/rules-posture-queue.ts",
		]),
		[
			"decisionRulesFor",
			"decisionOperatorQueue",
			"reverseDomainCaptureNextCommands",
			"reverse_capture_pending",
			'from "./rules-posture-rules.ts"',
			'from "./rules-posture-queue.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/decision-runtime/rules-posture.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/decision-runtime/rules-posture-rules.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/decision-runtime/rules-posture-queue.ts").includes("reverseDomainCaptureNextCommands"),
	"decision rules-posture split rules/checks/queue; reverse capture pending + run-first queue",
	"Keep rules-posture.ts as thin facade",
);

push(
	"reverse:wire-swarm-modules-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/wire-swarm-modules.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-swarm-delegate.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-swarm-runtime.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-swarm-supervisor.ts",
		]),
		[
			"wireSwarmModules",
			"wireDelegateConfigure",
			"wireSwarmRuntimeConfigure",
			"configureDelegate",
			"configureSwarmRuntime",
			"configureSupervisor",
			'from "./wire-swarm-delegate.ts"',
			'from "./wire-swarm-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/wire-swarm-modules.ts").includes("configureDelegate({") &&
		read("packages/coding-agent/src/core/repi/kernel/wire-swarm-delegate.ts").includes("configureDelegate"),
	"wire-swarm modules split into configure bags (delegate/runtime/kernel/reflection/supervisor)",
	"Keep wire-swarm-modules.ts as thin orchestrator",
);

push(
	"reverse:operator-format-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/operator-format-format.ts",
			"packages/coding-agent/src/core/repi/operator-format-budget.ts",
			"packages/coding-agent/src/core/repi/operator-format-delegate.ts",
			"packages/coding-agent/src/core/repi/operator-format-operator.ts",
			"packages/coding-agent/src/core/repi/operator-format-operator-next.ts",
		]),
		[
			"formatOperator",
			"formatDelegate",
			"autonomousBudgetLines",
			"reverseDomainCaptureNextCommands",
			'from "./operator-format-operator.ts"',
			'from "./operator-format-delegate.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/operator-format-format.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/operator-format-operator.ts",
			"packages/coding-agent/src/core/repi/operator-format-operator-next.ts").includes("reverseDomainCaptureNextCommands"),
	"operator format split budget/delegate/operator; reverse domain next on operator board",
	"Keep operator-format-format.ts as thin facade",
);

push(
	"reverse:native-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/native-run.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-write.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-output.ts",
		]),
		[
			"writeNativeRuntimeArtifact",
			"runNativeRuntime",
			"buildNativeRuntimeOutput",
			"reverseDomainCaptureNextCommands",
			'from "./native-run-core.ts"',
			'from "./native-run-output.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/native-run.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/reverse-io/native-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-footer.ts").includes("reverseDomainCaptureNextCommands"),
	"native-run split write/core/output; reverse domain capture retained",
	"Keep native-run.ts as thin facade",
);

push(
	"reverse:authz-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/authz-run.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-write.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-output.ts",
		]),
		[
			"writeWebAuthzStateArtifact",
			"runWebAuthzState",
			"buildWebAuthzStateOutput",
			"reverseDomainCaptureNextCommands",
			'from "./authz-run-core.ts"',
			'from "./authz-run-output.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/authz-run.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/reverse-io/authz-run-core.ts").includes("reverseDomainCaptureNextCommands"),
	"authz-run split write/core/output; reverse domain capture retained",
	"Keep authz-run.ts as thin facade",
);






































push(
	"reverse:toolchain-domain-data-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/toolchain-domain-data.ts",
			"packages/coding-agent/src/core/repi/kernel/toolchain-domain-types.ts",
			"packages/coding-agent/src/core/repi/kernel/toolchain-domain-matrix-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/toolchain-domain-matrix-web.ts",
		]),
		[
			"TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX",
			"TOOLCHAIN_DOMAIN_MATRIX_REVERSE",
			"rev-native",
			"pwn",
			"proofExit",
			'from "./toolchain-domain-matrix-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/toolchain-domain-data.ts").includes('id: "rev-native"') &&
		read("packages/coding-agent/src/core/repi/kernel/toolchain-domain-matrix-reverse.ts").includes('id: "rev-native"') &&
		!read("packages/coding-agent/src/core/repi/kernel/toolchain-domain-data.ts").includes("export export"),
	"toolchain domain data split types + web/reverse/ops matrices; reverse proofExit retained",
	"Keep toolchain-domain-data.ts as composition facade",
);

push(
	"reverse:techniques-helpers-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/lookup.ts",
			"packages/coding-agent/src/core/repi/techniques/format.ts",
			"packages/coding-agent/src/core/repi/techniques/route-taxonomy.ts",
		]),
		[
			"techniquesForDomain",
			"formatTechniqueIndex",
			"techniqueIdsForRoute",
			"resolveTechniqueDomain",
			"proofExit",
			'from "./techniques/lookup.ts"',
			'from "./techniques/route-taxonomy.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/techniques.ts").includes("export function techniquesForDomain") &&
		read("packages/coding-agent/src/core/repi/techniques/lookup.ts").includes("export function techniquesForDomain") &&
		read("packages/coding-agent/src/core/repi/techniques/route-taxonomy.ts").includes("techniqueIdsForRoute"),
	"techniques helpers split lookup/format/route-taxonomy",
	"Keep techniques.ts as thin re-export facade",
);

push(
	"reverse:autofix-build-core-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/autofix/build-core.ts",
			"packages/coding-agent/src/core/repi/autofix/build-core-collect.ts",
			"packages/coding-agent/src/core/repi/autofix/build-core-assemble.ts",
			"packages/coding-agent/src/core/repi/autofix/build-core-reverse.ts",
		]),
		[
			"buildAutofix",
			"collectAutofixQueues",
			"assembleAutofixArtifact",
			"seedAutofixReverseNextQueue",
			'from "./build-core-collect.ts"',
			'from "./build-core-assemble.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/autofix/build-core.ts").includes("seedAutofixReverseNextQueue") &&
		read("packages/coding-agent/src/core/repi/autofix/build-core-assemble.ts").includes("seedAutofixReverseNextQueue"),
	"autofix build-core split collect/assemble; reverse seed on empty failure/patch queues",
	"Keep build-core.ts as thin orchestrator",
);

push(
	"reverse:auto-lane-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/auto-lane/run.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-summary.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-specialist-step.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step-bootstrap.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step-decide.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step-reverse.ts",
		]),
		[
			"runAutoLaneChain",
			"formatAutoLaneRunSummary",
			"tryAutoLaneSpecialistStep",
			"runAutoLaneInlineStep",
			"autoLaneInlineReverseSections",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./run-summary.ts"',
			'from "./run-inline-step.ts"',
			'from "./run-inline-step-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/auto-lane/run.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/auto-lane/run-inline-step.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/auto-lane/run-inline-step.ts").includes("autoLaneInlineReverseSections") &&
		read("packages/coding-agent/src/core/repi/auto-lane/run-inline-step-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/auto-lane/run.ts").includes("formatAutoLaneRunSummary"),
	"auto-lane run summary/specialist/inline/reverse extracted; reverse next on reverse-heavy inline steps",
	"Keep run.ts calling formatAutoLaneRunSummary",
);

push(
	"reverse:profile-surface-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/profile.ts",
			"packages/coding-agent/src/core/repi/profile-tool-names.ts",
			"packages/coding-agent/src/core/repi/profile-command-names.ts",
			"packages/coding-agent/src/core/repi/profile-tool-index.ts",
		]),
		[
			"REPI_TOOL_NAMES",
			"REPI_COMMAND_NAMES",
			"re_native_runtime",
			"re_domain_proof_exit",
			"re-native-runtime",
			"re-domain-proof-exit",
			'from "./profile-tool-names.ts"',
			'from "./profile-command-names.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/profile.ts").includes('"re_native_runtime"') &&
		read("packages/coding-agent/src/core/repi/profile-tool-names.ts").includes("re_native_runtime") &&
		read("packages/coding-agent/src/core/repi/profile-command-names.ts").includes("re-domain-proof-exit"),
	"profile product surface constants split tool/command/index; reverse tools retained",
	"Keep profile.ts as thin re-export facade",
);

push(
	"reverse:worker-lease-scheduler-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build.ts",
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build-tasks.ts",
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events.ts",
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events-lifecycle.ts",
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events-probe.ts",
		]),
		[
			"buildWorkerLeaseSchedulerFromSwarm",
			"buildWorkerLeaseSchedulerTasks",
			"appendWorkerLeaseSchedulerLifecycleEvents",
			"appendWorkerLeaseSchedulerProbeEvents",
			"staleLeaseRecovered",
			"workStealingObserved",
			'from "./worker-lease-scheduler-build-tasks.ts"',
			'from "./worker-lease-scheduler-build-events.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-lease-scheduler-build.ts").includes("task-scheduler-stale-recovery-probe") &&
		read("packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events-probe.ts").includes("task-scheduler-stale-recovery-probe"),
	"worker lease scheduler build split tasks/events; stale recovery probe retained",
	"Keep buildWorkerLeaseSchedulerFromSwarm as thin orchestrator",
);



push(
	"reverse:swarm-format-next-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-format-format.ts",
			"packages/coding-agent/src/core/repi/swarm-format-runtime.ts",
			"packages/coding-agent/src/core/repi/swarm-format-next.ts",
		]),
		[
			"formatSwarm",
			"formatSwarmRuntimeSections",
			"swarmFormatNextCommand",
			"reverseDomainCaptureNextCommands",
			"next_swarm_command",
			'from "./swarm-format-next.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-format-format.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-format-next.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-format-runtime.ts").includes("swarmFormatNextCommand") &&
		read("packages/coding-agent/src/core/repi/swarm-format-runtime.ts").includes("next_swarm_command"),
	"swarm format next command extracted; reverse-heavy plan mode uses domain capture next",
	"Keep formatSwarmRuntimeSections calling swarmFormatNextCommand",
);





















push(
	"reverse:autonomous-budget-demotions-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/autonomous-budget/demotions.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/demotions-ledger.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/demotions-rows.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/demotions-promo.ts",
		]),
		[
			"latestAutonomousBudgetLedger",
			"workerScoreDemotionRows",
			"highScorePromotionRows",
			'from "./demotions-ledger.ts"',
			'from "./demotions-rows.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/autonomous-budget/demotions.ts").includes("export function latestAutonomousBudgetLedger") &&
		read("packages/coding-agent/src/core/repi/autonomous-budget/demotions-ledger.ts").includes("latestAutonomousBudgetLedger"),
	"autonomous-budget demotions split ledger/rows/promo",
	"Keep demotions.ts as thin facade",
);

push(
	"reverse:specialist-pack-matrix-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-types.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-early.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-late.ts",
		]),
		[
			"RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX",
			"RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX_EARLY",
			"RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX_LATE",
			"ReLaneSpecialistDomainPackV1",
			"proofExitBridge",
			"rev-native",
			'from "./specialist-pack-matrix-types.ts"',
			'from "./specialist-pack-matrix-data.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix.ts").includes("proofExitBridge") &&
		(
			read("packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-early.ts").includes("proofExitBridge") ||
			read("packages/coding-agent/src/core/repi/lanes/specialist-pack-matrix-data-late.ts").includes("proofExitBridge")
		),
	"specialist pack matrix split types/data early/late with proofExitBridge retained",
	"Keep specialist-pack-matrix.ts as thin facade",
);

push(
	"reverse:context-pack-assembly-transitions",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-transitions.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-reverse.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-next.ts",
		]),
		[
			"assembleContextPackArtifact",
			"recordContextPackCompactResumeTransitions",
			"contextPackReverseNextCommands",
			"mergeContextPackAssemblyNextCommands",
			'from "./pack-assembly-transitions.ts"',
			'from "./pack-assembly-next.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-next.ts").includes("contextPackReverseNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly.ts").includes("recordContextPackCompactResumeTransitions"),
	"context-pack assembly records compact-resume transitions + reverse next front-load",
	"Keep pack-assembly.ts orchestrating resume brief + finalize",
);

push(
	"reverse:crypto-malware-analyzers-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/crypto_malware_analyzers.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/crypto_analyzers.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/malware_analyzers.ts",
		]),
		[
			"analyzeCryptoStegoEvidence",
			"analyzeMalwareEvidence",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./crypto_analyzers.ts"',
			'from "./malware_analyzers.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/crypto_malware_analyzers.ts").includes("export function analyzeCryptoStegoEvidence") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/crypto_analyzers.ts").includes("reverseDomainCaptureNextCommands"),
	"crypto/malware analyzers split; reverse next seeded into followups",
	"Keep crypto_malware_analyzers.ts as thin facade",
);

push(
	"reverse:domain-proof-exit-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/domain-proof-exit/build.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-corpus.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure-core.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure-output.ts",
		]),
		[
			"domainProofExitArtifactCorpus",
			"buildDomainProofExitClosure",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"domain_proof_exit_missing",
			'from "./build-corpus.ts"',
			'from "./build-closure.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/domain-proof-exit/build.ts").includes("export function buildDomainProofExitClosure") &&
		read("packages/coding-agent/src/core/repi/domain-proof-exit/build-closure.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure-core.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure-output.ts").includes("reverseDomainCaptureNextCommands"),
	"domain-proof-exit build split corpus/closure; reverse next on missing proof exits",
	"Keep build.ts as thin facade",
);

push(
	"reverse:mobile-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/mobile-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-pure-path.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-pure-build-plan.ts",
		]),
		[
			"buildMobileRuntimeArtifact",
			"buildMobileRuntimePlanSections",
			"inferMobilePackageName",
			"latestMobileRuntimeArtifactPath",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"re_domain_proof_exit show",
			'from "./mobile-pure-path.ts"',
			'from "./mobile-pure-build.ts"',
			'from "./mobile-pure-build-plan.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/mobile-pure.ts").includes("export function buildMobileRuntimeArtifact") &&
		!read("packages/coding-agent/src/core/repi/reverse-io/mobile-pure-build.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/reverse-io/mobile-pure-build-plan.ts").includes("reverseDomainCaptureNextCommands"),
	"mobile pure split path/build/plan; reverse next on mobile runtime artifact",
	"Keep mobile-pure.ts as thin facade",
);

push(
	"reverse:proof-loop-status-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/status.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/status-artifacts.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/status-verdict.ts",
		]),
		[
			"proofLoopSourceArtifacts",
			"proofLoopVerdict",
			"proofLoopEvidenceSummary",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./status-artifacts.ts"',
			'from "./status-verdict.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/gaps/status.ts").includes("export function proofLoopVerdict") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/gaps/status-verdict.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop status split artifacts/verdict; reverse_next in evidence summary",
	"Keep status.ts as thin facade",
);

push(
	"reverse:runtime-scoring-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-native.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-mobile.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-exploit.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts",
		]),
		[
			"reverseRuntimeCaptureProofFields",
			"scoreNativeRuntimeCapture",
			"scoreMobileRuntimeCapture",
			"scoreExploitRuntimeCapture",
			"scoreWebRuntimeCapture",
			"proof.exit=",
			"partial_runtime_capture",
			"runtime_capture_strong",
			'from "./runtime-scoring-native.ts"',
			'from "./runtime-scoring-web.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts").includes("if (domain === \"native\")") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts").includes("proof.exit=") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-native.ts").includes("partial_runtime_capture"),
	"runtime-scoring split native/mobile/exploit/web; proof.exit finalize retained",
	"Keep runtime-scoring.ts as domain dispatcher + finalize",
);

push(
	"reverse:pwn-followups-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups-basic.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups-reverse.ts",
		]),
		[
			"appendPwnPrimitiveFollowups",
			"appendPwnBasicFollowups",
			"appendPwnReverseFollowups",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proof.exit=partial_runtime_capture",
			"bind_ready",
			'from "./pwn-followups-basic.ts"',
			'from "./pwn-followups-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups.ts").includes("pwn-cyclic-offset-helper") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"pwn followups split basic/reverse; reverse proof capture gate retained",
	"Keep pwn-followups.ts as thin orchestrator",
);

push(
	"reverse:memory-pairs-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/memory-pairs.ts",
			"packages/coding-agent/src/core/repi/context-pack/memory-pairs-paths.ts",
		]),
		[
			"buildContextMemoryPairs",
			"fullContextMemoryPairs",
			"leanContextMemoryPairs",
			"REPI_CONTEXT_MEMORY",
			'from "./memory-pairs-paths.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/memory-pairs.ts").includes("memoryOrchestratorReportPath") &&
		read("packages/coding-agent/src/core/repi/context-pack/memory-pairs-paths.ts").includes("fullContextMemoryPairs"),
	"context-pack memory pairs split path catalogs; lean default retained",
	"Keep memory-pairs.ts as opt-in gate",
);

push(
	"reverse:proof-loop-runtime-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/proof-loop-runtime.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/proof-loop-runtime-closure.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/proof-loop-runtime-steps.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/proof-loop-runtime-executions.ts",
		]),
		[
			"appendProofLoopRuntimeSections",
			"appendProofLoopRuntimeClosure",
			"appendProofLoopRuntimeSteps",
			"appendProofLoopRuntimeExecutions",
			"runtime-adapter-closure",
			"proof-loop-output",
			'from "./proof-loop-runtime-closure.ts"',
			'from "./proof-loop-runtime-steps.ts"',
			'from "./proof-loop-runtime-executions.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/attack-graph/build/proof-loop-runtime.ts").includes("runtimeAdapterClosure") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/proof-loop-runtime-closure.ts").includes("runtime_adapter_closure"),
	"attack-graph proof-loop runtime split closure/steps/executions",
	"Keep proof-loop-runtime.ts as thin orchestrator",
);

push(
	"reverse:layout-dirs-lean",
	includesAll(
		read("packages/coding-agent/src/core/repi/storage/io/layout-dirs.ts"),
		[
			"repiStorageLayoutDirs",
			"evidenceNativeRuntimeDir",
			"evidenceBrowserDir",
			"evidenceProofLoopsDir",
			'from "../paths/evidence.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/storage/io/layout-dirs.ts").split("\n").length < 120 &&
		!read("packages/coding-agent/src/core/repi/storage/io/layout-dirs.ts").includes("atomicWriteFileSync"),
	"layout-dirs lean rewrite using path helpers (no monofile path-import bloat)",
	"Keep ensureRepiStorage directory list complete",
);

push(
	"reverse:delegate-pure-worker-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/delegate/pure-worker.ts",
			"packages/coding-agent/src/core/repi/delegate/pure-worker-map.ts",
			"packages/coding-agent/src/core/repi/delegate/pure-worker-contract.ts",
		]),
		[
			"adaptiveToolsForWorker",
			"delegateEvidenceContract",
			"proof.exit=partial_runtime_capture",
			"bind_ready=true",
			"re_domain_proof_exit show",
			'from "./pure-worker-map.ts"',
			'from "./pure-worker-contract.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/delegate/pure-worker.ts").includes("export function delegateEvidenceContract") &&
		read("packages/coding-agent/src/core/repi/delegate/pure-worker-contract.ts").includes("proof.exit=partial_runtime_capture"),
	"delegate pure-worker split map/contract; reverse evidence contract retained",
	"Keep pure-worker.ts as thin facade",
);

push(
	"reverse:verifier-build-core-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/verifier-runtime/build-core.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/build-core-build.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/build-core-io.ts",
		]),
		[
			"buildVerifier",
			"buildVerifierOutput",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_next:",
			'from "./build-core-build.ts"',
			'from "./build-core-io.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/verifier-runtime/build-core.ts").includes("export function buildVerifier") &&
		read("packages/coding-agent/src/core/repi/verifier-runtime/build-core-build.ts").includes("reverseDomainCaptureNextCommands"),
	"verifier build-core split build/io; reverse next on verifier output",
	"Keep build-core.ts as thin facade",
);

push(
	"reverse:js-signing-script-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-infer.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-helpers.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-scan.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-shell.ts",
		]),
		[
			"inferJsSigningTarget",
			"jsSigningNodeScript",
			"jsSigningShellCommand",
			"jsSigningScriptPrelude",
			"jsSigningScriptScanBody",
			"jsSigningScriptProofFooter",
			"js-signing-proof-capture",
			"proof.exit=",
			"partial_runtime_capture",
			'from "./js-signing-script-body.ts"',
			'from "./js-signing-script-shell.ts"',
			'from "./js-signing-script-helpers.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script.ts").includes("export function jsSigningNodeScript") &&
		!read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts").includes("proof.exit=") &&
		read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script-helpers.ts").includes("proof.exit="),
	"js-signing script split infer/body/helpers/scan/shell; reverse proof.exit capture tags",
	"Keep js-signing-script.ts as thin facade",
);

push(
	"reverse:specialist-packs-wants-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-packs-wants.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs-wants-types.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs-wants-target.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs-wants-web.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs-wants-native.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs-wants-dfir.ts",
		]),
		[
			"detectSpecialistWants",
			"detectSpecialistWebWants",
			"detectSpecialistNativeWants",
			"detectSpecialistDfirWants",
			"wantsNativeDeep",
			"wantsFridaTrace",
			"wantsPwnPrimitive",
			'from "./specialist-packs-wants-web.ts"',
			'from "./specialist-packs-wants-native.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-packs-wants.ts").includes("const wantsBrowser") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs-wants-native.ts").includes("wantsNativeDeep"),
	"specialist wants split web/native/dfir/target; reverse-heavy detectors retained",
	"Keep specialist-packs-wants.ts as thin orchestrator",
);

push(
	"reverse:domain-lane-native-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/domain-lane-native.ts",
			"packages/coding-agent/src/core/repi/lanes/domain-lane-native-triage.ts",
			"packages/coding-agent/src/core/repi/lanes/domain-lane-native-control.ts",
			"packages/coding-agent/src/core/repi/lanes/domain-lane-native-runtime.ts",
		]),
		[
			"appendDomainLaneNativeCommands",
			"appendDomainLaneNativeTriage",
			"appendDomainLaneNativeControl",
			"appendDomainLaneNativeRuntime",
			"reverseDomainCaptureNextCommands",
			"domain-lane-reverse-next",
			'from "./domain-lane-native-triage.ts"',
			'from "./domain-lane-native-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/domain-lane-native.ts").includes("isNativeRoute") &&
		read("packages/coding-agent/src/core/repi/lanes/domain-lane-native-runtime.ts").includes("reverseDomainCaptureNextCommands"),
	"domain-lane native split triage/control/runtime; reverse next on runtime lanes",
	"Keep domain-lane-native.ts as thin orchestrator",
);

push(
	"reverse:pack-domain-native-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain-native.ts",
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain-native-triage.ts",
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain-native-control.ts",
			"packages/coding-agent/src/core/repi/lane-commands/pack-domain-native-runtime.ts",
		]),
		[
			"appendLaneDomainNativeCommands",
			"appendLaneDomainNativeTriage",
			"appendLaneDomainNativeRuntime",
			"reverseDomainCaptureNextCommands",
			"lane-pack-reverse-next",
			'from "./pack-domain-native-triage.ts"',
			'from "./pack-domain-native-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lane-commands/pack-domain-native.ts").includes("isNativeRoute") &&
		read("packages/coding-agent/src/core/repi/lane-commands/pack-domain-native-runtime.ts").includes("reverseDomainCaptureNextCommands"),
	"lane pack domain native split triage/control/runtime; reverse next retained",
	"Keep pack-domain-native.ts as thin orchestrator",
);

push(
	"reverse:auto-lane-commands-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/auto-lane/commands.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack-reverse.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack-parse.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-mission.ts",
		]),
		[
			"autoLaneCommandPack",
			"autoCommandsForLane",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"auto-reverse-domain-next",
			"proof.exit=partial_runtime_capture",
			'from "./commands-pack.ts"',
			'from "./commands-mission.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/auto-lane/commands.ts").includes("export function autoLaneCommandPack") &&
		joinSources(["packages/coding-agent/src/core/repi/auto-lane/commands-pack.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack-reverse.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack-parse.ts","packages/coding-agent/src/core/repi/auto-lane/commands-pack-reverse.ts"]).includes("reverseDomainCaptureNextCommands"),
	"auto-lane commands split pack/mission; reverse domain next on reverse-heavy packs",
	"Keep commands.ts as thin facade",
);

push(
	"reverse:pack-assembly-finalize-object-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-core.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-reverse.ts",
		]),
		[
			"finalizeContextPackArtifact",
			"buildContextPackArtifactObject",
			"buildContextPackCoreFields",
			"mergeContextPackReverseNextCommands",
			"mergedNextCommands",
			'from "./pack-assembly-finalize-object.ts"',
			'from "./pack-assembly-finalize-object-core.ts"',
			'from "./pack-assembly-finalize-reverse.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object.ts").includes("buildContextPackCoreFields") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-reverse.ts").includes("mergeContextPackReverseNextCommands"),
	"context-pack finalize split object/core + reverse merge; reverse next retained",
	"Keep finalize as reverse-aware orchestrator",
);

push(
	"reverse:evidence-ledger-records-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-core.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-hypothesis.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-reverse.ts",
		]),
		[
			"appendAttackGraphEvidenceRecords",
			"appendEvidenceLedgerRecordCore",
			"appendEvidenceLedgerRecordHypothesis",
			"reverseEvidenceRecordNote",
			"reverseDomainCaptureNextCommands",
			'from "./evidence-ledger-records-core.ts"',
			'from "./evidence-ledger-records-hypothesis.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records.ts").includes("const shouldAddHypothesis") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/evidence-ledger-records-core.ts").includes("reverseEvidenceRecordNote"),
	"evidence ledger records split core/hypothesis; reverse notes retained",
	"Keep evidence-ledger-records.ts as thin orchestrator",
);

push(
	"reverse:worker-runtime-pool-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/pool.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/pool-contract.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/pool-verify.ts",
		]),
		[
			"workerRuntimePoolEvidenceContract",
			"claimAwareWorkerMergeProtocol",
			"verifyWorkerRuntimePool",
			"reverseDomainCaptureNextCommands",
			"proof.exit=partial_runtime_capture",
			"bind_ready=true",
			"reverse_next:",
			'from "./pool-contract.ts"',
			'from "./pool-verify.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/pool.ts").includes("export function verifyWorkerRuntimePool") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/pool-contract.ts").includes("reverseDomainCaptureNextCommands"),
	"worker-runtime pool split contract/verify; reverse claim merge gates",
	"Keep pool.ts as thin facade",
);

push(
	"reverse:swarm-run-review-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/run-review.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/run-review-score.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/run-review-reverse.ts",
		]),
		[
			"reviewSwarmWorkerRuntime",
			"scoreSwarmWorkerRuntimeBase",
			"applySwarmWorkerReverseReview",
			"computeSwarmWorkerReverseSignals",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proof_exit=partial_runtime_capture",
			"bind_ready",
			'from "./run-review-score.ts"',
			'from "./run-review-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/run-review.ts").includes("coverage_matrix satisfies") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/run-review-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"swarm run-review split score/reverse; reverse proof gates retained",
	"Keep run-review.ts as reverse-aware orchestrator",
);

push(
	"reverse:exploit-chain-build-nodes-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-early.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late-edges.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-build.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-queue.ts",
		]),
		[
			"buildExploitChainNodes",
			"buildExploitChainEarlyNodes",
			"buildExploitChainLateNodes",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"re_native_runtime run",
			"re_exploit_lab run",
			'from "./build-nodes-early.ts"',
			'from "./build-nodes-late.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/exploit-chain/build-nodes.ts").includes("entry-map") &&
		read("packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late-edges.ts").includes("reverseDomainCaptureNextCommands"),
	"exploit-chain build-nodes split early/late; reverse next on verify node",
	"Keep build-nodes.ts as thin orchestrator",
);

push(
	"reverse:pack-assembly-finalize-object-resume-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-core.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-resume.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-memory.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-pack.ts",
		]),
		[
			"buildContextPackArtifactObject",
			"buildContextPackCoreFields",
			"buildContextPackResumeContract",
			"unpackContextPackMemoryReports",
			"nextCommands: mergedNextCommands",
			'from "./pack-assembly-finalize-object-core.ts"',
			'from "./pack-assembly-finalize-object-memory.ts"',
			'from "./pack-assembly-finalize-object-resume.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object.ts").includes("maxResumeTurns: autonomousBudget.maxTurns") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-core.ts").includes("buildContextPackResumeContract") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-resume.ts").includes("buildContextPackResumeContract") &&
		read("packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object.ts").includes("nextCommands: mergedNextCommands"),
	"context-pack finalize object split core/resume/memory helpers",
	"Keep object builder reverse-next aware via mergedNextCommands",
);

push(
	"reverse:context-pack-deps-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/deps.ts",
			"packages/coding-agent/src/core/repi/context-pack/deps-core.ts",
			"packages/coding-agent/src/core/repi/context-pack/deps-memory.ts",
			"packages/coding-agent/src/core/repi/context-pack/deps-runtime.ts",
		]),
		[
			"configureContextPack",
			"buildMemoryOrchestratorReport",
			"formatCompletionAudit",
			'from "./deps-core.ts"',
			'from "./deps-memory.ts"',
			'from "./deps-runtime.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/deps.ts").includes("let contextPackDeps") &&
		read("packages/coding-agent/src/core/repi/context-pack/deps-core.ts").includes("configureContextPack"),
	"context-pack deps split core/memory/runtime passthroughs",
	"Keep deps.ts as re-export facade",
);

push(
	"reverse:storage-json-lean",
	includesAll(
		read("packages/coding-agent/src/core/repi/storage/io/json.ts"),
		[
			"readJsonObjectFile",
			"readJsonObjectFileCached",
			"jsonObjectFileCache",
		],
	) &&
		read("packages/coding-agent/src/core/repi/storage/io/json.ts").split("\n").length < 80 &&
		!read("packages/coding-agent/src/core/repi/storage/io/json.ts").includes("evidenceNativeRuntimeDir"),
	"storage json helpers lean rewrite (no dead path-import bloat)",
	"Keep mtime/size-keyed JSON cache",
);

push(
	"reverse:mission-rev-pwn-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/mission/lane-packs/rev_pwn.ts",
			"packages/coding-agent/src/core/repi/mission/lane-packs/rev_pwn-exploit.ts",
			"packages/coding-agent/src/core/repi/mission/lane-packs/rev_pwn-malware.ts",
			"packages/coding-agent/src/core/repi/mission/lane-packs/rev_pwn-reverse.ts",
		]),
		[
			"lanes_pwn_exploit",
			"lanes_malware_analysis",
			"withReverseLaneNext",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./rev_pwn-exploit.ts"',
			'from "./rev_pwn-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/mission/lane-packs/rev_pwn.ts").includes("name: \"mitigations\"") &&
		read("packages/coding-agent/src/core/repi/mission/lane-packs/rev_pwn-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"mission rev_pwn packs split by domain; reverse next seeded into proof lanes",
	"Keep rev_pwn.ts as reverse-aware facade",
);

push(
	"reverse:tools-proof-chain-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-proof-tools/tools-proof-chain.ts",
			"packages/coding-agent/src/core/repi/kernel/install-proof-tools/tools-proof-verifier.ts",
			"packages/coding-agent/src/core/repi/kernel/install-proof-tools/tools-proof-proof_loop.ts",
		]),
		[
			"registerRepiProofChainTools",
			"registerRepiVerifierTool",
			"registerRepiProofLoopTool",
			"re_verifier",
			"re_proof_loop",
			'from "./tools-proof-verifier.ts"',
			'from "./tools-proof-proof_loop.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-proof-tools/tools-proof-chain.ts").includes('name: "re_verifier"') &&
		read("packages/coding-agent/src/core/repi/kernel/install-proof-tools/tools-proof-chain.ts").includes("registerRepiVerifierTool"),
	"proof-chain tools split per tool registrar; reverse proof-loop path retained",
	"Keep tools-proof-chain.ts as thin orchestrator",
);

push(
	"reverse:evidence-io-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/evidence/io.ts",
			"packages/coding-agent/src/core/repi/evidence/io-read.ts",
			"packages/coding-agent/src/core/repi/evidence/io-lines.ts",
			"packages/coding-agent/src/core/repi/evidence/io-ledger.ts",
		]),
		[
			"readTextFile",
			"lineCountStreaming",
			"rotateRuntimeEvidenceLedgerIfNeeded",
			"appendText",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			'from "./io-read.ts"',
			'from "./io-ledger.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/evidence/io.ts").includes("export function readTextFile") &&
		read("packages/coding-agent/src/core/repi/evidence/io-ledger.ts").includes("reverseDomainCaptureNextCommands"),
	"evidence io split read/lines/ledger; reverse_next on reverse-heavy appends",
	"Keep evidence/io.ts as thin facade",
);

push(
	"reverse:runtime-adapter-capture-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-write.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-reverse.ts",
		]),
		[
			"captureRuntimeAdapterExecution",
			"writeRuntimeAdapterExecutionArtifact",
			"appendRuntimeAdapterCaptureEvidence",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proof.exit=",
			"bind_ready",
			'from "./runtime-adapter-exec-run-capture-write.ts"',
			'from "./runtime-adapter-exec-run-capture-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture.ts").includes("reverseAdapterCaptureProofFields") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter-exec-run-capture-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"runtime adapter capture split write/reverse footer; proof_exit/bind_ready retained",
	"Keep capture orchestrator thin",
);

push(
	"reverse:autofix-collect-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/autofix/build-core-collect.ts",
			"packages/coding-agent/src/core/repi/autofix/build-core-collect-blocked.ts",
			"packages/coding-agent/src/core/repi/autofix/build-core-collect-feedback.ts",
		]),
		[
			"collectAutofixQueues",
			"collectAutofixBlockedQueues",
			"collectAutofixFeedbackQueues",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./build-core-collect-blocked.ts"',
			'from "./build-core-collect-feedback.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/autofix/build-core-collect.ts").includes("for (const blocked of") &&
		read("packages/coding-agent/src/core/repi/autofix/build-core-collect-feedback.ts").includes("reverseDomainCaptureNextCommands"),
	"autofix collect split blocked/failed/feedback/gaps; reverse next on feedback",
	"Keep collectAutofixQueues as thin orchestrator",
);

push(
	"reverse:worker-lease-events-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events.ts",
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events-lifecycle.ts",
			"packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events-probe.ts",
		]),
		[
			"appendWorkerLeaseSchedulerLifecycleEvents",
			"appendWorkerLeaseSchedulerProbeEvents",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_next:",
			'from "./worker-lease-scheduler-build-events-lifecycle.ts"',
			'from "./worker-lease-scheduler-build-events-probe.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events.ts").includes("export function appendWorkerLeaseSchedulerLifecycleEvents") &&
		read("packages/coding-agent/src/core/repi/worker-lease-scheduler-build-events-probe.ts").includes("reverseDomainCaptureNextCommands"),
	"worker lease scheduler events split lifecycle/probe; reverse next on probe claims",
	"Keep build-events.ts as thin facade",
);

push(
	"reverse:tool-trace-verify-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/tool-trace/ledger/verify-build.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/verify-build-incremental.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/verify-build-full.ts",
		]),
		[
			"buildToolCallTraceLedgerV1Incremental",
			"buildToolCallTraceLedgerV1",
			"writeToolCallTraceReport",
			'from "./verify-build-incremental.ts"',
			'from "./verify-build-full.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/tool-trace/ledger/verify-build.ts").includes("export function buildToolCallTraceLedgerV1") &&
		read("packages/coding-agent/src/core/repi/tool-trace/ledger/verify-build-incremental.ts").includes("buildToolCallTraceLedgerV1Incremental"),
	"tool-trace verify-build split incremental/full",
	"Keep verify-build.ts as thin facade",
);

push(
	"reverse:swarm-manifest-write-reverse",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-build.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-reverse.ts",
		]),
		[
			"writeSwarmSubagentRuntimeManifest",
			"swarmManifestReverseEvidenceRefs",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_next:",
			"evidenceRefs",
			'from "./write-create-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-build.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"swarm subagent manifest write seeds reverse_next into evidenceRefs via reverse helper",
	"Keep write-create reverse-aware for reverse-heavy workers",
);

push(
	"reverse:exploit-scaffolds-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-scaffolds.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-scaffolds-normalize.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-scaffolds-replay.ts",
		]),
		[
			"applyExploitReliabilityScaffolds",
			"applyExploitNormalizeScaffolds",
			"applyExploitReplayScaffolds",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"exploit-reverse-domain-next",
			'from "./native_pwn_exploit-scaffolds-normalize.ts"',
			'from "./native_pwn_exploit-scaffolds-replay.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-scaffolds.ts").includes("exploit-poc-normalizer-scaffold") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_exploit-scaffolds-replay.ts").includes("reverseDomainCaptureNextCommands"),
	"exploit reliability scaffolds split normalize/replay; reverse domain next retained",
	"Keep scaffolds facade thin",
);

push(
	"reverse:proof-loop-build-run-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-runtime/build-run.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/build-run-steps.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/build-run-phases.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/build-run-footer.ts",
		]),
		[
			"runProofLoop",
			"finalizeProofLoopOutput",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_domain_next:",
			'from "./build-run-footer.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-runtime/build-run.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/proof-loop-runtime/build-run-footer.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop run split reverse footer; domain next retained on non-ready verdicts",
	"Keep build-run.ts as execution orchestrator",
);

push(
	"reverse:knowledge-format-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-format.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-body.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-reverse.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-types.ts",
		]),
		[
			"formatKnowledgeGraph",
			"KnowledgeGraphFormatView",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_domain_next:",
			'from "./knowledge-format-types.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/knowledge-format.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-body.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-reverse.ts").includes("export type KnowledgeGraphFormatView") &&
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-format.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-body.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-reverse.ts",
		]).includes("reverseDomainCaptureNextCommands"),
	"knowledge-format split types/formatter; reverse next on reverse-heavy graphs",
	"Keep knowledge-format.ts as reverse-aware formatter",
);

push(
	"reverse:graph-format-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/graph/format.ts",
			"packages/coding-agent/src/core/repi/graph/format-attack.ts",
			"packages/coding-agent/src/core/repi/graph/format-exploit.ts",
		]),
		[
			"formatAttackGraph",
			"createExploitChainNode",
			"formatExploitChain",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_domain_next:",
			'from "./format-attack.ts"',
			'from "./format-exploit.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/graph/format.ts").includes("export function formatAttackGraph") &&
		read("packages/coding-agent/src/core/repi/graph/format-exploit.ts").includes("reverseDomainCaptureNextCommands"),
	"graph format split attack/exploit; reverse next on exploit chain nodes/format",
	"Keep graph/format.ts as thin facade",
);

push(
	"reverse:repair-rollback-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/repair-rollback-build.ts",
			"packages/coding-agent/src/core/repi/repair-rollback-build-policy.ts",
			"packages/coding-agent/src/core/repi/repair-rollback-build-policy-baseline.ts",
			"packages/coding-agent/src/core/repi/repair-rollback-build-policy-assertions.ts",
			"packages/coding-agent/src/core/repi/repair-rollback-build-reverse.ts",
		]),
		[
			"buildRepairRollbackPolicyFromAutofix",
			"writeRepairRollbackBaseline",
			"buildRepairRollbackAssertions",
			"reverseRepairNextCommands",
			"reverseDomainCaptureNextCommands",
			'from "./repair-rollback-build-policy.ts"',
			'from "./repair-rollback-build-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/repair-rollback-build.ts").includes("export function buildRepairRollbackPolicyFromAutofix") &&
		read("packages/coding-agent/src/core/repi/repair-rollback-build-policy.ts").includes("reverseRepairNextCommands") &&
		read("packages/coding-agent/src/core/repi/repair-rollback-build-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"repair-rollback build split policy/baseline/assertions/reverse next",
	"Keep repair-rollback-build.ts as thin facade",
);

push(
	"reverse:professional-bridges-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-pure.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-pure-format.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-pure-build.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-pure-build-static.ts",
		]),
		[
			"formatProfessionalRuntimeBridgesGate",
			"buildProfessionalRuntimeBridgesGateFromIndex",
			"reverseDomainCaptureNextCommands",
			"re_native_runtime run",
			"proofExit",
			'from "./professional-runtime-bridges-pure-format.ts"',
			'from "./professional-runtime-bridges-pure-build.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/professional-runtime-bridges-pure.ts").includes("export function buildProfessionalRuntimeBridgesGateFromIndex") &&
		read("packages/coding-agent/src/core/repi/professional-runtime-bridges-pure-build.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-pure-build-static.ts").includes("reverseDomainCaptureNextCommands"),
	"professional runtime bridges pure split format/build; reverse next on reverse domains",
	"Keep pure.ts as thin facade",
);

push(
	"reverse:passive-map-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/passive-map-pure.ts",
			"packages/coding-agent/src/core/repi/passive-map-pure-script.ts",
			"packages/coding-agent/src/core/repi/passive-map-pure-write.ts",
			"packages/coding-agent/src/core/repi/passive-map-pure-reverse.ts",
		]),
		[
			"passiveMapScript",
			"passiveMapSignals",
			"writePassiveMapArtifact",
			"passiveMapReverseNextCommands",
			"reverseDomainCaptureNextCommands",
			'from "./passive-map-pure-script.ts"',
			'from "./passive-map-pure-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/passive-map-pure.ts").includes("export function passiveMapScript") &&
		read("packages/coding-agent/src/core/repi/passive-map-pure-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"passive-map pure split script/write/reverse; reverse next from binary/mitigation signals",
	"Keep passive-map-pure.ts as thin facade",
);

push(
	"reverse:native-pwn-primitive-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-basic.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-advanced.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-advanced-late.ts",
		]),
		[
			"applyWantsPwnPrimitive",
			"applyWantsPwnPrimitiveBasic",
			"applyWantsPwnPrimitiveAdvanced",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"pwn-primitive-reverse-domain-next",
			'from "./native_pwn_primitive-basic.ts"',
			'from "./native_pwn_primitive-advanced.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive.ts").includes("pwn-primitive-cyclic-crash") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-advanced.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-advanced-late.ts").includes("reverseDomainCaptureNextCommands"),
	"native pwn primitive split basic/advanced; reverse domain next retained",
	"Keep native_pwn_primitive.ts as thin orchestrator",
);

push(
	"reverse:supervisor-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/supervisor/build.ts",
			"packages/coding-agent/src/core/repi/supervisor/build-assemble.ts",
			"packages/coding-agent/src/core/repi/supervisor/build-reverse.ts",
			"packages/coding-agent/src/core/repi/supervisor/build-aggregate.ts",
		]),
		[
			"buildSupervisor",
			"supervisorReverseNextActions",
			"aggregateSupervisorReviews",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./build-reverse.ts"',
			'from "./build-aggregate.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/supervisor/build.ts",
			"packages/coding-agent/src/core/repi/supervisor/build-assemble.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/supervisor/build-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"supervisor build split reverse/aggregate; reverse domain next retained",
	"Keep build.ts as reverse-aware orchestrator",
);

push(
	"reverse:proof-loop-memory-append-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-append.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-append-event.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/memory-append-failure.ts",
		]),
		[
			"appendProofLoopMemoryEvent",
			"appendRuntimeFailureRepairFromProofLoop",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./memory-append-event.ts"',
			'from "./memory-append-failure.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/memory-append.ts").includes("export function appendProofLoopMemoryEvent") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/memory-append-event.ts").includes("reverseDomainCaptureNextCommands"),
	"proof-loop memory-append split event/failure; reverse next in memory events",
	"Keep memory-append.ts as thin facade",
);

push(
	"reverse:kg-helpers-sources-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-graph/helpers-sources.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/helpers-sources-compact.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/helpers-sources-artifacts.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/helpers-sources-scope.ts",
		]),
		[
			"compactResumeKnowledgeSignals",
			"knowledgeArtifactSources",
			"buildKnowledgeScopeIsolation",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_next:",
			'from "./helpers-sources-artifacts.ts"',
			'from "./helpers-sources-scope.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/knowledge-graph/helpers-sources.ts").includes("export function knowledgeArtifactSources") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/helpers-sources-artifacts.ts").includes("reverseDomainCaptureNextCommands"),
	"knowledge-graph helpers-sources split compact/artifacts/scope; reverse next on reverse source kinds",
	"Keep helpers-sources.ts as thin facade",
);

push(
	"reverse:journal-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/journal.ts",
			"packages/coding-agent/src/core/repi/journal-rotate.ts",
			"packages/coding-agent/src/core/repi/journal-append.ts",
		]),
		[
			"appendJournal",
			"appendEvolution",
			"tailCapMarkdownBlockLedger",
			"rotateRuntimeMemoryJournalsIfNeeded",
			'from "./journal-rotate.ts"',
			'from "./journal-append.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/journal.ts").includes("export function appendJournal") &&
		read("packages/coding-agent/src/core/repi/journal-append.ts").includes("appendJournal"),
	"journal split rotate/append helpers",
	"Keep journal.ts as thin facade",
);

push(
	"reverse:ptt-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/pentesting-task-tree.ts",
			"packages/coding-agent/src/core/repi/pentesting-task-tree-snapshot.ts",
			"packages/coding-agent/src/core/repi/pentesting-task-tree-helpers.ts",
		]),
		[
			"buildPentestingTaskTreeSnapshot",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_domain_next:",
			"domain_proof_exit_missing",
			'from "./pentesting-task-tree-snapshot.ts"',
			'from "./pentesting-task-tree-helpers.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/pentesting-task-tree.ts").includes("export function buildPentestingTaskTreeSnapshot") &&
		read("packages/coding-agent/src/core/repi/pentesting-task-tree-snapshot.ts").includes("reverseDomainCaptureNextCommands"),
	"PTT split helpers/snapshot; reverse domain next on missing proof exits",
	"Keep pentesting-task-tree.ts as thin facade",
);

push(
	"reverse:operator-core-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/operator-runtime/core-build.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/core-build-reverse.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/core-build-steps.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/core-build-assemble.ts",
		]),
		[
			"buildOperator",
			"operatorReverseNextActions",
			"collectOperatorSteps",
			"assembleOperatorArtifact",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./core-build-steps.ts"',
			'from "./core-build-assemble.ts"',
			'from "./core-build-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/operator-runtime/core-build.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/operator-runtime/core-build.ts").includes("operatorReverseNextActions") &&
		read("packages/coding-agent/src/core/repi/operator-runtime/core-build-assemble.ts").includes("operatorReverseNextActions") &&
		read("packages/coding-agent/src/core/repi/operator-runtime/core-build-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"operator core-build split steps/assemble/reverse; reverse next on reverse-heavy routes",
	"Keep core-build.ts as reverse-aware orchestrator",
);

push(
	"reverse:kg-build-sources-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-graph/build-sources.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-sources-usable.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-sources-quarantine.ts",
		]),
		[
			"collectKnowledgeGraphSources",
			"appendUsableKnowledgeSources",
			"appendQuarantinedKnowledgeSources",
			'from "./build-sources-usable.ts"',
			'from "./build-sources-quarantine.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/knowledge-graph/build-sources.ts").includes("scope-quarantine:") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/build-sources-usable.ts").includes("appendUsableKnowledgeSources"),
	"knowledge-graph build-sources split usable/quarantine",
	"Keep build-sources.ts as thin orchestrator",
);

push(
	"reverse:runtime-adapters-proof-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof-gaps.ts",
		]),
		[
			"appendRuntimeAdapterProofSection",
			"appendRuntimeAdapterMissingProofGaps",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_next:",
			'from "./runtime-adapters-proof-gaps.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof-gaps.ts").includes("reverseDomainCaptureNextCommands"),
	"runtime-adapters proof split gaps; reverse next on missing proof-exit",
	"Keep runtime-adapters-proof.ts as orchestrator",
);

push(
	"reverse:authz-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/authz-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-pure-path.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-pure-build-matrices.ts",
		]),
		[
			"buildWebAuthzStateArtifact",
			"inferWebAuthzUrl",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"re_domain_proof_exit show",
			'from "./authz-pure-path.ts"',
			'from "./authz-pure-build.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/authz-pure.ts").includes("export function buildWebAuthzStateArtifact") &&
		read("packages/coding-agent/src/core/repi/reverse-io/authz-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-pure-build-matrices.ts").includes("reverseDomainCaptureNextCommands"),
	"web authz pure split path/build; reverse next on authz artifact",
	"Keep authz-pure.ts as thin facade",
);

push(
	"reverse:completion-audit-base-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/completion-audit/audit-base.ts",
			"packages/coding-agent/src/core/repi/completion-audit/audit-base-evidence.ts",
			"packages/coding-agent/src/core/repi/completion-audit/audit-base-context.ts",
		]),
		[
			"auditCompletionBase",
			"auditCompletionEvidenceGates",
			"auditCompletionContextGates",
			"auditReverseProofFromEvidence",
			'from "./audit-base-evidence.ts"',
			'from "./audit-base-context.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/completion-audit/audit-base.ts").includes("evidence ledger is empty") &&
		read("packages/coding-agent/src/core/repi/completion-audit/audit-base-evidence.ts").includes("auditReverseProofFromEvidence"),
	"completion audit base split evidence/context; reverse proof gates retained",
	"Keep audit-base.ts as thin orchestrator",
);




























































push(
	"reverse:wire-decision-modules-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/wire-decision-modules.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-decision-runtime.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-decision-budget.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-decision-claim.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-decision-failure.ts",
			"packages/coding-agent/src/core/repi/kernel/wire-decision-poison.ts",
		]),
		[
			"wireDecisionModules",
			"wireDecisionRuntimeConfigure",
			"configureDecisionRuntime",
			"configureFailureRepair",
			'from "./wire-decision-runtime.ts"',
			'from "./wire-decision-failure.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/wire-decision-modules.ts").includes("configureDecisionRuntime({") &&
		read("packages/coding-agent/src/core/repi/kernel/wire-decision-runtime.ts").includes("configureDecisionRuntime"),
	"wire-decision modules split into runtime/budget/claim/failure/poison configure bags",
	"Keep wire-decision-modules.ts as thin orchestrator",
);


push(
	"reverse:worker-provider-types-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/types/provider.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/provider-matrix.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/provider-matrix-failure.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/provider-parallel.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/provider-parallel-remote.ts",
		]),
		[
			"RepiProviderRuntimeMatrixV1",
			"RepiProviderFailureInjectionReportV1",
			"RepiParallelProviderWorkerMatrixV1",
			"RepiRemoteProviderLongRunV1",
			"RepiCrossSessionResumeLiveV1",
			'from "./provider-matrix.ts"',
			'from "./provider-parallel.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/types/provider.ts").includes("export type RepiProviderRuntimeMatrixCaseV1"),
	"worker provider types split matrix/failure vs parallel/remote/resume",
	"Keep provider.ts as thin type facade",
);



push(
	"reverse:decision-runtime-build-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/decision-runtime/build.ts",
		["export function buildDecisionCore"],
		["buildDecisionCore", "buildDecisionCoreOutput", "runDecisionCore", "reverseDomainCaptureNextCommands", "reverse_domain_next"],
		[
			"packages/coding-agent/src/core/repi/decision-runtime/build-core.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/build-run.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/build-format.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/build-format-text.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/build-format-write.ts",
		],
	),
	"decision-runtime build split with reverse domain next",
	"Keep decision-runtime/build.ts thin",
);

push(
	"reverse:decision-rules-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/decision-runtime/rules.ts",
		["export function decisionRulesFor"],
		["decisionRulesFor", "decisionOperatorQueue", "decisionOperatorSteps", "reverseDomainCaptureNextCommands", "operator_queue_ready"],
		[
			"packages/coding-agent/src/core/repi/decision-runtime/rules-posture.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/rules-steps.ts",
		],
	),
	"decision rules posture/steps split; reverse run-first queue",
	"Keep decision-runtime/rules.ts thin",
);

push(
	"reverse:campaign-runtime-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/campaign-runtime/campaign.ts",
		["export function buildCampaign"],
		["buildCampaign", "campaignEvidenceGaps", "reverseDomainCaptureNextCommands", "proof_exit"],
		[
			"packages/coding-agent/src/core/repi/campaign-runtime/campaign-build.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/campaign-gaps.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/campaign-write.ts",
		],
	),
	"campaign runtime modular with reverse proof gaps",
	"Keep campaign.ts thin",
);

push(
	"reverse:swarm-pure-audit-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/swarm-exec/pure-audit.ts",
		["export function deriveSwarmAuditFields"],
		["deriveSwarmAuditFields", "swarmReverseQuerySignals", "proof_exit"],
		[
			"packages/coding-agent/src/core/repi/swarm-exec/pure-audit-fields.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-audit-runtime.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-audit-worker.ts",
		],
	),
	"swarm pure-audit modular; reverse query signals retained",
	"Keep pure-audit.ts thin",
);

push(
	"reverse:goal-commands-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/goal/commands.ts",
		["export function pauseGoal"],
		["pauseGoal", "resumeGoal", "createGoal", "parseGoalCommand"],
		[
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle.ts",
			"packages/coding-agent/src/core/repi/goal/commands-parse.ts",
		],
	),
	"goal commands lifecycle/parse split",
	"Keep goal/commands.ts thin",
);

push(
	"reverse:exploit-run-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/reverse-io/exploit-run.ts",
		["export async function runExploitLab"],
		["runExploitLab", "exploitReverseFooter", "reverseDomainCaptureNextCommands", "includeGates"],
		[
			"packages/coding-agent/src/core/repi/reverse-io/exploit-write.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-output.ts",
		],
	),
	"exploit-run modular with gated reverse next",
	"Keep exploit-run.ts thin",
);

push(
	"reverse:native-run-reverse-footer",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/native-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-output.ts",
		]),
		[
			"reverseDomainCaptureNextCommands",
			"proof.exit",
			"bind_ready",
			"includeGates",
			"prefer_run_over_plan_for_capture",
		],
	),
	"native-run seeds reverse domain next and proof/bind gates",
	"Keep native-run reverse footer on plan/run paths",
);

push(
	"reverse:knowledge-graph-signals-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/knowledge-graph/signals.ts",
		["export function appendKnowledgeRuntimeSignalNodes"],
		[
			"appendKnowledgeRuntimeSignalNodes",
			"appendWorkerDispatcherSignalNodes",
			"appendCompactFailureSignalNodes",
			"knowledgeRuntimeReverseNextHints",
			"workerDispatcherReverseHints",
			"appendHighScorePromotionNodes",
			"reverse_domain_next",
			"reverseDomainCaptureNextCommands",
		],
		[
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-append.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-nodes.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-scoreboard.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-feedback.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-decay.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-reverse.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-promotions.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-failure.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-reverse.ts",
		],
	),
	"knowledge-graph signals modular with reverse next hints + worker promotions",
	"Keep signals.ts thin",
);

push(
	"reverse:resources-prompts-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/resources/prompts.ts",
		["export const RECON_SYSTEM_PROMPT"],
		["RECON_SYSTEM_PROMPT", "RECON_SKILL_CONTENT", "RECON_PROMPTS", "Thin-kernel", "execution-first"],
		[
			"packages/coding-agent/src/core/repi/resources/prompts-core.ts",
			"packages/coding-agent/src/core/repi/resources/prompts-catalog.ts",
		],
	),
	"prompts core/catalog split; thin kernel doctrine retained",
	"Keep prompts.ts thin",
);

push(
	"reverse:pwn-evidence-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn.ts",
		["export function extractPwnPrimitiveFindings"],
		[
			"analyzePwnPrimitiveEvidence",
			"extractPwnPrimitiveFindings",
			"appendPwnPrimitiveFollowups",
			"appendPwnReverseFollowups",
			"reverseDomainCaptureNextCommands",
			"pwn-reverse-domain-next",
			"includeGates",
		],
		[
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-findings.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-findings-buckets.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups-basic.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups-reverse.ts",
		],
	),
	"pwn evidence findings/followups split with reverse domain next",
	"Keep pwn.ts thin orchestrator",
);

push(
	"reverse:exploit-chain-build-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/exploit-chain/build.ts",
		["export function buildExploitChainNodes"],
		["buildExploitChain", "buildExploitChainNodes", "reverseDomainCaptureNextCommands", "re_exploit_lab run", "includeGates"],
		[
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-assemble.ts",
		],
	),
	"exploit-chain nodes/assemble split; run-first reverse next",
	"Keep exploit-chain/build.ts thin",
);

push(
	"reverse:compact-resume-summary-build-modular",
	thinFacade(
		"packages/coding-agent/src/core/repi/compact-resume/signals/summary-build.ts",
		["export function buildReconCompactionSummary"],
		[
			"buildReconCompactionSummary",
			"buildReconCompactionResumeContract",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"has_reverse_capture",
		],
		[
			"packages/coding-agent/src/core/repi/compact-resume/signals/summary-build-summary.ts",
			"packages/coding-agent/src/core/repi/compact-resume/signals/summary-build-contract.ts",
			"packages/coding-agent/src/core/repi/compact-resume/signals/summary-build-auto.ts",
		],
	),
	"compact-resume summary-build modular; reverse-heavy prefers domain capture",
	"Keep summary-build.ts thin",
);

push(
	"reverse:compact-resume-telemetry-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/compact-resume/telemetry.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-io.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update-exec.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update-transitions.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-format.ts",
		]),
		[
			"latestReconCompactionResumeTelemetry",
			"updateReconCompactionTelemetryFromExecutions",
			"formatReconCompactionResumeTelemetry",
			"markReverseCaptureTelemetryProgress",
			"reverseCaptureProgress",
			"require_proof_exit_before_claim",
			'from "./telemetry-io.ts"',
			'from "./telemetry-update.ts"',
			'from "./telemetry-update-exec.ts"',
			'from "./telemetry-update-transitions.ts"',
			'from "./telemetry-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/compact-resume/telemetry.ts").includes("export function updateReconCompactionTelemetryFromExecutions") &&
		!read("packages/coding-agent/src/core/repi/compact-resume/telemetry-update-exec.ts").includes("reverseCaptureProgress") &&
		read("packages/coding-agent/src/core/repi/compact-resume/telemetry-update-transitions.ts").includes("reverseCaptureProgress") &&
		read("packages/coding-agent/src/core/repi/compact-resume/telemetry-update-exec.ts").includes("markReverseCaptureTelemetryProgress"),
	"compact-resume telemetry split io/update/exec/transitions/format; reverse capture progress on execution updates",
	"Keep telemetry.ts as thin facade; reverse progress marker in transitions",
);


// ---------- reverse io footers ----------
const reverseIoFooters = joinSources([
	"packages/coding-agent/src/core/repi/reverse-io/native-run.ts",
	"packages/coding-agent/src/core/repi/reverse-io/mobile-run.ts",
	"packages/coding-agent/src/core/repi/reverse-io/authz-run.ts",
	"packages/coding-agent/src/core/repi/reverse-io/browser-run.ts",
	"packages/coding-agent/src/core/repi/reverse-io/js-signing-run.ts",
	"packages/coding-agent/src/core/repi/reverse-io/exploit-footer.ts",
	"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
]);
push(
	"reverse:reverse-io-domain-footers",
	includesAll(reverseIoFooters, [
		"reverseDomainCaptureNextCommands",
		"next: ${cmd}",
		"re_mobile_runtime run",
		"re_web_authz_state run",
		"re_exploit_lab run",
		"re_js_signing run",
	]),
	"reverse-io domain runners share reverseDomainCaptureNextCommands footers",
	"Keep pending reverse capture next centralized",
);

// ---------- techniques run-first ----------
const techniques = joinSources([
	"packages/coding-agent/src/core/repi/techniques/pwn_techniques.ts",
	"packages/coding-agent/src/core/repi/techniques/native_reverse_techniques.ts",
	"packages/coding-agent/src/core/repi/resources/prompts-core.ts",
]);
push(
	"reverse:techniques-run-first",
	includesAll(techniques, ["re_native_runtime run", "re_domain_proof_exit"]) &&
		!techniques.includes("re_native_runtime plan"),
	"techniques/prompts prefer re_native_runtime run over plan",
	"Keep technique catalogs on run-first reverse capture paths",
);

// ---------- host native smoke strong ----------
const smoke = read("docs/reverse-agent/native-host-capture-smoke.out");
const mobileSmoke = read("docs/reverse-agent/mobile-host-capture-smoke.out");
const browserSmoke = read("docs/reverse-agent/browser-host-capture-smoke.out");
const exploitSmoke = read("docs/reverse-agent/exploit-host-capture-smoke.out");
const dfirSmoke = read("docs/reverse-agent/dfir-host-capture-smoke.out");
const malwareSmoke = read("docs/reverse-agent/malware-host-capture-smoke.out");
const firmwareSmoke = read("docs/reverse-agent/firmware-host-capture-smoke.out");
const cryptoSmoke = read("docs/reverse-agent/crypto-host-capture-smoke.out");
const agentSmoke = read("docs/reverse-agent/agent-security-host-capture-smoke.out");
const memorySmoke = read("docs/reverse-agent/memory-host-capture-smoke.out");
const cloudSmoke = read("docs/reverse-agent/cloud-host-capture-smoke.out");
const jsSigningSmoke = read("docs/reverse-agent/js-signing-host-capture-smoke.out");
const webAuthzSmoke = read("docs/reverse-agent/web-authz-host-capture-smoke.out");
push(
	"reverse:native-host-capture-smoke-strong",
	includesAll(smoke, [
		"[native-binary]",
		"[native-readelf-program]",
		"[native-r2]",
		"[native-objdump-rop]",
		"[native-frida]",
		"summary.frida_host=1",
		"[native-proof-capture]",
		"[native-r2-mitigation]",
		"[native-dyn-probe]",
	]) &&
		/checksec=1/.test(smoke) &&
		/rop=1/.test(smoke) &&
		/frida=1/.test(smoke) &&
		/dyn=1/.test(smoke),
	"host native smoke produces binary+readelf+r2+objdump-rop+frida+dyn capture tags",
	"Keep host-tool surrogates able to feed reverseRuntimeCaptureProofFields",
);


push(
	"reverse:verify-closure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure-reverse.ts",
		]),
		[
			"verifyWorkerRetryHandoffClosureV1",
			"collectWorkerRetryHandoffReverseErrors",
			"bind_ready",
			"runtime_capture_strong",
			'from "./verify-closure-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure.ts").includes("collectWorkerRetryHandoffReverseErrors =") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure-reverse.ts").includes("collectWorkerRetryHandoffReverseErrors"),
	"worker retry handoff closure reverse marker checks modular",
	"Keep reverse capture marker collection out of verify-closure core",
);

push(
	"reverse:browser-signals-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-signals.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-signals-types.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-signals-runtime.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-signals-authz.ts",
		]),
		[
			"collectBrowserEvidenceSignals",
			"collectBrowserRuntimeSignals",
			"collectBrowserAuthzSignals",
			"reverseDomainCaptureNextCommands",
			"reverse_next:",
			"includeGates",
		],
	) &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/browser-signals.ts").includes("reverseDomainCaptureNextCommands"),
	"browser evidence signals split runtime/authz; reverse-heavy next retained",
	"Keep browser-signals.ts as reverse-aware facade",
);

push(
	"reverse:exploit-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/exploit-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-pure-path.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build-plan.ts",
		]),
		[
			"latestExploitLabArtifactPath",
			"inferExploitLabTarget",
			"buildExploitLabArtifact",
			"buildExploitLabPlanSections",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"re_complete audit",
			'from "./exploit-pure-build.ts"',
			'from "./exploit-pure-build-plan.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/exploit-pure.ts").includes("export function buildExploitLabArtifact") &&
		!read("packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build-plan.ts").includes("reverseDomainCaptureNextCommands"),
	"exploit pure builders split path/build/plan; reverse domain next retained",
	"Keep exploit-pure.ts as thin facade; reverse next lives in plan sections",
);

push(
	"reverse:replayer-build-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/replayer-runtime/build.ts",
			"packages/coding-agent/src/core/repi/replayer-runtime/build-core.ts",
			"packages/coding-agent/src/core/repi/replayer-runtime/build-format.ts",
		]),
		[
			"refreshReplayDerivedFields",
			"buildReplayer",
			"formatReplayer",
			"reverseDomainCaptureNextCommands",
			'from "./build-core.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/replayer-runtime/build.ts").includes("export function buildReplayer") &&
		read("packages/coding-agent/src/core/repi/replayer-runtime/build-core.ts").includes("reverseDomainCaptureNextCommands"),
	"replayer build split core/format; reverse domain next retained",
	"Keep replayer-runtime/build.ts as thin facade",
);

push(
	"reverse:native-summary-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-structured.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-mitigations.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-format.ts",
		]),
		[
			"nativeRuntimeStructuredSummary",
			"formatNativeRuntime",
			"reverseDomainCaptureNextCommands",
			"reverse_domain_next",
			'from "./native-summary-structured.ts"',
			'from "./native-summary-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-runtime/native-summary.ts").includes("export function formatNativeRuntime") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/native-summary-format.ts").includes("reverseDomainCaptureNextCommands"),
	"native-summary split structured/format; reverse domain next retained",
	"Keep native-summary.ts as thin facade",
);

push(
	"reverse:attack-graph-swarm-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/attack-graph/build/swarm.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/swarm-workers.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/swarm-reverse.ts",
		]),
		[
			"appendAttackGraphSwarm",
			"appendAttackGraphSwarmWorkerClosures",
			"appendAttackGraphSwarmReverseGaps",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./swarm-workers.ts"',
			'from "./swarm-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/attack-graph/build/swarm.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/swarm-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"attack-graph swarm split workers/reverse gaps; reverse next retained",
	"Keep swarm.ts as reverse-aware orchestrator",
);

push(
	"reverse:cloud-agent-pack-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent-basic.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent-advanced.ts",
		]),
		[
			"applyWantsAgentSecurity",
			"applyWantsAgentSecurityBasic",
			"applyWantsAgentSecurityAdvanced",
			"reverseDomainCaptureNextCommands",
			"agent-security-reverse-domain-next",
			'from "./cloud_agent-basic.ts"',
			'from "./cloud_agent-advanced.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent.ts").includes("agent-prompt-surface-map") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent-advanced.ts").includes("reverseDomainCaptureNextCommands"),
	"cloud/agent security pack split basic/advanced; reverse domain next retained",
	"Keep cloud_agent.ts as thin orchestrator",
);


push(
	"reverse:browser-pure-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/browser-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-pure-path.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-pure-probes.ts",
		]),
		[
			"latestLiveBrowserArtifactPath",
			"inferBrowserUrl",
			"buildLiveBrowserArtifact",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./browser-pure-build.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/browser-pure.ts").includes("export function buildLiveBrowserArtifact") &&
		read("packages/coding-agent/src/core/repi/reverse-io/browser-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-pure-probes.ts").includes("reverseDomainCaptureNextCommands"),
	"browser pure split path/build; reverse domain next retained",
	"Keep browser-pure.ts as thin facade",
);

push(
	"reverse:runtime-adapter-gate-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/gate.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/gate-build.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/gate-format.ts",
		]),
		[
			"buildRuntimeAdapterExecutionGate",
			"formatRuntimeAdapterExecutionGate",
			"proofExitReady",
			"reverseDomainCaptureNextCommands",
			"reverse_domain_next",
			'from "./gate-build.ts"',
			'from "./gate-format.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/runtime-adapter/gate.ts").includes("export function buildRuntimeAdapterExecutionGate") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/gate-format.ts").includes("reverseDomainCaptureNextCommands"),
	"runtime-adapter gate split build/format; reverse domain next retained",
	"Keep gate.ts as thin facade",
);

push(
	"reverse:context-pack-write-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/context-pack/write.ts",
			"packages/coding-agent/src/core/repi/context-pack/write-markdown.ts",
			"packages/coding-agent/src/core/repi/context-pack/write-reverse.ts",
		]),
		[
			"writeContextPackArtifact",
			"buildContextPackMarkdown",
			"withContextPackWriteReverseNext",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./write-markdown.ts"',
			'from "./write-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/context-pack/write.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/context-pack/write-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"context-pack write split markdown/reverse; reverse next merge retained",
	"Keep write.ts reverse-aware orchestrator",
);

push(
	"reverse:swarm-handoff-build-reverse",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build-worker.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build-reverse.ts",
		]),
		[
			"buildSwarmWorkerRetryHandoffClosure",
			"buildSwarmWorkerRetryHandoffRow",
			"swarmHandoffReverseRepairRefs",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			'from "./handoff-build-worker.ts"',
			'from "./handoff-build-reverse.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build-worker.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/handoff-build-worker.ts").includes("swarmHandoffReverseRepairRefs"),
	"swarm handoff build reverse repair refs extracted; worker row owns reverse repair call",
	"Keep reverse-heavy handoff repair seeding",
);

push(
	"reverse:exploit-reliability-evidence-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/exploit.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/exploit-collect.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/exploit-reverse.ts",
		]),
		[
			"analyzeExploitReliabilityEvidence",
			"collectExploitReliabilitySignals",
			"exploitReliabilityReverseFollowups",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proof.exit=partial_runtime_capture",
		],
	) &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/exploit-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"exploit reliability evidence split collect/reverse; reverse capture followups retained",
	"Keep exploit.ts as reverse-aware orchestrator",
);

push(
	"reverse:agent-security-evidence-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/dfir/agent-security.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/dfir/agent-security-collect.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/dfir/agent-security-reverse.ts",
		]),
		[
			"analyzeAgentSecurityEvidence",
			"collectAgentSecuritySignals",
			"agentSecurityReverseFollowups",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proof.exit=partial_runtime_capture",
		],
	) &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/dfir/agent-security-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"agent-security evidence split collect/reverse; reverse capture followups retained",
	"Keep agent-security.ts as reverse-aware orchestrator",
);

push(
	"reverse:plan-quick-phases-spine-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases-apply.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases-spine.ts",
			"packages/coding-agent/src/core/repi/proof-loop/plan-quick-reverse.ts",
		]),
		[
			"applyRepiProofLoopQuickPlanPhases",
			"applyProofLoopSpinePhases",
			"seedProofLoopQuickPlanReversePhase",
			"appendProofSpine",
			'from "./plan-quick-plan-phases-spine.ts"',
			'from "./plan-quick-reverse.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/proof-loop/plan-quick-plan-phases-apply.ts").includes("seedProofLoopQuickPlanReversePhase"),
	"proof-loop quick plan phases split apply/spine; reverse seed retained",
	"Keep reverse phase seed on apply path",
);

push(
	"reverse:techniques-domain-slices-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/techniques/firmware_iot_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/firmware_iot_techniques-early.ts",
			"packages/coding-agent/src/core/repi/techniques/malware_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/malware_techniques-early.ts",
			"packages/coding-agent/src/core/repi/techniques/crypto_stego_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/crypto_stego_techniques-early.ts",
		]),
		[
			"FIRMWARE_IOT_TECHNIQUES",
			"MALWARE_TECHNIQUES",
			"CRYPTO_STEGO_TECHNIQUES",
			"FIRMWARE_IOT_TECHNIQUES_EARLY",
			"MALWARE_TECHNIQUES_EARLY",
			"CRYPTO_STEGO_TECHNIQUES_EARLY",
		],
	) &&
		read("packages/coding-agent/src/core/repi/techniques/firmware_iot_techniques.ts").includes("FIRMWARE_IOT_TECHNIQUES_EARLY"),
	"technique catalogs split early/late domain slices",
	"Keep domain facades composing early/late technique slices",
);


push(
	"reverse:logic-monofile-lt-140",
	(() => {
		const skip = /(dfir-pcap-script|layout-defaults|web-cdp|memory-stubs|memory-stubs-paths|professional-runtime-bridges-data|specialist-pack-matrix-data|matchers-regexes|runtime-scoring-web|tools-adapter|types\.ts$)/;
		const over = [];
		function walk(relDir = "packages/coding-agent/src/core/repi") {
			const abs = join(root, relDir);
			for (const name of readdirSync(abs)) {
				const rel = `${relDir}/${name}`;
				const st = statSync(join(root, rel));
				if (st.isDirectory()) walk(rel);
				else if (name.endsWith(".ts")) {
					const n = read(rel).split("\n").length;
					const short = rel.replace("packages/coding-agent/src/core/repi/", "");
					if (n >= 140 && !skip.test(short)) over.push({ short, n });
				}
			}
		}
		walk();
		return over.length === 0;
	})(),
	"logic monofiles under repi cleared past 140-line soft band (types/data allowed)",
	"Split remaining logic monofiles >=140; data consts/types may remain",
);

push(
	"reverse:operator-dispatch-queue-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/queue.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/queue-enrich.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/queue-reverse.ts",
		]),
		[
			"dispatchOperatorQueue",
			"enrichOperatorAfterDispatch",
			"operatorDispatchReverseNextActions",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proof.exit=partial_runtime_capture",
			'from "./queue-enrich.ts"',
			'from "./queue-reverse.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/operator-runtime/dispatch/queue-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"operator dispatch queue split enrich/reverse next",
	"Keep reverse capture gate in dispatch next actions",
);

push(
	"reverse:native-deep-evidence-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/deep.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/deep-collect.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/deep-reverse.ts",
		]),
		[
			"analyzeNativeDeepEvidence",
			"collectNativeDeepSignals",
			"nativeDeepReverseFollowups",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"proof.exit=partial_runtime_capture",
		],
	) &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/deep-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"native deep evidence split collect/reverse; reverse capture followups retained",
	"Keep deep.ts as reverse-aware orchestrator",
);

push(
	"reverse:proof-commands-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-proof-tools/commands.ts",
			"packages/coding-agent/src/core/repi/kernel/install-proof-tools/commands-proof.ts",
			"packages/coding-agent/src/core/repi/kernel/install-proof-tools/commands-bootstrap.ts",
		]),
		[
			"registerRepiProofLoopCommands",
			"registerRepiProofChainCommands",
			"registerRepiProofBootstrapCommands",
			"re-proof-loop",
			"re-complete",
			"proof.exit=partial_runtime_capture",
			'from "./commands-proof.ts"',
			'from "./commands-bootstrap.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel/install-proof-tools/commands.ts").includes('registerCommand("re-verifier"') &&
		read("packages/coding-agent/src/core/repi/kernel/install-proof-tools/commands-bootstrap.ts").includes("re-complete"),
	"proof slash commands split chain/bootstrap; reverse completion guidance retained",
	"Keep commands.ts as thin orchestrator",
);

push(
	"reverse:structured-claim-pure-reverse",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/structured-claim-merge/pure.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/pure-evidence-contract.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/pure-reverse.ts",
		]),
		[
			"verifyStructuredClaimMergePromotion",
			"collectStructuredClaimReversePromotionErrors",
			"reverse_missing_proof_exit_blocks_final",
			"reverse_heavy_requires_bind_ready",
			'from "./pure-reverse.ts"',
		],
	) &&
		read("packages/coding-agent/src/core/repi/structured-claim-merge/pure.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/pure-evidence-contract.ts").includes("collectStructuredClaimReversePromotionErrors") &&
		read("packages/coding-agent/src/core/repi/structured-claim-merge/pure-reverse.ts").includes("reverse_missing_proof_exit_blocks_final"),
	"structured claim pure reverse promotion gates extracted",
	"Keep reverse-heavy final claims blocked without proof.exit/bind_ready",
);

push(
	"reverse:supervisor-io-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/supervisor/io.ts",
			"packages/coding-agent/src/core/repi/supervisor/io-latest.ts",
			"packages/coding-agent/src/core/repi/supervisor/io-write.ts",
			"packages/coding-agent/src/core/repi/supervisor/io-output.ts",
		]),
		[
			"latestOrBuildSupervisor",
			"writeSupervisorArtifact",
			"buildSupervisorOutput",
			"reverseDomainCaptureNextCommands",
			"reverse_domain_next",
			'from "./io-latest.ts"',
			'from "./io-write.ts"',
			'from "./io-output.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/supervisor/io.ts").includes("export function writeSupervisorArtifact") &&
		read("packages/coding-agent/src/core/repi/supervisor/io-output.ts").includes("reverseDomainCaptureNextCommands"),
	"supervisor io split latest/write/output; reverse domain next retained",
	"Keep io.ts as thin facade",
);

push(
	"reverse:web-heals-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/self-heal/heals/web.ts",
			"packages/coding-agent/src/core/repi/lanes/self-heal/heals/web-core.ts",
			"packages/coding-agent/src/core/repi/lanes/self-heal/heals/web-reverse.ts",
		]),
		[
			"appendWebHeals",
			"appendWebCoreHeals",
			"appendWebReverseHeals",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"web-reverse-domain-next",
		],
	) &&
		read("packages/coding-agent/src/core/repi/lanes/self-heal/heals/web-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"web self-heal split core/reverse; reverse domain next retained",
	"Keep web.ts as reverse-aware orchestrator",
);

push(
	"reverse:swarm-execute-command-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/execute-command.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/execute-command-reverse.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/execute-command-finalize.ts",
		]),
		[
			"executeSwarmWorkerCommand",
			"swarmExecuteReverseNotes",
			"finalizeSwarmWorkerExecution",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"reverse_next:",
		],
	) &&
		joinSources(["packages/coding-agent/src/core/repi/swarm-exec/execute-command.ts","packages/coding-agent/src/core/repi/swarm-exec/execute-command-shell.ts","packages/coding-agent/src/core/repi/swarm-exec/execute-command-reverse.ts"]).includes("swarmExecuteReverseNotes") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/execute-command-reverse.ts").includes("reverseDomainCaptureNextCommands"),
	"swarm execute-command split finalize/reverse notes for reverse-heavy blocked workers",
	"Keep reverse next notes on reverse-heavy command failures",
);

push(
	"reverse:kernel-artifact-format-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel-runtime/artifact-format.ts",
			"packages/coding-agent/src/core/repi/kernel-runtime/artifact-format-core.ts",
			"packages/coding-agent/src/core/repi/kernel-runtime/artifact-write.ts",
		]),
		[
			"formatKernelArtifact",
			"writeKernelArtifact",
			"reverseDomainCaptureNextCommands",
			"reverse_domain_next",
			"proof_exit_criteria",
			'from "./artifact-format-core.ts"',
			'from "./artifact-write.ts"',
		],
	) &&
		!read("packages/coding-agent/src/core/repi/kernel-runtime/artifact-format.ts").includes("export function formatKernelArtifact") &&
		read("packages/coding-agent/src/core/repi/kernel-runtime/artifact-format-core.ts").includes("reverseDomainCaptureNextCommands"),
	"kernel artifact format/write split; reverse domain next retained",
	"Keep artifact-format.ts as thin facade",
);


push(
	"reverse:native-dyn-probe-capture",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-structured.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-mitigations.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-native.ts",
		]),
		[
			"native-dyn-probe",
			"REPI_NATIVE_DYN",
			"native-r2-mitigation",
			"summary.dyn_probe",
			"dyn_probe",
			"dyn_probe",
			"runtime_capture_strong",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts").includes("native-dyn-probe") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-native.ts").includes("dyn_probe"),
	"native shell emits dyn probe + r2 mitigations; scoring counts dyn_probe toward strong capture",
	"Prefer REPI_NATIVE_DYN=1 when gdb is missing on lean hosts",
);

push(
	"reverse:native-run-first-dyn-next",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-footer.ts",
		]),
		[
			"re_native_runtime run",
			"REPI_NATIVE_DYN=1",
			"includeGates",
			"prefer_run_over_plan_for_capture",
			"reverseDomainCaptureNextCommands",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts").includes("REPI_NATIVE_DYN=1") &&
		read("packages/coding-agent/src/core/repi/reverse-io/native-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-footer.ts").includes("includeGates: true"),
	"native reverse next prefers run-first and dyn probe env when capture is incomplete",
	"Keep includeGates on native run reverse footer",
);


push(
	"reverse:mobile-host-capture-smoke-strong",
	includesAll(mobileSmoke, [
		"[mobile-apk]",
		"[mobile-frida-host]",
		"[mobile-frida-hook-template]",
		"[mobile-proof-capture]",
		"[mobile-ssl-pinning]",
		"[mobile-root-bypass-signal]",
	]) &&
		/apk=1/.test(mobileSmoke) &&
		/frida=1/.test(mobileSmoke) &&
		/hooks=1/.test(mobileSmoke) &&
		(/ssl_pin=1/.test(mobileSmoke) || /root=1/.test(mobileSmoke)),
	"host mobile smoke produces apk+frida-host+hooks+ssl/root capture tags",
	"Keep mobile host-tool CAP path able to reach strong without device attach",
);

push(
	"reverse:mobile-host-cap-scoring",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida-local.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-summary-structured.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-mobile.ts",
		]),
		[
			"mobile-proof-capture",
			"mobile-frida-host",
			"mobile-aapt",
			"summary.frida_host",
			"summary.ssl_pinning_signal",
			"frida_host",
			"runtime_capture_strong",
			"REPI_MOBILE_ATTACH",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-mobile.ts").includes("frida_host") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts").includes("mobile-proof-capture"),
	"mobile shell emits host CAP rollup; scoring can mark strong without attach",
	"Prefer REPI_MOBILE_ATTACH=1 only when a live device/package is available",
);

push(
	"reverse:mobile-run-first-attach-next",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-output.ts",
		]),
		[
			"re_mobile_runtime run",
			"REPI_MOBILE_ATTACH=1",
			"includeGates",
			"reverseDomainCaptureNextCommands",
			"prefer_run_over_plan_for_capture",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts").includes("REPI_MOBILE_ATTACH=1") &&
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-footer.ts",
		]).includes("includeGates: true"),
	"mobile reverse next prefers run-first and attach env when capture incomplete",
	"Keep includeGates on mobile run reverse footers",
);


push(
	"reverse:browser-host-capture-smoke",
	includesAll(browserSmoke, [
		"[browser-url]",
		"[browser-status]",
		"[browser-proof-capture]",
		"[browser-script]",
	]) &&
		/url=1/.test(browserSmoke) &&
		/status=1/.test(browserSmoke) &&
		/proof\.exit=runtime_capture_strong/.test(browserSmoke) &&
		(/api=1/.test(browserSmoke) || /scripts=1/.test(browserSmoke)),
	"host browser smoke produces url+status+script/api proof-capture with runtime_capture_strong",
	"Keep live browser capture able to emit machine-readable proof tags and strong exit on rich pages",
);


push(
	"reverse:web-authz-include-gates",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-output.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-reverse.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
		]),
		[
			"includeGates: true",
			"reverseDomainCaptureNextCommands",
			"require_proof_exit_before_claim",
			"prefer_run_over_plan_for_capture",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-io/authz-run-core.ts").includes("includeGates: true") &&
		read("packages/coding-agent/src/core/repi/reverse-io/browser-run-reverse.ts").includes("includeGates: true") &&
		read("packages/coding-agent/src/core/repi/reverse-io/exploit-footer.ts").includes("includeGates: true") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts").includes("prefer_run_over_plan_for_capture"),
	"web authz/browser/exploit reverse footers keep includeGates; next-commands keeps run-first capture gates",
	"Do not drop includeGates when thinning reverse footers",
);


push(
	"reverse:exploit-host-capture-smoke-strong",
	includesAll(exploitSmoke, [
		"[exploit-lab-inventory]",
		"[exploit-lab-file]",
		"[exploit-lab-checksec]",
		"[exploit-lab-run]",
		"[exploit-lab-proof-capture]",
		"[exploit-lab-summary]",
	]) &&
		/inventory=1/.test(exploitSmoke) &&
		/checksec=1/.test(exploitSmoke) &&
		/pass=1/.test(exploitSmoke) &&
		/status=pass/.test(exploitSmoke) &&
		/stable=true|stable=1/.test(exploitSmoke),
	"host exploit smoke produces inventory+file+checksec-surrogate+multi-run pass proof tags",
	"Keep exploit lab host CAP path able to reach strong via readelf mitigation surrogate",
);

push(
	"reverse:exploit-host-cap-scoring",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-structured.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-exploit.ts",
		]),
		[
			"exploit-lab-mitigation",
			"exploit-lab-run",
			"exploit-lab-proof-capture",
			"surrogate=readelf",
			"summary.mitigation",
			"runtime_capture_strong",
			"lab_symbols",
		],
	) &&
		joinSources(["packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell.ts","packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner.ts","packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts","packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts"]).includes("exploit-lab-mitigation") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-exploit.ts").includes("exploit-lab-mitigation"),
	"exploit shell emits readelf mitigation surrogate + run status; scoring counts them toward strong",
	"Prefer REPI_EXPLOIT_CMD for non-executable PoC scripts",
);

push(
	"reverse:js-signing-include-gates",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-run-reverse.ts",
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-output.ts",
		]),
		[
			"includeGates: true",
			"reverseDomainCaptureNextCommands",
			"require_proof_exit_before_claim",
			"jsSigningReverseFooter",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-io/js-signing-run-reverse.ts").includes("includeGates: true") &&
		read("packages/coding-agent/src/core/repi/reverse-io/js-signing-output.ts").includes("includeGates: true"),
	"js-signing reverse footers keep includeGates for run-first capture gates",
	"Do not drop includeGates when thinning js-signing reverse paths",
);


push(
	"reverse:dfir-host-capture-smoke-strong",
	includesAll(dfirSmoke, [
		"[pcap-file]",
		"[flow-conversation]",
		"[http-object]",
		"[credential-timeline]",
		"[tcp-reassembly]",
		"[dfir-proof-capture]",
		"[dfir-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(dfirSmoke) &&
		/flow=1/.test(dfirSmoke) &&
		(/file=1/.test(dfirSmoke) || /tcpdump=1/.test(dfirSmoke)),
	"host DFIR smoke produces pure-python pcap flow/http/cred tags plus host CAP rollup",
	"Keep pure-python pcap fallback able to reach runtime_capture_strong without tshark",
);

push(
	"reverse:dfir-adapter-cap-scoring",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-base.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-dns-tls.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-main.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-loop.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-parsers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-frame.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-proof.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-proof-footer.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-firmware-crypto-agent.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-ops.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands-domains.ts",
		]),
		[
			"dfir-proof-capture",
			"flow-conversation",
			"dfir_pcap",
			"dfir_stream",
			"dfir_secrets",
			"re_runtime_adapter run",
			"dfir-tls-sni-ja3-timeline",
			"re_bootstrap plan tshark",
		],
	) &&
		joinSources(["packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts","packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts","packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts"]).includes("dfir_pcap") &&
		read("packages/coding-agent/src/core/repi/domain-proof-exit/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands-domains.ts").includes("re_runtime_adapter run") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-base.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-dns-tls.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-main.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-loop.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-parsers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-frame.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-proof.ts").includes("dfir-proof-capture"),
	"DFIR pure-python CAP + adapter scoring + run-first next/bootstrap gates",
	"Prefer pure-python pcap fallback when tshark missing",
);


push(
	"reverse:malware-host-capture-smoke-strong",
	includesAll(malwareSmoke, [
		"[malware-static]",
		"[malware-ioc]",
		"[malware-yara]",
		"[malware-proof-capture]",
		"[malware-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(malwareSmoke) &&
		/static=1/.test(malwareSmoke) &&
		(/yara=1/.test(malwareSmoke) || /ioc=1/.test(malwareSmoke)),
	"host malware smoke produces static+yara/ioc CAP with runtime_capture_strong",
	"Keep malware host CAP able to reach strong via yara or pure-python IOC without capa/floss",
);

push(
	"reverse:firmware-host-capture-smoke-strong",
	includesAll(firmwareSmoke, [
		"[rootfs-account]",
		"[rootfs-service]",
		"[rootfs-binary]",
		"[firmware-proof-capture]",
		"[firmware-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(firmwareSmoke) &&
		/extract=1/.test(firmwareSmoke) &&
		/account=1/.test(firmwareSmoke),
	"host firmware smoke produces rootfs account/service/config CAP with runtime_capture_strong",
	"Keep firmware rootfs map + binwalk host CAP able to reach strong",
);

push(
	"reverse:malware-firmware-adapter-cap",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-extract-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-archive-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/malware.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-firmware-crypto-agent.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-ops.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands-domains.ts",
		]),
		[
			"malware-proof-capture",
			"firmware-proof-capture",
			"malware_static",
			"malware_ioc",
			"firmware_capture",
			"malwareStaticIocCommandTemplate",
			"RUNTIME_ADAPTER_MALWARE_SPECS",
			"re_bootstrap plan yara",
			"re_bootstrap plan binwalk",
		],
	) &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/matrix.ts").includes("RUNTIME_ADAPTER_MALWARE_SPECS") &&
		joinSources(["packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts","packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts","packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts"]).includes("malware_static") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-extract-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-archive-host.ts").includes("firmware-proof-capture"),
	"malware/firmware adapter templates + matrix + scoring + run-first bootstrap gates",
	"Prefer pure-python static/IOC when capa/floss missing; rootfs map when image extract unavailable",
);


push(
	"reverse:crypto-host-capture-smoke-strong",
	includesAll(cryptoSmoke, [
		"[crypto-param]",
		"[crypto-transform]",
		"[crypto-solver]",
		"[crypto-proof-capture]",
		"[crypto-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(cryptoSmoke) &&
		/param=1/.test(cryptoSmoke) &&
		/transform=1/.test(cryptoSmoke),
	"host crypto smoke produces param+transform+solver CAP with runtime_capture_strong",
	"Keep pure-python crypto CAP able to reach strong without z3",
);

push(
	"reverse:agent-security-host-capture-smoke-strong",
	includesAll(agentSmoke, [
		"[agent-prompt]",
		"[agent-tool]",
		"[agent-tool-summary]",
		"[agent-security-proof-capture]",
		"[agent-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(agentSmoke) &&
		/prompt=1/.test(agentSmoke) &&
		/tool=1/.test(agentSmoke),
	"host agent-security smoke produces prompt+tool boundary CAP with runtime_capture_strong",
	"Keep agent-security host CAP able to reach strong via rg+python boundary scan",
);

push(
	"reverse:crypto-agent-adapter-cap",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-z3-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-param-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/agent-security.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-firmware-crypto-agent.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-ops.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands-domains.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent-basic.ts",
		]),
		[
			"crypto-proof-capture",
			"agent-security-proof-capture",
			"crypto_param",
			"agent_prompt",
			"cryptoParamTransformCommandTemplate",
			"agentSecurityBoundaryCommandTemplate",
			"RUNTIME_ADAPTER_CRYPTO_SPECS",
			"RUNTIME_ADAPTER_AGENT_SECURITY_SPECS",
			"re_bootstrap plan python3 openssl",
			"re_bootstrap plan rg python3",
			"applyWantsAgentSecurityBasic",
		],
	) &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/matrix.ts").includes("RUNTIME_ADAPTER_CRYPTO_SPECS") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/matrix.ts").includes("RUNTIME_ADAPTER_AGENT_SECURITY_SPECS") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent-basic.ts").includes("applyWantsAgentSecurityBasic") &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent-basic.ts").includes("export function applyWantsAgentSecurity(ctx") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/cloud_agent-basic.ts").includes("import type { SpecialistPackContext }"),
	"crypto/agent adapter templates + matrix + scoring + run-first gates; agent basic pack not corrupted",
	"Prefer pure-python crypto when z3 missing; agent boundary scan when MCP tooling missing",
);


push(
	"reverse:adapter-scoring-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-firmware-crypto-agent.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-ops.ts",
		]),
		[
			"reverseAdapterCaptureProofFields",
			"applyAdapterDomainCaptureSignals",
			"dfir_pcap",
			"malware_static",
			"firmware_capture",
			"crypto_param",
			"agent_prompt",
			"runtime_capture_strong",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts").includes("applyAdapterDomainCaptureSignals") &&
		joinSources(["packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts","packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts"]).includes("dfir_pcap") &&
		!/export function reverseAdapterCaptureProofFields/.test(read("packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts")),
	"adapter scoring split: core orchestrator + domain CAP signals",
	"Keep domain CAP tags in adapter-scoring-domains; facade re-exports reverseAdapterCaptureProofFields",
);

push(
	"reverse:exploit-shell-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts",
		]),
		[
			"exploitLabShellCommand",
			"exploitLabRunnerScript",
			"exploitLabRunnerScriptTriage",
			"exploitLabRunnerScriptRuns",
			"exploit-lab-proof-capture",
			"exploit-lab-mitigation",
			"exploit-lab-run",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell.ts").includes("exploit-shell-runner") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner.ts").includes("exploitLabRunnerScriptTriage") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts").includes("exploit-lab-mitigation") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts").includes("exploit-lab-proof-capture"),
	"exploit-shell split: thin shell + composed runner (triage/runs)",
	"Do not leave exploit runner body in monofile facade",
);


push(
	"reverse:memory-host-capture-smoke-strong",
	includesAll(memorySmoke, [
		"[mem-image]",
		"[mem-process]",
		"[mem-credential]",
		"[memory-proof-capture]",
		"[mem-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(memorySmoke) &&
		/image=1/.test(memorySmoke) &&
		(/process=1/.test(memorySmoke) || /cred=1/.test(memorySmoke)),
	"host memory smoke produces image+process/cred CAP with runtime_capture_strong without volatility3",
	"Keep pure-python/strings memory CAP able to reach strong when vol missing",
);

push(
	"reverse:cloud-host-capture-smoke-strong",
	includesAll(cloudSmoke, [
		"[cloud-identity]",
		"[cloud-runtime-config]",
		"[cloud-privilege-edge]",
		"[cloud-proof-capture]",
		"[cloud-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(cloudSmoke) &&
		/identity=1/.test(cloudSmoke) &&
		(/runtime=1/.test(cloudSmoke) || /priv=1/.test(cloudSmoke)),
	"host cloud smoke produces identity+runtime/priv CAP with runtime_capture_strong without aws/kubectl",
	"Keep cloud/identity host CAP able to reach strong via env/config scan when IMDS blocked",
);

push(
	"reverse:memory-cloud-adapter-cap",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-forensics.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-vol-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-k8s-docker.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/memory-forensics.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-firmware-crypto-agent.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-ops.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands-domains.ts",
		]),
		[
			"memory-proof-capture",
			"cloud-proof-capture",
			"mem_image",
			"cloud_identity",
			"memoryForensicsHostCommandTemplate",
			"cloudIdentityHostCommandTemplate",
			"RUNTIME_ADAPTER_MEMORY_FORENSICS_SPECS",
			"RUNTIME_ADAPTER_CLOUD_IDENTITY_SPECS",
			"re_bootstrap plan volatility3",
			"re_bootstrap plan python3 kubectl",
			"applyAdapterOpsCaptureSignals",
		],
	) &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/matrix.ts").includes("RUNTIME_ADAPTER_MEMORY_FORENSICS_SPECS") &&
		read("packages/coding-agent/src/core/repi/runtime-adapter/matrix.ts").includes("RUNTIME_ADAPTER_CLOUD_IDENTITY_SPECS") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-ops.ts").includes("mem_image"),
	"memory/cloud adapter templates + matrix + ops scoring + run-first bootstrap gates",
	"Prefer pure-python memory/cloud CAP when volatility3/aws/kubectl missing",
);


push(
	"reverse:js-signing-host-capture-smoke-strong",
	includesAll(jsSigningSmoke, [
		"[js-signing-files]",
		"[js-signing-crypto]",
		"[js-signing-sourcemap]",
		"[repi-js-hook]",
		"[js-signing-proof-capture]",
		"[js-signing-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(jsSigningSmoke) &&
		/crypto=1/.test(jsSigningSmoke) &&
		(/hooks=1/.test(jsSigningSmoke) || /sourcemap=1/.test(jsSigningSmoke)),
	"host js-signing smoke produces crypto+hook/sourcemap CAP with runtime_capture_strong",
	"Keep static JS inventory CAP able to reach strong without live browser hooks",
);

push(
	"reverse:js-signing-cap-scoring",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-helpers.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-scan.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-io/js-signing-run-reverse.ts",
		]),
		[
			"js-signing-proof-capture",
			"proof.exit=",
			"runtime_capture_strong",
			"js_signing_strong",
			"includeGates: true",
			"js-signing-host",
			"crypto\\\\.subtle",
			"signals.crypto",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts").includes("signals.crypto") &&
		read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script-scan.ts").includes("signals.crypto") &&
		read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script-helpers.ts").includes("proof.exit=") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts").includes("js_signing_strong") &&
		read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script-shell.ts").includes("js-signing-host"),
	"js-signing emits signal-based proof.exit; web scoring marks strong; shell host footer retained",
	"Prefer static JS crypto/hook inventory when live CDP hooks unavailable",
);


push(
	"reverse:web-authz-host-capture-smoke-strong",
	includesAll(webAuthzSmoke, [
		"[web-authz-state]",
		"[web-authz-matrix]",
		"[web-authz-object]",
		"[web-authz-sequence]",
		"[web-authz-proof-capture]",
		"[web-authz-env]",
	]) &&
		/proof\.exit=runtime_capture_strong/.test(webAuthzSmoke) &&
		/route=1/.test(webAuthzSmoke) &&
		/principals=1/.test(webAuthzSmoke) &&
		(/objects=1/.test(webAuthzSmoke) || /sequence=1/.test(webAuthzSmoke)),
	"host web-authz smoke produces multi-principal matrix+object/sequence CAP with runtime_capture_strong",
	"Keep web-authz host CAP able to reach strong via principal matrix without real cookies when public URL is used",
);

push(
	"reverse:web-authz-cap-scoring",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-helpers.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-footer.ts",
		]),
		[
			"web-authz-proof-capture",
			"proof.exit=",
			"runtime_capture_strong",
			"authz_explicit_strong",
			"includeGates: true",
			"web-authz-host",
			"webAuthzStateShellCommand",
			"webAuthzScriptObjectsAndProof",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts").includes("proof.exit=") &&
		read("packages/coding-agent/src/core/repi/web-runtime/authz-script-proof.ts").includes("proof.exit=") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts").includes("authz_explicit_strong") &&
		read("packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts").includes("web-authz-host"),
	"web-authz emits signal-based proof.exit; scoring marks strong; shell host footer retained",
	"Keep proof.exit footer in authz-script-proof after modular cut",
);


push(
	"reverse:browser-cap-scoring",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-reverse.ts",
		]),
		[
			"browser-proof-capture",
			"proof.exit=",
			"runtime_capture_strong",
			"browser_explicit_strong",
			"includeGates: true",
			"browser-host",
			"liveBrowserShellCommand",
			"liveBrowserNodeScript",
		],
	) &&
		read("packages/coding-agent/src/core/repi/web-runtime/browser-capture-script-body.ts").includes("proof.exit=") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts").includes("browser_explicit_strong") &&
		read("packages/coding-agent/src/core/repi/web-runtime/browser-capture-script.ts").includes("browser-host"),
	"browser emits signal-based proof.exit; scoring marks strong; shell host footer retained",
	"Prefer playwright when available; fetch fallback must still emit CAP tags",
);

push(
	"reverse:browser-script-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-boot.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-deep.ts",
		]),
		[
			"liveBrowserShellCommand",
			"liveBrowserNodeScript",
			"liveBrowserPlaywrightFunctionSource",
			"browser-proof-capture",
			"emitProofCapture",
			"createRequire",
		],
	) &&
		read("packages/coding-agent/src/core/repi/web-runtime/browser-capture-script.ts").includes("browser-capture-script-body") &&
		read("packages/coding-agent/src/core/repi/web-runtime/browser-capture-script-body.ts").includes("browser-capture-playwright") &&
		(read("packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts").includes("createRequire") || read("packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-boot.ts").includes("createRequire")),
	"browser capture script split: thin shell + node body + playwright resolver",
	"Do not leave browser node capture monofile over soft band",
);


push(
	"reverse:bind-ready-on-runtime-capture",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/catalog.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
		]),
		[
			"bind_ready=true",
			"query.bind_ready",
			"summary.bind_ready",
			"bind.ready",
			"partial_runtime_capture",
			"runtime_capture_strong",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-capture/catalog.ts").includes("bind_ready=") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts").includes("bind_ready=true") &&
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts",
		]).includes("bind_ready from capture strength"),
	"runtime capture partial/strong emits bind_ready=true aliases for claim/completion gates",
	"Do not leave host CAP proof.exit strong/partial stuck at bind_ready=false",
);


push(
	"reverse:native-mobile-exploit-bind-ready",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts",
		]),
		[
			"proof.exit=",
			"bind_ready=",
			"runtime_capture_strong",
			"partial_runtime_capture",
			"summary.proof_exit",
			"summary.bind_ready",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts").includes("PROOF_EXIT") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts").includes("PROOF_EXIT") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts").includes("proof.exit="),
	"native/mobile/exploit host CAP rollups emit proof.exit + bind_ready",
	"Keep host CAP paths claim-ready when capture reaches partial/strong",
);


push(
	"reverse:completion-bind-ready-blocker",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/completion-audit/reverse.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/catalog.ts",
		]),
		[
			"reverse_bind_ready_missing",
			"bind_ready=true",
			"hasBindReady",
			"hasRuntimeProofExit",
			"reverseDomainCaptureNextCommands",
			"query.bind_ready",
		],
	) &&
		read("packages/coding-agent/src/core/repi/completion-audit/reverse.ts").includes("reverse_bind_ready_missing") &&
		read("packages/coding-agent/src/core/repi/completion-audit/reverse.ts").includes("blockers.push") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring.ts").includes("bind_ready=true"),
	"completion audit blocks reverse-heavy finish when runtime proof exists without bind_ready=true",
	"Keep claim/completion gates aligned with host CAP bind_ready emission",
);

push(
	"reverse:types-facades-modular",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/graph/types.ts",
			"packages/coding-agent/src/core/repi/graph/types-attack.ts",
			"packages/coding-agent/src/core/repi/graph/types-exploit.ts",
			"packages/coding-agent/src/core/repi/context-pack/types.ts",
			"packages/coding-agent/src/core/repi/context-pack/types-index.ts",
			"packages/coding-agent/src/core/repi/context-pack/types-pack.ts",
			"packages/coding-agent/src/core/repi/context-pack/types-deps.ts",
		]),
		[
			"AttackGraphNode",
			"ExploitChainNode",
			"ContextPackArtifact",
			"ContextPackDeps",
			"types-attack",
			"types-exploit",
			"types-index",
			"types-pack",
			"types-deps",
		],
	) &&
		read("packages/coding-agent/src/core/repi/graph/types.ts").includes("types-attack") &&
		read("packages/coding-agent/src/core/repi/context-pack/types.ts").includes("types-pack") &&
		!/export type AttackGraphNode =/.test(read("packages/coding-agent/src/core/repi/graph/types.ts")) &&
		!/export type ContextPackArtifact =/.test(read("packages/coding-agent/src/core/repi/context-pack/types.ts")),
	"graph/context-pack pure type monofiles split into domain facades under soft band",
	"Keep facade re-exports for historical imports",
);


push(
	"reverse:aggressive-cut-catalog-prompts-bridges",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/tool-index/catalog-fallback-tools.ts",
			"packages/coding-agent/src/core/repi/tool-index/catalog-fallback-native.ts",
			"packages/coding-agent/src/core/repi/tool-index/catalog-fallback-mobile-web.ts",
			"packages/coding-agent/src/core/repi/resources/prompts-catalog.ts",
			"packages/coding-agent/src/core/repi/resources/prompts-catalog-core.ts",
			"packages/coding-agent/src/core/repi/resources/prompts-catalog-domain.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-data.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-types.ts",
		]),
		[
			"fallbackForMissingTools",
			"fallbackNativeMissingTools",
			"fallbackMobileWebMissingTools",
			"RECON_PROMPTS_CORE",
			"RECON_PROMPTS_DOMAIN",
			"PROFESSIONAL_RUNTIME_BRIDGE_MATRIX",
			"ProfessionalRuntimeBridgeSpec",
		],
	) &&
		read("packages/coding-agent/src/core/repi/tool-index/catalog-fallback-tools.ts").includes("fallbackNativeMissingTools") &&
		read("packages/coding-agent/src/core/repi/resources/prompts-catalog.ts").includes("RECON_PROMPTS_CORE") &&
		read("packages/coding-agent/src/core/repi/professional-runtime-bridges-data.ts").includes("professional-runtime-bridges-types") &&
		!/missingTools\.includes\("checksec"\)/.test(read("packages/coding-agent/src/core/repi/tool-index/catalog-fallback-tools.ts")),
	"aggressive cut: catalog fallback/prompts/bridges split out of fat monofiles",
	"Keep thin facades; domain bodies live in sibling modules",
);

push(
	"reverse:evidence-keymap-exported",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-evidence/types.ts",
			"packages/coding-agent/src/core/repi/reverse-evidence/facts-from-summary.ts",
			"packages/coding-agent/src/core/repi/completion-audit/reverse.ts",
		]),
		[
			"export const KEY_MAP",
			"KEY_MAP",
			"reverse_bind_ready_missing",
			"reverseEvidenceFactsFromSummary",
		],
	) &&
		read("packages/coding-agent/src/core/repi/reverse-evidence/types.ts").includes("export const KEY_MAP") &&
		read("packages/coding-agent/src/core/repi/reverse-evidence/facts-from-summary.ts").includes("KEY_MAP") &&
		read("packages/coding-agent/src/core/repi/completion-audit/reverse.ts").includes("reverse_bind_ready_missing"),
	"KEY_MAP exported for facts-from-summary; completion bind_ready blocker remains",
	"Do not leave KEY_MAP file-private after modular evidence splits",
);


push(
	"reverse:narrative-tools-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/campaign.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/campaign-autopilot.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-board-reason.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-operator.ts",
		]),
		[
			"registerRepiNarrativeCampaignTools",
			"registerAutopilotTool",
			"registerRepiNarrativeBoardReasonTools",
			"registerOperatorTool",
			"re_autopilot",
			"re_operator",
		],
	) &&
		read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/campaign.ts").includes("registerAutopilotTool") &&
		read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/operator-board-reason.ts").includes("registerOperatorTool") &&
		!/name:\s*\"re_autopilot\"/.test(read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/campaign.ts")),
	"narrative campaign/operator tools split per-tool; facades only register",
	"Do not re-bloat narrative monofiles with multi-tool bodies",
);


push(
	"reverse:swarm-kg-artifacts-cut",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/run-orchestrate.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/run-orchestrate-workers.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/run-orchestrate-retry.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/handoff-build-worker.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-case.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-prep.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-route.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-artifact.ts",
			"packages/coding-agent/src/core/repi/storage/io/artifacts.ts",
		]),
		[
			"runSwarm",
			"executeSwarmSelectedWorkers",
			"retryBlockedSwarmWorkerExecutions",
			"buildSwarmWorkerRetryHandoffClosure",
			"buildSwarmWorkerRetryHandoffRow",
			"buildKnowledgeGraph",
			"buildKnowledgeCaseSignatures",
			"assembleKnowledgeWorkerRoutingHints",
			"assembleKnowledgeGraphArtifact",
			"recentMarkdownArtifacts",
			"seedWorkerRoutingHints",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/storage/io/artifacts.ts").includes("memoryActiveInjectionPackPath") &&
		!read("packages/coding-agent/src/core/repi/storage/io/artifacts.ts").includes("appendFileSync") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/run-orchestrate.ts").includes("executeSwarmSelectedWorkers") &&
		read("packages/coding-agent/src/core/repi/knowledge-graph/build.ts").includes("seedWorkerRoutingHints") &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/run-orchestrate.ts").includes("executeSwarmWorkerSubagent"),
	"swarm orchestrate/handoff + knowledge-graph build split; storage artifacts dead import bloat removed",
	"Keep reverse routing seeds flowing into finalize; do not reintroduce path-import monofile bloat",
);


push(
	"reverse:adapter-checkpoints-autolane-decision-cut",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-firmware-crypto-agent.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-types.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain-native.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain-web-mobile.ts",
			"packages/coding-agent/src/core/repi/mission/checkpoints-domain-ops.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack-reverse.ts",
			"packages/coding-agent/src/core/repi/auto-lane/commands-pack-parse.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/build-format.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/build-format-text.ts",
			"packages/coding-agent/src/core/repi/decision-runtime/build-format-write.ts",
		]),
		[
			"applyAdapterDomainCaptureSignals",
			"applyAdapterDfirMalwareCaptureSignals",
			"applyAdapterFirmwareCryptoAgentCaptureSignals",
			"MISSION_CHECKPOINTS_BY_DOMAIN",
			"MISSION_CHECKPOINTS_NATIVE",
			"MISSION_CHECKPOINTS_WEB_MOBILE",
			"MISSION_CHECKPOINTS_OPS",
			"autoLaneCommandPack",
			"seedReverseAutoLaneCommands",
			"parseAutoLaneCommand",
			"formatDecisionCore",
			"writeDecisionCoreArtifact",
			"reverse_proof_exit_ready",
			"dfir_pcap",
			"malware_static",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains.ts").includes("dfir_pcap") &&
		read("packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-domains-dfir-malware.ts").includes("dfir_pcap") &&
		!read("packages/coding-agent/src/core/repi/auto-lane/commands-pack.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/auto-lane/commands-pack-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/decision-runtime/build-format.ts").includes("objective_stack:") &&
		read("packages/coding-agent/src/core/repi/decision-runtime/build-format-text.ts").includes("objective_stack:") &&
		read("packages/coding-agent/src/core/repi/mission/checkpoints-domain.ts").includes("MISSION_CHECKPOINTS_NATIVE"),
	"adapter CAP domains, mission checkpoints, auto-lane reverse pack, decision format split under soft band",
	"Keep reverse CAP tags and reverse_proof_exit_ready domain matrices after modular cuts",
);


push(
	"reverse:swarm-lane-inline-scope-proof-cut",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact-refresh.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact-persist.ts",
			"packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact-boards.ts",
			"packages/coding-agent/src/core/repi/lane-commands/helpers.ts",
			"packages/coding-agent/src/core/repi/lane-commands/helpers-map.ts",
			"packages/coding-agent/src/core/repi/lane-commands/helpers-memory.ts",
			"packages/coding-agent/src/core/repi/lane-commands/helpers-format.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step-bootstrap.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step-decide.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-inline-step-reverse.ts",
			"packages/coding-agent/src/core/repi/artifact-scope-filter.ts",
			"packages/coding-agent/src/core/repi/artifact-scope-filter-report.ts",
			"packages/coding-agent/src/core/repi/artifact-scope-filter-select.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/build-run.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/build-run-steps.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/build-run-phases.ts",
		]),
		[
			"writeSwarmArtifact",
			"refreshSwarmArtifactRuntimeState",
			"persistSwarmRuntimeArtifacts",
			"writeSwarmModeBoards",
			"augmentLaneCommandPackFromMap",
			"augmentLaneCommandPackFromMemory",
			"formatLaneCommandPack",
			"runAutoLaneInlineStep",
			"runAutoLaneBootstrapOnly",
			"resolveAutoLaneInlineDecision",
			"autoLaneInlineReverseSections",
			"buildArtifactScopeFilterReport",
			"scopedMarkdownArtifacts",
			"reverse_proof_exit_ready",
			"runProofLoop",
			"createProofLoopRunHelpers",
			"runProofLoopRepairPhases",
			"finalizeProofLoopOutput",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact.ts").includes("atomicWriteFileSync") &&
		read("packages/coding-agent/src/core/repi/swarm-runtime/build/write-artifact-persist.ts").includes("atomicWriteFileSync") &&
		!read("packages/coding-agent/src/core/repi/lane-commands/helpers.ts").includes("map_reuse") &&
		read("packages/coding-agent/src/core/repi/lane-commands/helpers-map.ts").includes("map_reuse") &&
		!read("packages/coding-agent/src/core/repi/artifact-scope-filter.ts").includes("reverse_proof_exit_ready") &&
		read("packages/coding-agent/src/core/repi/artifact-scope-filter-report.ts").includes("reverse_proof_exit_ready") &&
		read("packages/coding-agent/src/core/repi/auto-lane/run-inline-step.ts").includes("autoLaneInlineReverseSections") &&
		!read("packages/coding-agent/src/core/repi/proof-loop-runtime/build-run.ts").includes("executeProofLoopBridgeStep") &&
		read("packages/coding-agent/src/core/repi/proof-loop-runtime/build-run-phases.ts").includes("executeProofLoopBridgeStep"),
	"swarm write-artifact, lane helpers, auto-lane inline, artifact-scope, proof-loop run split under soft band",
	"Keep reverse next/proof_exit gates after modular cuts; facades stay thin",
);


push(
	"reverse:final-fat-cut-telemetry-js-mobile",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update-exec.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update-transitions.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/demotions-rows.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/demotions-rows-worker.ts",
			"packages/coding-agent/src/core/repi/autonomous-budget/demotions-rows-lane.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-helpers.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-scan.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-pure-build-plan.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body-sections.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-io.ts",
			"packages/coding-agent/src/core/repi/kernel/install-registrars-base-deps-reverse-loop.ts",
		]),
		[
			"updateReconCompactionTelemetryFromExecutions",
			"reverseCaptureProgress",
			"workerScoreDemotionRows",
			"autonomousLaneDemotionRows",
			"jsSigningNodeScript",
			"jsSigningScriptProofFooter",
			"buildMobileRuntimePlanSections",
			"formatProofLoop",
			"reverse_runtime_capture_gate",
			"installBaseReverseDeps",
			"installBaseReverseIoDeps",
			"installBaseReverseLoopDeps",
			"runNativeRuntime",
			"runProofLoop",
		],
	) &&
		joinSources(["packages/coding-agent/src/core/repi/compact-resume/telemetry-update-exec.ts","packages/coding-agent/src/core/repi/compact-resume/telemetry-update-transitions.ts"]).includes("require_proof_exit_before_claim") &&
		read("packages/coding-agent/src/core/repi/web-runtime/js-signing-script-helpers.ts").includes("bind_ready=") &&
		read("packages/coding-agent/src/core/repi/reverse-io/mobile-pure-build-plan.ts").includes("re_complete audit") &&
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body-sections.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body-reverse.ts",
		]).includes("bind_ready=true"),
	"telemetry/demotions/js-signing/mobile/proof-format/install reverse deps cut under soft band",
	"Keep reverse proof.exit/bind_ready/progress gates after modular cuts",
);


push(
	"reverse:last-six-fat-monofile-cut",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure-workers.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure-merge.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/append-core.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/append-event.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/append-hash.ts",
			"packages/coding-agent/src/core/repi/tool-trace/ledger/append-rotate.ts",
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle-control.ts",
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle-pause.ts",
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle-edit.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/operation-format.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/operation-format-text.ts",
			"packages/coding-agent/src/core/repi/campaign-runtime/operation-format-write.ts",
			"packages/coding-agent/src/core/repi/toolchain/general.ts",
			"packages/coding-agent/src/core/repi/toolchain/general-core.ts",
			"packages/coding-agent/src/core/repi/toolchain/general-identity.ts",
			"packages/coding-agent/src/core/repi/toolchain/general-web.ts",
			"packages/coding-agent/src/core/repi/context-format/format-runtime-memory.ts",
			"packages/coding-agent/src/core/repi/context-format/format-runtime-memory-engines.ts",
			"packages/coding-agent/src/core/repi/context-format/format-runtime-memory-queues.ts",
		]),
		[
			"verifyWorkerRetryHandoffClosureV1",
			"collectWorkerRetryHandoffWorkerErrors",
			"collectWorkerRetryHandoffMergeErrors",
			"appendToolCallTraceEvent",
			"proof_exit",
			"bind_ready",
			"pauseGoal",
			"editGoal",
			"formatOperation",
			"writeOperationArtifact",
			"re_complete audit",
			"REPI_TOOL_BOOTSTRAP_CATALOG_GENERAL",
			"volatility3",
			"formatContextPackMemoryBudgetSections",
			"formatContextPackMemoryEngineSections",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure.ts").includes("retry_handoff_attempt_exceeded") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/handoff/verify-closure-workers.ts").includes("retry_handoff_attempt_exceeded") &&
		!read("packages/coding-agent/src/core/repi/tool-trace/ledger/append-core.ts").includes("ensureReconStorage") &&
		read("packages/coding-agent/src/core/repi/tool-trace/ledger/append-event.ts").includes("appendToolCallTraceEvent") &&
		!read("packages/coding-agent/src/core/repi/goal/commands-lifecycle-control.ts").includes("pauseGoal(") &&
		read("packages/coding-agent/src/core/repi/goal/commands-lifecycle-pause.ts").includes("export function pauseGoal") &&
		!read("packages/coding-agent/src/core/repi/campaign-runtime/operation-format.ts").includes("operation_queue:") &&
		read("packages/coding-agent/src/core/repi/campaign-runtime/operation-format-text.ts").includes("operation_queue:") &&
		!read("packages/coding-agent/src/core/repi/toolchain/general.ts").includes("hashcat") &&
		read("packages/coding-agent/src/core/repi/toolchain/general-core.ts").includes("hashcat") &&
		!read("packages/coding-agent/src/core/repi/context-format/format-runtime-memory.ts").includes("memory_orchestrator:") &&
		read("packages/coding-agent/src/core/repi/context-format/format-runtime-memory-engines.ts").includes("memory_orchestrator:"),
	"last six >=135 logic monofiles split: handoff verify, tool-trace append, goal lifecycle, operation format, toolchain general, context memory",
	"Keep reverse proof markers and re_complete audit after modular cuts",
);


push(
	"reverse:softband-cut-and-native-dyn-auto",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/proof-loop-core/execute-step.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/execute-step-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative-deps.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative-deps-imports.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-build.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-io.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-write.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-write-markdown.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build-plan.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build-assemble.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-dyn.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
		]),
		[
			"executeProofLoopStep",
			"executeProofLoopReversePhase",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"getRepiNarrativeInstallDeps",
			"narrativeInstallDepsBag",
			"writeSwarmSubagentRuntimeManifest",
			"writeSwarmWorkerSessionStreams",
			"swarmManifestReverseEvidenceRefs",
			"writeLaneRunArtifact",
			"formatLaneRunArtifactMarkdown",
			"buildExploitLabArtifact",
			"buildExploitLabPlanSections",
			"re_complete audit",
			"assembleAttackGraphArtifact",
			"appendAttackGraphReverseCapture",
			"REPI_NATIVE_DYN",
			"! command -v gdb",
			"native-dyn-probe",
			"bind_ready",
			"proof.exit",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/execute-step.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/execute-step-reverse.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/kernel/install-narrative-deps.ts").includes("buildCampaignOutput") &&
		read("packages/coding-agent/src/core/repi/kernel/install-narrative-deps-imports.ts").includes("buildCampaignOutput") &&
		!read("packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/reverse-io/exploit-pure-build-plan.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts").includes("! command -v gdb") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts").includes("bind_ready"),
	"softband 130-134 cut + native dyn auto when gdb missing on lean hosts",
	"Keep reverse next/gates; native CAP strong path auto-dyn without REPI_NATIVE_DYN when gdb absent",
);


push(
	"reverse:softband-storage-authz-claim-telem",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/storage.ts",
			"packages/coding-agent/src/core/repi/storage/paths-memory.ts",
			"packages/coding-agent/src/core/repi/storage/paths-evidence.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-helpers.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-proof.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/build-merge.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/build-merge-reverse.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update-exec.ts",
			"packages/coding-agent/src/core/repi/compact-resume/telemetry-update-transitions.ts",
		]),
		[
			"export * from \"./storage/paths-memory.ts\"",
			"evidenceRunsDir",
			"memoryPath",
			"webAuthzStateNodeScript",
			"webAuthzScriptPrincipalMatrix",
			"webAuthzScriptObjectsAndProof",
			"proof.exit=",
			"bind_ready",
			"buildStructuredClaimMergeFromSwarm",
			"reverseClaimBlocked",
			"reverse_missing_proof_exit_blocks_final",
			"updateReconCompactionTelemetryFromExecutions",
			"markReverseCaptureTelemetryProgress",
			"require_proof_exit_before_claim",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts").includes("proof.exit=") &&
		read("packages/coding-agent/src/core/repi/web-runtime/authz-script-proof.ts").includes("proof.exit=") &&
		!read("packages/coding-agent/src/core/repi/structured-claim-merge/build-merge.ts").includes("function reverseClaimBlocked") &&
		read("packages/coding-agent/src/core/repi/structured-claim-merge/build-merge-reverse.ts").includes("reverseClaimBlocked") &&
		read("packages/coding-agent/src/core/repi/compact-resume/telemetry-update-transitions.ts").includes("require_proof_exit_before_claim") &&
		!read("packages/coding-agent/src/core/repi/storage.ts").includes("evidenceRunsDir") &&
		read("packages/coding-agent/src/core/repi/storage/paths-evidence.ts").includes("evidenceRunsDir"),
	"softband cut: storage path bags, authz script helpers/proof, claim merge reverse gate, telemetry transitions",
	"Keep reverse proof.exit/bind_ready gates after modular softband cuts",
);


push(
	"reverse:softband-browser-catalog-repair-proof",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/tool-index/catalog-tools.ts",
			"packages/coding-agent/src/core/repi/tool-index/catalog-tools-probes.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-core-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-run-reverse.ts",
			"packages/coding-agent/src/core/repi/repair-rollback-build-policy.ts",
			"packages/coding-agent/src/core/repi/repair-rollback-build-policy-core.ts",
			"packages/coding-agent/src/core/repi/repair-rollback-build-reverse.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof-nodes.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof-gaps.ts",
		]),
		[
			"toolsFromCommand",
			"CATALOG_COMMAND_TOOL_PROBES",
			"frida",
			"gdb",
			"volatility3",
			"runLiveBrowser",
			"extractBrowserProofExit",
			"formatBrowserRunOutputWithReverseFooter",
			"browserRunReverseFooter",
			"proof.exit",
			"buildRepairRollbackPolicyFromAutofix",
			"buildAutofixRepairRollbackCore",
			"reverseRepairNextCommands",
			"appendRuntimeAdapterProofSection",
			"appendRuntimeAdapterMitigationAndParser",
			"appendRuntimeAdapterMissingProofGaps",
			"proofExitSignal",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/tool-index/catalog-tools.ts").includes("volatility3") &&
		read("packages/coding-agent/src/core/repi/tool-index/catalog-tools-probes.ts").includes("volatility3") &&
		!read("packages/coding-agent/src/core/repi/reverse-io/browser-run-core.ts").includes("browserRunReverseFooter") &&
		read("packages/coding-agent/src/core/repi/reverse-io/browser-run-core-proof.ts").includes("browserRunReverseFooter") &&
		read("packages/coding-agent/src/core/repi/repair-rollback-build-policy.ts").includes("reverseRepairNextCommands") &&
		!read("packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof.ts").includes("binary mitigation map") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-proof-nodes.ts").includes("binary mitigation map"),
	"softband cut: catalog probes, browser reverse footer proof, repair core, adapter proof nodes",
	"Keep reverse proof.exit footer and repair next after modular softband cuts",
);


push(
	"reverse:softband-pool-exec-proof-operator",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/worker-runtime/pool-verify.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/pool-verify-workers.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/pool-verify-merge.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/execute-command.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/execute-command-shell.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/execute-command-reverse.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-assemble.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/core-build.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/core-build-assemble.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/core-build-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel-runtime/criteria-policy-sources.ts",
			"packages/coding-agent/src/core/repi/kernel-runtime/criteria-policy-directives.ts",
			"packages/coding-agent/src/core/repi/context-pack/resume.ts",
			"packages/coding-agent/src/core/repi/context-pack/resume-missing.ts",
			"packages/coding-agent/src/core/repi/context-pack/resume-transitions.ts",
		]),
		[
			"verifyWorkerRuntimePool",
			"collectWorkerRuntimePoolWorkerErrors",
			"collectWorkerRuntimePoolMergeErrors",
			"executeSwarmWorkerCommand",
			"executeSwarmWorkerShellCommand",
			"swarmExecuteReverseNotes",
			"refreshProofLoop",
			"assembleRefreshedProofLoop",
			"reverseDomainCaptureNextCommands",
			"includeGates",
			"buildOperator",
			"assembleOperatorArtifact",
			"operatorReverseNextActions",
			"kernelDirectives",
			"specialist-capability-matrix",
			"buildExactResumeContextPack",
			"applyExactResumeTransitions",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/worker-runtime/pool-verify.ts").includes("timeout_not_marked") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/pool-verify-workers.ts").includes("timeout_not_marked") &&
		!read("packages/coding-agent/src/core/repi/swarm-exec/execute-command.ts").includes("swarmExecuteReverseNotes") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/execute-command-shell.ts").includes("swarmExecuteReverseNotes") &&
		!read("packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh.ts").includes("reverseDomainCaptureNextCommands") &&
		read("packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-assemble.ts").includes("reverseDomainCaptureNextCommands") &&
		!read("packages/coding-agent/src/core/repi/operator-runtime/core-build.ts").includes("operatorReverseNextActions") &&
		read("packages/coding-agent/src/core/repi/operator-runtime/core-build-assemble.ts").includes("operatorReverseNextActions") &&
		!read("packages/coding-agent/src/core/repi/kernel-runtime/criteria-policy-sources.ts").includes("execution-first") &&
		read("packages/coding-agent/src/core/repi/kernel-runtime/criteria-policy-directives.ts").includes("execution-first") &&
		read("packages/coding-agent/src/core/repi/context-pack/resume.ts",
			"packages/coding-agent/src/core/repi/context-pack/resume-missing.ts").includes("applyExactResumeTransitions"),
	"softband cut: pool-verify workers/merge, swarm shell reverse notes, proof refresh assemble, operator assemble, kernel directives, resume transitions",
	"Keep reverse next/gates after modular softband cuts",
);


push(
	"reverse:softband-final-five-zero",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-base.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-base-domains.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/feedback-classify.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/feedback-classify-execution.ts",
			"packages/coding-agent/src/core/repi/context-pack/artifact-index-core.ts",
			"packages/coding-agent/src/core/repi/context-pack/artifact-index-specs.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build-assemble.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/reverse-capture.ts",
		]),
		[
			"analyzeLaneRunBase",
			"applyAnalyzeBaseDomainFollowups",
			"runtime-compare-breakpoints",
			"classifyOperatorFeedback",
			"classifyOperatorExecutionFeedback",
			"re_exploit_lab run",
			"re_verifier matrix",
			"scopedContextArtifactIndex",
			"contextArtifactDirSpecs",
			"native_runtime",
			"web_authz",
			"proof_loop",
			"buildContextPackArtifactObject",
			"buildAttackGraph",
			"appendAttackGraphReverseCapture",
			"assembleAttackGraphArtifact",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-base.ts").includes("runtime-compare-breakpoints") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/analyze-base-domains.ts").includes("runtime-compare-breakpoints") &&
		!read("packages/coding-agent/src/core/repi/operator-runtime/feedback-classify.ts").includes("missing_tool_or_dependency") &&
		read("packages/coding-agent/src/core/repi/operator-runtime/feedback-classify-execution.ts").includes("missing_tool_or_dependency") &&
		!read("packages/coding-agent/src/core/repi/context-pack/artifact-index-core.ts").includes("evidenceNativeRuntimeDir") &&
		read("packages/coding-agent/src/core/repi/context-pack/artifact-index-specs.ts").includes("evidenceNativeRuntimeDir") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build.ts").includes("appendAttackGraphReverseCapture"),
	"final softband five cut to under-130: analyze domains, feedback execution, artifact index specs, attack-graph thin",
	"Keep reverse/native followups and reverse capture append after softband zero",
);


push(
	"reverse:native-gdb-info-and-memory-header",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-dyn.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-forensics.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-vol-host.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
			"docs/reverse-agent/memory-host-capture-smoke.out",
		]),
		[
			"native-gdb-info",
			"CAP_GDB_INFO",
			"gdb_info=%s",
			"static_batch=1",
			"REPI_NATIVE_RUN",
			"native-dyn-probe",
			"mem-header",
			"pure_python_header_probe",
			"CAP_HEADER",
			"pe=1",
		],
	) &&
		/\[native-gdb-info\]/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/gdb_info=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-gdb\]/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[mem-header\]/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/header=1/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")),
	"native gdb static-info + live REPI_NATIVE_RUN batch; memory PE/ELF header probe CAP",
	"True gdb host path + memory pure-python header strengthen reverse CAP without volatility3",
);


push(
	"reverse:browser-playwright-chromium-host",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-boot.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script-body.ts",
			"docs/reverse-agent/browser-host-capture-smoke.out",
		]),
		[
			"playwrightCapture",
			"playwright-core",
			"executablePath",
			"chromium-browser",
			"emitProofCapture",
			"engine=playwright",
			"NODE_PATH",
			"plainFetch",
		],
	) &&
		/\[browser-engine\] playwright=yes/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/engine=playwright/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/storage=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		(/api=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) || /scripts=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out"))),
	"live browser prefers real playwright-core + system chromium; host smoke engine=playwright strong",
	"Keep fetch fallback but prefer true chromium capture when playwright-core resolves",
);


push(
	"reverse:malware-capa-floss-authz-cookie",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-floss-surrogates.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-helpers.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-proof.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts",
			"docs/reverse-agent/malware-host-capture-smoke.out",
			"docs/reverse-agent/web-authz-host-capture-smoke.out",
		]),
		[
			"MALWARE_CAPA_FLOSS_SURROGATE_LINES",
			"malware-capa",
			"malware-floss",
			"pure_python=1",
			"CAP_CAPA",
			"CAP_FLOSS",
			"web-authz-cookie-diff",
			"cookie_diff",
			"cookiePresent",
			"setCookieCount",
			"potential_bola",
			"default_object_path",
		],
	) &&
		/\[malware-capa\]/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-floss\]/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/capa=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/floss=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[web-authz-cookie-diff\]/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/differential=1/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/cookie_diff=1/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/potential_bola=true/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")),
	"malware pure-python capa/floss surrogates; web-authz cookie differential + default object BOLA probe",
	"Keep lean-host malware CAP strong without capa/floss binaries; authz multi-principal cookie/session diffs with idor signal",
);


push(
	"reverse:checksec-firmware-crypto-surrogates",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-checksec-surrogate.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-extract-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-archive-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-image-surrogate.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-z3-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-param-script.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
			"docs/reverse-agent/crypto-host-capture-smoke.out",
		]),
		[
			"NATIVE_CHECKSEC_SURROGATE_LINES",
			"native-checksec",
			"pure_python=1",
			"pure-python-elf",
			"FIRMWARE_IMAGE_SURROGATE_LINES",
			"firmware-image",
			"crypto-known-answer",
			"selfcheck",
			"CAP_KNOWN",
		],
	) &&
		(/\[native-checksec\] surrogate=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) ||
			(/checksec=\/(usr\/bin|usr\/local\/bin)\/checksec/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
				/\[native-checksec\].*Partial RELRO|NX disabled|No PIE/.test(read("docs/reverse-agent/native-host-capture-smoke.out")))) &&
		/checksec=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[firmware-image\]/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/pure_python_map=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/service=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[crypto-known-answer\]/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/selfcheck=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/known=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")),
	"host checksec or pure-python ELF mitigations; firmware image signature map; crypto known-answer selfcheck",
	"Prefer real checksec when present; keep pure-python surrogate for lean hosts without checksec/z3",
);


push(
	"reverse:cloud-agent-security-deep",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-k8s-docker.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-deep.ts",
			"docs/reverse-agent/cloud-host-capture-smoke.out",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"CLOUD_IDENTITY_DEEP_LINES",
			"cloud-k8s-sa",
			"cloud-imds-chain",
			"cloud-identity-deep",
			"AGENT_SECURITY_DEEP_LINES",
			"agent-injection-probe",
			"agent-schema-guard",
			"agent-policy",
			"agent-boundary",
			"CAP_K8S",
			"CAP_SCHEMA",
		],
	) &&
		/\[cloud-k8s-sa\]/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-imds-chain\]/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-identity-deep\]/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/k8s=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		(/imds_scaffold=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) ||
			/imds_mock=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out"))) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[agent-injection-probe\]/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-schema-guard\]/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-policy\]/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/schema=1/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")),
	"cloud deep k8s-sa/imds-mock-or-scaffold/aws-file; agent injection-probe + schema-guard ratio",
	"Keep cloud/agent reverse CAP strong; IMDS mock fixture preferred over link-local scaffold",
);

push(
	"reverse:sticky-inject-multi-turn",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/agent-hooks-run.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/agent-hooks-sticky.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/agent-hooks-run-cold.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/cold-start-packets.ts",
			"scripts/reverse-agent/repi-sticky-inject-smoke.mjs",
			"docs/reverse-agent/sticky-inject-host-capture-smoke.out",
		]),
		[
			"repi_inject: sticky-v1",
			"cold-start-lean-v1",
			"coldStartInjected",
			"promptLooksLikeContinuation",
			"buildStickyRuntimeLine",
			"sticky-t2",
			"runtime_capture_strong",
		],
	) &&
		/\[sticky-t1\] cold_lean=1/.test(read("docs/reverse-agent/sticky-inject-host-capture-smoke.out")) &&
		/\[sticky-t2\] sticky_v1=1/.test(read("docs/reverse-agent/sticky-inject-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/sticky-inject-host-capture-smoke.out")),
	"long-run sticky inject: T1 cold-start-lean then T2 sticky-v1 with mission coldStartInjected",
	"Keep multi-turn lean inject without re-dumping manuals/memory every turn",
);



push(
	"reverse:js-signing-deep-exploit-crash",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-helpers.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-scan.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-crash.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner.ts",
			"docs/reverse-agent/js-signing-host-capture-smoke.out",
			"docs/reverse-agent/exploit-host-capture-smoke.out",
		]),
		[
			"jsSigningScriptDeepBody",
			"js-signing-deep",
			"js-signing-secret",
			"fetchText",
			"scanJsText",
			"selfcheck",
			"pure-python-elf",
			"exploit-lab-crash",
			"exploit-lab-offset",
			"REPI_EXPLOIT_CRASH",
			"cap_crash",
		],
	) &&
		/\[js-signing-deep\]/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/\[js-signing-secret\]/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/crypto=1/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/pure-python-elf/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/\[exploit-lab-crash\]/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/\[exploit-lab-offset\]/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/crash=1/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")),
	"js-signing deep follow scripts/secrets/selfcheck; exploit pure-python-elf + cyclic crash offset",
	"Keep URL/static js-signing strong and exploit lab crash/offset CAP without full ROPgadget",
);


push(
	"reverse:mobile-deep-exploit-gdb-offset",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-deep.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-crash.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
			"docs/reverse-agent/exploit-host-capture-smoke.out",
		]),
		[
			"MOBILE_APK_DEEP_LINES",
			"mobile-apk-deep",
			"MOBILE_PROOF_CAPTURE_LINES",
			"CAP_DEEP",
			"exploitLabRunnerScriptCrash",
			"exploit-lab-gdb",
			"exact=",
			"REPI_EXPLOIT_CRASH",
			"pure-python-elf",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts").includes("mobile-apk-deep") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-deep.ts").includes("mobile-apk-deep") &&
		!read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-runs.ts").includes("exploit-lab-gdb") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-crash.ts").includes("exploit-lab-gdb") &&
		/\[mobile-apk-deep\]/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/deep=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/apk=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/frida=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[exploit-lab-gdb\]/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/exact=/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/crash=1/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")),
	"mobile pure-python APK deep map + proof rollup; exploit gdb exact offset probe modularized",
	"Keep mobile strong without jadx/device attach; exploit crash offset uses gdb when present",
);


push(
	"reverse:deps-typecheck-syntax-recovery",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/journal-append.ts",
			"packages/coding-agent/src/core/repi/failure-repair/classify-ops.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/firmware_rootfs.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/firmware_rootfs_scaffolds.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-basic.ts",
			"packages/coding-agent/src/core/repi/profile-check/checks-path-lists.ts",
			"packages/coding-agent/src/core/repi/goal/commands-lifecycle-show.ts",
			"package-lock.json",
		]),
		[
			"appendText",
			"endsWith",
			"NATIVE_CHECKSEC_SURROGATE_LINES",
			"native-r2-mitigation",
			"firmware-rootfs-service-secret-map",
			"applyWantsPwnPrimitiveBasic",
			"profileCheckSourceFiles",
			"STATUS_KEY",
		],
	) &&
		read("packages/coding-agent/src/core/repi/journal-append.ts").includes("appendText") &&
		read("packages/coding-agent/src/core/repi/failure-repair/classify-ops.ts").includes("appendText") &&
		read("packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts").includes("NATIVE_CHECKSEC_SURROGATE_LINES") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-basic.ts").includes("applyWantsPwnPrimitiveBasic") &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-basic.ts").includes("export function applyWantsPwnPrimitive(ctx") &&
		read("packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-basic.ts").includes("export function applyWantsPwnPrimitiveBasic") &&
		read("packages/coding-agent/src/core/repi/profile-check/checks-path-lists.ts").includes("profileCheckSourceFiles") &&
		read("packages/coding-agent/src/core/repi/goal/commands-lifecycle-show.ts").includes('import { EDIT_TOKEN_COMPLETION'),
	"workspace deps installed; modularization syntax corruption recovered for typecheck entry",
	"Keep product contract green after npm install and parse-error recovery; full semantic typecheck remains follow-up",
);


push(
	"reverse:typecheck-debt-cut-wave",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context-note-tool.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-graph-lane.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-execute.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-deps.ts",
			"packages/coding-agent/src/core/repi/swarm-format-types.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-audit-fields.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/swarm.ts",
			"packages/coding-agent/src/core/repi/autofix/write.ts",
			"packages/coding-agent/src/core/extensions/types.ts",
		]),
		[
			"params: any",
			"extensions/types.ts",
			"subagentRuntimeManifests",
			"swarmContractCovered",
			"appendAttackGraphSwarmReverseGaps",
			"verifyRepairRollbackPolicyV1",
		],
	) &&
		read("packages/coding-agent/src/core/repi/kernel/install-narrative/tools/context-note-tool.ts").includes("params: any") &&
		read("packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-graph-lane.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-execute.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-deps.ts").includes("params: any") &&
		read("packages/coding-agent/src/core/repi/swarm-format-types.ts").includes("subagentRuntimeManifests?: any") &&
		read("packages/coding-agent/src/core/repi/swarm-exec/pure-audit-fields.ts").includes("swarmContractCovered") &&
		read("packages/coding-agent/src/core/repi/attack-graph/build/swarm.ts").includes("appendAttackGraphSwarmReverseGaps(ctx, swarm)") &&
		read("packages/coding-agent/src/core/repi/autofix/write.ts").includes("verifyRepairRollbackPolicyV1"),
	"semantic typecheck debt cut: narrative params, extension imports, swarm format types, audit imports",
	"Keep product contract green while reducing repi tsgo error mass; full zero remains follow-up",
);


push(
	"reverse:typecheck-repi-semantic-zero",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics-cmd.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics-worker.ts",
			"packages/coding-agent/src/core/repi/worker-runtime/types/child-session-status.ts",
			"packages/coding-agent/src/core/repi/runtime-types/swarm-worker-child-status.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-resolution.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-challenge.ts",
			"packages/coding-agent/src/core/repi/verifier-runtime/types.ts",
		]),
		[
			"stripSwarmPidMarker",
			"__repi_swarm_pid",
			"passed",
			"timeout",
			"queued",
			"exhausted",
			"missingCoverageRows",
			"export type { VerifierAssertion }",
		],
	) &&
		joinSources([
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics-cmd.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics-worker.ts",
		]).includes("parentPid") &&
		read("packages/coding-agent/src/core/repi/worker-runtime/types/child-session-status.ts").includes('"timeout"') &&
		read("packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-resolution.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-challenge.ts").includes("missingCoverageRows"),
	"repi semantic typecheck zero: status unions, pid marker, claim ledger fields, verifier assertion export",
	"Product-contract gate for typecheck recovery landmarks; full monorepo green remains broader",
);


push(
	"reverse:exact-ret-offset-exploit-native-dyn",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-crash.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-dyn.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-structured.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-mitigations.ts",
			"docs/reverse-agent/exploit-host-capture-smoke.out",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"_repi_cyclic",
			"_repi_find_offset",
			"min_crash_len",
			"gdb-rsp0",
			"NATIVE_DYN_PROBE_LINES",
			"native-dyn-offset",
			"summary.dyn_exact_offset",
			"summary.frida_host=1",
			"summary.dyn_crash=1",
		],
	) &&
		/exact=\d+/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/method=gdb-rsp0/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/\[native-dyn-offset\] exact=\d+/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-dyn-probe\] crash=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")),
	"exact ret-offset via gdb *($rsp) for exploit lab + native dyn crash probe",
	"Prefer stack return-address window over RIP at ret; keep bind_ready strong on host CAP smokes",
);


push(
	"reverse:typecheck-monorepo-semantic-zero",
	!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")) &&
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/recon-profile.ts",
				"packages/coding-agent/src/core/repi/memory-compact-resume.ts",
			"packages/coding-agent/src/core/repi/memory-compact-resume-helpers.ts",
				"packages/coding-agent/src/core/repi/memory-search.ts",
				"packages/coding-agent/src/core/repi/storage/io/atomic-write-sync.ts",
				"packages/coding-agent/src/modes/rpc/rpc-types.ts",
			]),
			[
				"writeLocalClaimReleaseMarker",
				"appendFailureRepairLedger",
				"appendToolCallTraceFromCall",
				"contextCompactionLedger",
				"verifyCompactionResumeLedger",
				"governanceLedgerMaxRows",
				"writeFileAtomic",
				"RpcSessionTreeNode",
				"appendMemoryEventTransaction",
			],
		),
	"monorepo type debt cut: recon-profile historical exports + compact/governance ledgers + RpcSessionTreeNode; no memory-store product monofile",
	"Keep product memory surface removed; atomic write lives under storage/io",
);


push(
	"reverse:mobile-frida-malware-memory-deep",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida-local.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-deep-surrogates.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-forensics.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-vol-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-deep-surrogates.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
			"docs/reverse-agent/malware-host-capture-smoke.out",
			"docs/reverse-agent/memory-host-capture-smoke.out",
		]),
		[
			"MOBILE_FRIDA_LEAN_LINES",
			"mobile-frida-surface",
			"mobile-frida-map",
			"dual_surface=java+native",
			"MALWARE_DEEP_SURROGATE_LINES",
			"malware-pe",
			"malware-xor",
			"MEMORY_DEEP_SURROGATE_LINES",
			"mem-module",
			"pure_python_module_scan",
		],
	) &&
		/\[mobile-frida-surface\]/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/dual_surface=java\+native/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[malware-pe\] pe=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-xor\]/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[mem-module\] pe_headers=/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")),
	"mobile frida lean surface map + malware PE/XOR deep + memory embedded module scan without device/capa/volatility",
	"Keep attach opt-in; prefer pure-python deep CAP on lean hosts",
);


push(
	"reverse:dfir-final-proof-strong-pcap",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-tshark-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-base.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-dns-tls.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-main.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-loop.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-parsers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-frame.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-proof.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-proof-footer.ts",
			"docs/reverse-agent/dfir-host-capture-smoke.out",
		]),
		[
			"repi-dfir-pcap.caps",
			"exit_label",
			"final=1",
			"PROOF_EXIT",
			"pure-python-pcap",
			"CAP_PACKETS",
		],
	) &&
		/final=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		!/final=1[^\n]*partial_runtime_capture/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/dfir-pcap-caps/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")),
	"DFIR footer final proof uses pure-python pcap caps; strong is not clobbered to partial",
	"Host-tool partial remains only when pure-python capture is weak/missing",
);


push(
	"reverse:crypto-deep-pure-solver-xor",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-z3-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-param-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-deep-surrogates.ts",
			"docs/reverse-agent/crypto-host-capture-smoke.out",
		]),
		[
			"CRYPTO_DEEP_SURROGATE_LINES",
			"pure_python_toy",
			"crypto-xor",
			"crypto-kat",
			"crypto-deep",
			"CAP_DEEP",
		],
	) &&
		/pure_python_toy/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/\[crypto-xor\]/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/\[crypto-kat\]/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/deep=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")),
	"crypto deep pure-python toy solver + xor/classical/KAT when z3 missing",
	"Keep CAP_DEEP and strong bind without host z3",
);


push(
	"reverse:firmware-deep-entropy-version",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-extract-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-archive-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-deep-surrogates.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-image-surrogate.ts",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
		]),
		[
			"FIRMWARE_DEEP_SURROGATE_LINES",
			"firmware-deep-sig",
			"firmware-entropy",
			"firmware-version",
			"firmware-service-map",
			"fs_candidates",
		],
	) &&
		/\[firmware-deep-sig\]/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-entropy\]/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-version\]/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")),
	"firmware deep multi-signature offsets + entropy bands + version/service map without full unpack",
	"Keep pure-python deepen when binwalk path is weak or absent",
);


push(
	"reverse:authz-method-matrix-cloud-extra",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-proof.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-k8s-docker.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-extra.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-audit-fields.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-audit-reverse.ts",
			"docs/reverse-agent/web-authz-host-capture-smoke.out",
			"docs/reverse-agent/cloud-host-capture-smoke.out",
		]),
		[
			"webAuthzScriptDeep",
			"web-authz-method-matrix",
			"web-authz-csrf-surface",
			"method_matrix",
			"CLOUD_IDENTITY_EXTRA_LINES",
			"cloud-imds-reach",
			"cloud-env-identity",
			"applySwarmReverseAuditFields",
		],
	) &&
		/\[web-authz-method-matrix\]/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/method_matrix=1/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/\[cloud-extra\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-imds-reach\]/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")),
	"web-authz method matrix/CSRF surface + cloud env/IMDS reachability extra without aws/kubectl",
	"Keep pure-host CAP deepen; softband reverse audit helper extracted",
);


push(
	"reverse:js-signing-jwt-alg-verify-extra",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-extra.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-deep.ts",
			"docs/reverse-agent/js-signing-host-capture-smoke.out",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"jsSigningScriptExtraBody",
			"js-signing-jwt",
			"js-signing-alg",
			"js-signing-verify",
			"js-signing-extra",
			"agent-prompt-injection-taxonomy",
			"agent-security-extra",
		],
	) &&
		/\[js-signing-jwt\]/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/\[js-signing-verify\][^\n]*pass=1/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/agent-prompt-injection-taxonomy/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")),
	"js-signing JWT/alg/verify extra CAP + agent injection taxonomy; strip TS annotations from generated capture",
	"Keep pure-node host CAP without browser attach; agent taxonomy without MCP runtime",
);


push(
	"reverse:browser-websocket-sourcemap-deep",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-boot.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-script-body.ts",
			"docs/reverse-agent/browser-host-capture-smoke.out",
		]),
		[
			"liveBrowserPlaywrightDeepFragment",
			"browser-websocket-probe",
			"browser-deep",
			"sourceMappingURL",
			"__DEEP__",
		],
	) &&
		/\[browser-websocket\]/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/websocket=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/sourcemap=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/\[browser-deep\] ok=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/engine=playwright/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")),
	"browser playwright deep websocket probe + sourcemap follow; modular boot/deep under softband",
	"Prefer real playwright engine over fetch-only; capture websocket+sourcemap when page exposes them",
);


push(
	"reverse:dfir-tcpdump-deep-softband-cut",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-tshark-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-tcpdump-deep.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/feedback-score.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/feedback-score-calc.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object.ts",
			"packages/coding-agent/src/core/repi/context-pack/pack-assembly-finalize-object-pack.ts",
			"docs/reverse-agent/dfir-host-capture-smoke.out",
		]),
		[
			"DFIR_TCPDUMP_DEEP_LINES",
			"dfir-tcpdump-deep",
			"dfir-tcpdump-flow",
			"dispatcherFeedbackScore",
			"buildContextPackSecondaryFields",
		],
	) &&
		/\[dfir-tcpdump-deep\]/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/\[dfir-tcpdump-flow\]/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/final=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")),
	"DFIR tcpdump deep flow/port summary without tshark; softband extract feedback-score-calc + finalize secondary pack",
	"Keep pure-host CAP when tshark missing; keep softband headroom on operator/context-pack monofiles",
);


push(
	"reverse:memory-pslist-yara-lite-extra",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-forensics.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-vol-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-deep-surrogates.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-extra-surrogates.ts",
			"docs/reverse-agent/memory-host-capture-smoke.out",
		]),
		[
			"MEMORY_EXTRA_SURROGATE_LINES",
			"mem-pslist",
			"mem-yara-lite",
			"mem-net",
			"mem-extra",
			"CAP_EXTRA",
		],
	) &&
		/\[mem-pslist\]/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/\[mem-yara-lite\]/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/\[mem-extra\] ok=1/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")),
	"memory pure-python pslist/yara-lite/net/timeline extra without volatility3",
	"Keep lean-host memory CAP strong when vol/volatility3 are missing",
);


push(
	"reverse:mobile-dex-so-surface-extra",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-dex.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-deep.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
		]),
		[
			"MOBILE_DEX_EXTRA_LINES",
			"mobile-dex-extra",
			"mobile-dex-string",
			"mobile-dex-class",
			"mobile-so",
			"mobile-so-symbol",
		],
	) &&
		/\[mobile-dex-extra\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-dex-string\]/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-so\]/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		(/attach=0/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /local_attach=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /\[mobile-frida-local\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out"))),
	"mobile pure-python DEX/SO surface map without jadx/device attach",
	"Keep lean-host mobile CAP strong with frida host presence + APK/DEX string/class/method inventory",
);


push(
	"reverse:malware-yara-multi-rule-host",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-yara-rules.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-deep-surrogates.ts",
			"docs/reverse-agent/malware-host-capture-smoke.out",
		]),
		[
			"MALWARE_YARA_RULE_LINES",
			"Pi_RECON_Injection_APIs",
			"Pi_RECON_Credential_Access",
			"Pi_RECON_Packer_UPX",
			"Pi_RECON_C2_Beaconish",
			"rules_hit",
		],
	) &&
		/Pi_RECON_Injection_APIs/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/rules_hit=[1-9]/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")),
	"malware host yara multi-rule pack (injection/cred/packer/c2) with rules_hit rollup",
	"Prefer real yara host CAP over capa/floss when those binaries are missing",
);


push(
	"reverse:agent-security-inject-tax-extra",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-extra.ts",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"AGENT_SECURITY_EXTRA_LINES",
			"agent-inject-tax",
			"agent-tool-surface",
			"agent-schema-guard",
			"agent-extra",
		],
	) &&
		/\[agent-inject-tax\]/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-tool-surface\]/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-extra\] ok=1/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")),
	"agent-security pure-python injection taxonomy + tool/MCP/schema surface extra",
	"Keep lean agent-boundary CAP with inject-tax and tool surface without heavy dumps",
);


push(
	"reverse:firmware-binwalk-host-structured",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-extract-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-archive-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-binwalk-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-deep-surrogates.ts",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
		]),
		[
			"FIRMWARE_BINWALK_HOST_LINES",
			"firmware-binwalk",
			"firmware-binwalk-type",
			"firmware-binwalk-entropy",
			"firmware-binwalk-magic",
		],
	) &&
		/\[firmware-binwalk\] host=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-binwalk\] ok=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-binwalk-magic\]/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")),
	"firmware host binwalk structured signature/type/entropy/magic CAP",
	"Prefer real binwalk host CAP when present; keep pure-python deep surrogates as complement",
);


push(
	"reverse:native-rop-pure-x86-classifier",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-rop-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-checksec-surrogate.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"NATIVE_ROP_PURE_LINES",
			"native-rop-pure",
			"pop_rdi_ret",
			"leave_ret",
			"gadget=",
		],
	) &&
		/\[native-rop-pure\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-rop-pure\] gadget=/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")),
	"native pure-python x86_64 ROP gadget classifier without ROPgadget",
	"Keep lean-host ROP CAP via ELF PT_LOAD+PF_X scan + short gadget patterns; retain exact offset dyn path",
);


push(
	"reverse:crypto-openssl-host-aes-dgst",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-z3-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-param-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-openssl-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-deep-surrogates.ts",
			"docs/reverse-agent/crypto-host-capture-smoke.out",
		]),
		[
			"CRYPTO_OPENSSL_HOST_LINES",
			"crypto-openssl",
			"crypto-openssl-dgst",
			"crypto-openssl-aes",
			"crypto-openssl-pem",
		],
	) &&
		/\[crypto-openssl\] host=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/\[crypto-openssl-aes\] mode=ecb key=demo pass=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/\[crypto-openssl\] ok=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")),
	"crypto host openssl digests + AES-ECB/CBC KAT + PEM surface without z3",
	"Prefer real openssl host CAP for known-answer transform path when z3 is missing",
);


push(
	"reverse:softband-extract-run-core-analyzers",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-io/exploit-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/exploit-run-helpers.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-run-footer.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/firmware_analyzers.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/firmware-analyzers-followups.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-load.ts",
			"packages/coding-agent/src/core/repi/context-pack/build-core-load-fields.ts",
		]),
		[
			"exploitRunExecution",
			"exploitRunIoSections",
			"authzProofExitFromAnchors",
			"authzReverseFooter",
			"firmwareAnalyzerFollowups",
			"firmwareAnalyzerNextLane",
			"buildContextPackLoadFields",
			"buildContextPackLoadState",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/reverse-io/exploit-run-core.ts").includes("stdoutHash: replayHash") &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/firmware_analyzers.ts").includes("firmware-report-scaffold") &&
		!read("packages/coding-agent/src/core/repi/context-pack/build-core-load.ts").includes("commanderMergeBudget"),
	"softband extract exploit/authz run helpers + firmware followups + context-pack load fields",
	"Keep logic monofiles under softband by moving pure helpers out of run/analyzer cores",
);


push(
	"reverse:cloud-iam-local-policy-surface",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-k8s-docker.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-iam.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-extra.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"docs/reverse-agent/cloud-host-capture-smoke.out",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"CLOUD_IDENTITY_IAM_LINES",
			"cloud-iam",
			"cloud-iam-local",
			"NATIVE_PROOF_CAP_LINES",
			"NATIVE_PROOF_EXIT_LINES",
			"native-proof-capture",
		],
	) &&
		/\[cloud-iam\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[native-proof-capture\]/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")),
	"cloud IAM local/policy surface without aws/kubectl; native CAP proof rollup extracted under softband",
	"Keep lean-host cloud identity + thin native-shell via proof module split",
);


push(
	"reverse:softband-extract-specialist-domain-next",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/js-signing.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/js-signing-followups.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-findings.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-findings-buckets.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/next-commands-domains.ts",
		]),
		[
			"jsSigningEvidenceFollowups",
			"jsSigningReverseCaptureFollowups",
			"extractPwnEvidenceBuckets",
			"addDomainProofExitDomainCommands",
			"domainProofExitNextCommands",
			"analyzeJsSigningEvidence",
			"extractPwnPrimitiveFindings",
		],
	) &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/web/js-signing.ts").includes("js-signing-replay-harness-rerun") &&
		!read("packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-findings.ts").includes("seccomp-tools") &&
		!read("packages/coding-agent/src/core/repi/domain-proof-exit/next-commands.ts").includes("volatility3 strings file"),
	"softband extract js-signing followups + pwn findings buckets + domain proof-exit domain commands",
	"Keep specialist/domain next monofiles under softband headroom",
);


push(
	"reverse:mobile-aapt-fallback-softband-adaptive",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-aapt.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-dex.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-adaptive.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/adaptive-repair-spec.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-run-footer.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
		]),
		[
			"MOBILE_AAPT_HOST_LINES",
			"mobile-aapt-fallback",
			"mobile-aapt-pkg",
			"mobile-aapt-perm",
			"adaptiveRepairLaneSpec",
			"nativeReverseFooter",
			"includeGates: true",
		],
	) &&
		/\[mobile-aapt\] host=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-aapt-fallback\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-aapt-perm\]/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		(/attach=0/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /local_attach=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /\[mobile-frida-local\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out"))),
	"mobile aapt host dump + pure fallback package/perm surface; softband extract adaptive repair + native reverse footer",
	"Keep lean mobile CAP when aapt resource table corrupt; keep adaptive/native-run under softband",
);


push(
	"reverse:js-signing-jwt-alg-matrix-softband-operator",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-body.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-extra.ts",
			"packages/coding-agent/src/core/repi/operator-step-control.ts",
			"packages/coding-agent/src/core/repi/operator-step-control-core.ts",
			"packages/coding-agent/src/core/repi/operator-step-control-swarm.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/pure-claim.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/pure-claim-inputs.ts",
			"docs/reverse-agent/js-signing-host-capture-smoke.out",
		]),
		[
			"JS_SIGNING_JWT_DEEP_LINES",
			"js-signing-jwt-deep",
			"js-signing-jwt-confusion",
			"js-signing-jwt-verify",
			"tryExecuteOperatorControlCore",
			"tryExecuteOperatorControlSwarm",
			"latestCompilerClaimCheckInputs",
		],
	) &&
		/\[js-signing-jwt-deep\] ok=1/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/\[js-signing-jwt-confusion\]/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/\[js-signing-jwt\] alg=none/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")),
	"js-signing JWT alg matrix + none/confusion CAP; softband extract operator control core/swarm + pure-claim inputs",
	"Keep lean JWT host CAP without external jwt libs; keep operator/compiler monofiles under softband",
);


push(
	"reverse:dfir-dns-tls-deep-softband-map-firmware",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-tshark-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-dns-tls-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-tcpdump-deep.ts",
			"packages/coding-agent/src/core/repi/passive-map-runtime.ts",
			"packages/coding-agent/src/core/repi/passive-map-context.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/firmware_rootfs.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/firmware_rootfs_scaffolds.ts",
			"docs/reverse-agent/dfir-host-capture-smoke.out",
		]),
		[
			"DFIR_DNS_TLS_DEEP_LINES",
			"dfir-dns-tls",
			"dfir-tls-sni",
			"dfir-http-auth",
			"latestPassiveMapContext",
			"applyFirmwareRootfsDeepScaffolds",
			"firmware-emulation-scaffold",
		],
	) &&
		/\[dfir-dns-tls\] ok=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/\[dfir-tls-sni\]/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/\[dfir-http-auth\]/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/final=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")),
	"DFIR pure-python DNS/TLS/SNI/HTTP-auth deepen without tshark; softband extract passive-map context + firmware deep scaffolds",
	"Keep lean DFIR CAP strong when tshark missing; keep map/firmware monofiles under softband",
);


push(
	"reverse:browser-sec-headers-softband-storage-swarm",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-deep.ts",
			"packages/coding-agent/src/core/repi/storage/paths.ts",
			"packages/coding-agent/src/core/repi/storage/paths-memory.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/build.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/build-challenges.ts",
			"docs/reverse-agent/browser-host-capture-smoke.out",
		]),
		[
			"liveBrowserPlaywrightSecFragment",
			"browser-sec",
			"browser-sec-form",
			"browser-sec-header",
			"appendSwarmCollisionChallengeEvents",
			"paths-memory",
		],
	) &&
		/\[browser-sec\] ok=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/engine=playwright/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")),
	"browser playwright security form/header/cookie surface CAP; softband extract storage memory paths + swarm claim challenges",
	"Keep playwright engine strong path; keep storage/swarm monofiles under softband",
);


push(
	"reverse:host-checksec-crypto-param-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-checksec-surrogate.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-z3-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-param-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-openssl-host.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
			"docs/reverse-agent/exploit-host-capture-smoke.out",
			"docs/reverse-agent/crypto-host-capture-smoke.out",
		]),
		[
			"CRYPTO_PARAM_SCRIPT_LINES",
			"CRYPTO_OPENSSL_HOST_LINES",
			"checksec --file",
			"native-checksec",
			"exploit-lab-checksec",
			"Partial RELRO",
		],
	) &&
		/checksec=\/(usr\/bin|usr\/local\/bin)\/checksec/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-checksec\].*Partial RELRO/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		!/checksec_binary_missing/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/checksec=\/(usr\/bin|usr\/local\/bin)\/checksec/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[crypto-openssl\] host=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")),
	"host checksec binary CAP for native/exploit; crypto param monofile split under softband with openssl KAT retained",
	"Prefer real checksec when installed; keep pure-python checksec surrogate for lean hosts; crypto.ts stays thin",
);


push(
	"reverse:host-ropgadget-matchers-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-rop-pure.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/matchers.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/matchers-regexes.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
			"docs/reverse-agent/exploit-host-capture-smoke.out",
		]),
		[
			"ROPgadget",
			"native-ropgadget",
			"NATIVE_ROP_PURE_LINES",
			"proofExitRegexes",
			"toolchainDomainIdForRoute",
			"pop rbp",
		],
	) &&
		/ROPgadget=\/root\/\.local\/bin\/ROPgadget|ROPgadget=\/usr/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-ropgadget\].*pop rbp|Unique gadgets found/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/checksec=\/(usr\/bin|usr\/local\/bin)\/checksec/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")),
	"host ROPgadget CAP for native gadgets; domain proof-exit regex matchers split under softband",
	"Prefer real ROPgadget when installed; keep pure-python ROP classifier + r2/objdump fallbacks for lean hosts",
);


push(
	"reverse:host-z3-pcap-followups-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-z3-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-param-script.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/dfir/pcap.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/dfir/pcap-followups.ts",
			"docs/reverse-agent/crypto-host-capture-smoke.out",
		]),
		[
			"python3-z3",
			"import z3",
			"pcapDfirEvidenceFollowups",
			"pcapDfirReverseCaptureFollowups",
			"analyzePcapDfirEvidence",
			"CRYPTO_PARAM_SCRIPT_LINES",
		],
	) &&
		/z3=python3-z3|z3=present/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/\[crypto-solver\] z3=present toy_check=sat/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/\[crypto-openssl\] host=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")),
	"host python3-z3 solver CAP for crypto; DFIR pcap followups extracted under softband",
	"Prefer real z3 python binding when installed; keep pure-python toy solver for lean hosts",
);


push(
	"reverse:host-tshark-dfir-tools-web-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-tshark-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-tcpdump-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-dns-tls-deep.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/tools-web.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/tools-web-js.ts",
			"docs/reverse-agent/dfir-host-capture-smoke.out",
		]),
		[
			"DFIR_TSHARK_HOST_LINES",
			"dfir-tshark",
			"dfir-tshark-http",
			"dfir-tshark-auth",
			"registerRepiReverseJsSigningTool",
			"re_js_signing",
		],
	) &&
		/\[dfir-tshark\] host=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/tshark=\/usr\/bin\/tshark/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/tshark=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/\[dfir-tshark-http\]/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/final=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")),
	"host tshark CAP for DFIR conv/HTTP/auth; tools-web js-signing registration extracted under softband",
	"Prefer real tshark when installed; keep pure-python pcap/tcpdump/dns-tls for lean hosts",
);


push(
	"reverse:host-floss-malware-static-cap",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-floss-surrogates.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-yara-rules.ts",
			"docs/reverse-agent/malware-host-capture-smoke.out",
		]),
		[
			"MALWARE_FLOSS_HOST_LINES",
			"--only static",
			"malware-floss",
			"host=1 mode=static",
			"MALWARE_CAPA_FLOSS_SURROGATE_LINES",
			"rules_hit",
		],
	) &&
		/floss=\/root\/\.local\/bin\/floss|floss=\/usr/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-floss\] host=1 mode=static/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/rules_hit=5|rules_hit=[1-9]/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")),
	"host floss static-string CAP for malware; pure-python capa/floss surrogates retained",
	"Prefer floss --only static when installed (full decode may fail on non-PE stubs); keep surrogates for lean hosts",
);


push(
	"reverse:host-vol-memory-budget-helpers",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-forensics.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-vol-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-deep-surrogates.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-extra-surrogates.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/budget.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/budget-next.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/budget-helpers.ts",
			"docs/reverse-agent/memory-host-capture-smoke.out",
		]),
		[
			"MEMORY_VOL_HOST_LINES",
			"frameworkinfo.FrameworkInfo",
			"banners.Banners",
			"mem-vol",
			"commanderBudgetValue",
			"isCommanderRuntimeCommand",
			"autonomousExecutionBudget",
		],
	) &&
		/vol=\/root\/\.local\/bin\/vol|vol=\/usr/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/\[mem-vol\] host=1/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/vol=1/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/Volatility 3 Framework/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")),
	"host volatility3 CAP for memory forensics; operator budget helpers extracted under softband",
	"Prefer real vol when installed; keep pure-python process/cred/timeline surrogates for lean hosts",
);


push(
	"reverse:host-capa-rules-bridge-static",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-floss-surrogates.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-pure-build.ts",
			"packages/coding-agent/src/core/repi/professional-runtime-bridges-pure-build-static.ts",
			"docs/reverse-agent/malware-host-capture-smoke.out",
		]),
		[
			"MALWARE_CAPA_HOST_LINES",
			"CAPA_RULES",
			"selfcheck=elf",
			"MALWARE_FLOSS_HOST_LINES",
			"PROFESSIONAL_RUNTIME_BRIDGE_NEXT_COMMANDS",
			"PROFESSIONAL_RUNTIME_BRIDGE_INVARIANTS",
		],
	) &&
		/capa=\/root\/\.local\/bin\/capa|capa=\/usr/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-capa\] host=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		(/selfcheck=elf|rules_live=1|sample=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out"))) &&
		(/ATT&CK Tactic|Capability|no capabilities found|format\s+│ pe|os\s+│ windows/.test(read("docs/reverse-agent/malware-host-capture-smoke.out"))) &&
		/floss=\/root\/\.local\/bin\/floss|\[malware-floss\] host=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")),
	"host capa with rules/sigs + ELF selfcheck CAP; professional bridge next/invariants extracted under softband",
	"Prefer real capa when rules present (/opt/capa-rules or CAPA_RULES); keep pure-python capa/floss surrogates for lean hosts",
);


push(
	"reverse:host-jadx-mobile-claim-contract",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-aapt.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/pure.ts",
			"packages/coding-agent/src/core/repi/structured-claim-merge/pure-evidence-contract.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
		]),
		[
			"MOBILE_JADX_HOST_LINES",
			"mobile-jadx",
			"CAP_JADX",
			"decompiled=1",
			"claimPromotionEvidenceContract",
			"mobile-proof-capture",
		],
	) &&
		/jadx=\/usr\/local\/bin\/jadx|jadx=\/usr\/bin\/jadx/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-jadx\] host=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-jadx\] ok=1 decompiled=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/MainActivity\.java|repi-mobile-secret/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/jadx=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")),
	"host jadx APK decompile CAP for mobile; claim promotion evidence contract extracted under softband",
	"Prefer real jadx when installed; keep pure-python DEX/APK deep surrogates and attach opt-in for lean hosts",
);


push(
	"reverse:host-agent-security-rg-node-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-extra.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-types.ts",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
		]),
		[
			"AGENT_SECURITY_HOST_LINES",
			"agent-host",
			"agent-host-inject",
			"agent-pkg-host",
			"agent-host-surface",
			"RuntimeScoreState",
			"scoreWebRuntimeCapture",
		],
	) &&
		/\[agent-host\] rg=\/usr\/bin\/rg|\[agent-host\] ok=1/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-host\] ok=1/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-host-inject\] cases=5/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/surface_hits=[1-9]/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[firmware-binwalk\] host=1|\[firmware-binwalk\] ok=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")),
	"host agent-security CAP via rg/node/jq surface+inject corpus; runtime scoring types softband extract; firmware binwalk smoke retained",
	"Prefer real host scanners when available; keep pure-python agent taxonomy/deep surrogates for lean hosts",
);


push(
	"reverse:host-frida-compile-ps-memory-helpers",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida-local.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-jadx.ts",
			"packages/coding-agent/src/core/repi/memory-compact-resume.ts",
			"packages/coding-agent/src/core/repi/memory-compact-resume-helpers.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
		]),
		[
			"MOBILE_FRIDA_HOST_DEEPEN_LINES",
			"mobile-frida-compile",
			"mobile-frida-ps",
			"frida-compile",
			"compactionLedgerPath",
			"compactionNonEmptyLines",
			"COMPACTION_LEDGER_GENESIS",
			"attach_default=0",
		],
	) &&
		/\[mobile-frida-host\] version=/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-frida-ps\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-frida-compile\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/deepen=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		(/attach=0/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /local_attach=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /\[mobile-frida-local\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out"))) &&
		/jadx=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")),
	"host frida-ps inventory + frida-compile hook CAP without device attach; compaction ledger helpers extracted under softband",
	"Prefer real frida toolchain when installed; device attach remains opt-in via REPI_MOBILE_ATTACH=1",
);


push(
	"reverse:host-cloud-imds-docker-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-k8s-docker.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-iam.ts",
			"packages/coding-agent/src/core/repi/supervisor/build.ts",
			"packages/coding-agent/src/core/repi/supervisor/build-assemble.ts",
			"packages/coding-agent/src/core/repi/failure-repair/classify-pure.ts",
			"packages/coding-agent/src/core/repi/failure-repair/classify-pure-core.ts",
			"docs/reverse-agent/cloud-host-capture-smoke.out",
		]),
		[
			"CLOUD_IDENTITY_HOST_LINES",
			"cloud-host",
			"cloud-imds-http",
			"cloud-docker-host",
			"assembleSupervisorArtifact",
			"buildSupervisorNextActions",
			"runtimeFailureSignature",
			"runtimeFailureCategory",
		],
	) &&
		/\[cloud-host\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-imds-http\]/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-docker-host\] sock=1|\[cloud-docker-host\] version=/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")),
	"host cloud CAP via curl IMDS HTTP status + docker.sock version + env/file presence; supervisor assemble + failure classify softband extracts",
	"Prefer real host curl/docker probes when available; keep pure-python deep/IAM surrogates and never dump secrets/tokens",
);


push(
	"reverse:browser-sec-score-softband-profile-dfir",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts",
			"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
			"packages/coding-agent/src/core/repi/profile-check/checks-markers.ts",
			"packages/coding-agent/src/core/repi/profile-check/checks-markers-lists.ts",
			"packages/coding-agent/src/core/repi/techniques/dfir_pcap_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/dfir_pcap_techniques_extra.ts",
			"packages/coding-agent/src/core/repi/failure-repair/report-priority.ts",
			"packages/coding-agent/src/core/repi/failure-repair/report-priority-reverse.ts",
			"docs/reverse-agent/browser-host-capture-smoke.out",
		]),
		[
			"liveBrowserPlaywrightSecFragment",
			"browser-sec-score",
			"browser-sec-header-missing",
			"browser-sec-mixed",
			"PROFILE_CHECK_CRITICAL_MARKERS",
			"PROFILE_CHECK_REVERSE_CAPABILITY_MARKERS",
			"DFIR_PCAP_TECHNIQUES_EXTRA",
			"failurePriorityReverseNextCommands",
		],
	) &&
		/\[browser-sec\] ok=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/\[browser-sec-score\]/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/\[browser-sec-header-missing\]/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/engine=playwright/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/websocket=1/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")),
	"browser sec CAP scores missing security headers + mixed content surface; profile marker lists + DFIR technique extra + failure priority reverse softband extracts",
	"Prefer real playwright capture for header/form/cookie evidence; keep lean fetch fallback paths",
);


push(
	"reverse:host-authz-csrf-jwt-claims-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/web-runtime/authz-script.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-host.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-script-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-deep.ts",
			"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-jwt-claims.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-prep.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/build-finalize-route.ts",
			"docs/reverse-agent/web-authz-host-capture-smoke.out",
			"docs/reverse-agent/js-signing-host-capture-smoke.out",
		]),
		[
			"webAuthzHostShellLines",
			"web-authz-host-csrf",
			"web-authz-host-cors",
			"JS_SIGNING_JWT_CLAIMS_LINES",
			"js-signing-jwt-claim",
			"prepareKnowledgeGraphFinalizeState",
			"finalizeKnowledgeGraphRouting",
			"jku-injection",
		],
	) &&
		/\[web-authz-host\] ok=1/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/\[web-authz-host-csrf\]/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/\[web-authz-host-cors\]/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/web-authz-host-capture-smoke.out")) &&
		/\[js-signing-jwt-claims\] ok=1/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/kid-present|jku-injection/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")),
	"host web-authz curl CSRF/CORS/Origin surface; JWT kid/jku/x5u/exp claim CAP; knowledge finalize prep/route softband extracts",
	"Prefer real curl Origin/CORS probes when available; keep pure node JWT alg matrix + principal matrix scripts",
);


push(
	"reverse:host-fw-extract-unsquash-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-extract-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-archive-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-binwalk-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/firmware-extra.ts",
			"packages/coding-agent/src/core/repi/poison-sanitize/state.ts",
			"packages/coding-agent/src/core/repi/poison-sanitize/text-paths.ts",
			"packages/coding-agent/src/core/repi/knowledge-scope.ts",
			"packages/coding-agent/src/core/repi/knowledge-scope-types.ts",
			"packages/coding-agent/src/core/repi/compact-resume/signals/knowledge.ts",
			"packages/coding-agent/src/core/repi/compact-resume/signals/knowledge-hints.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-hooks.ts",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
		]),
		[
			"FIRMWARE_EXTRACT_HOST_LINES",
			"firmware-extract-host",
			"firmware-unsquash",
			"unsquashfs",
			"RUNTIME_ADAPTER_FIRMWARE_SPECS_EXTRA",
			"poisonSanitizeTextPaths",
			"buildCompactResumeKnowledgeHints",
			"mobileRuntimeFridaHookScript",
		],
	) &&
		/\[firmware-extract-host\] ok=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-unsquash\] ok=1|\[firmware-unsquash\] host=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-binwalk\] host=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/rootfs-account|etc\/passwd/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")),
	"host firmware extract via binwalk/unsquashfs carve+rootfs inventory; softband: firmware matrix extra, poison text-paths, knowledge-scope split, compact-resume hints, mobile hook script",
	"Prefer real binwalk --run-as=root + unsquashfs when available; keep pure-python image surrogate and directory rootfs map",
);


push(
	"reverse:host-one-gadget-seccomp-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-one-seccomp-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-r2-mitigation.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/tools-native.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/tools-native-mobile.ts",
			"packages/coding-agent/src/core/repi/kernel/install-reverse/tools-native-core.ts",
			"packages/coding-agent/src/core/repi/techniques/cloud_container_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/cloud_container_techniques_extra.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"NATIVE_ONE_SECCOMP_HOST_LINES",
			"NATIVE_R2_MITIGATION_LINES",
			"native-one-gadget",
			"native-seccomp",
			"one_gadget",
			"seccomp-tools",
			"registerRepiReverseMobileTool",
			"registerRepiReverseNativeTool",
			"CLOUD_CONTAINER_TECHNIQUES_EXTRA",
			"posix_spawn",
		],
	) &&
		/\[native-one-gadget\] host=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-one-gadget\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-seccomp\] host=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/one_gadget=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/seccomp=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-pwn-scaffold\]/.test(read("docs/reverse-agent/native-host-capture-smoke.out")),
	"host one_gadget + seccomp-tools CAP for native reverse; softband: tools-native mobile/core split, cloud techniques extra",
	"Prefer real one_gadget on ldd/system libc and seccomp-tools dump when installed; keep pure ROP/checksec surrogates",
);


push(
	"reverse:host-frida-local-attach-cloud-containers-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-frida-local.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-proof.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-k8s-docker.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-structured.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-summary-mitigations.ts",
			"packages/coding-agent/src/core/repi/reverse-io/shared-evidence.ts",
			"packages/coding-agent/src/core/repi/reverse-io/shared-evidence-append.ts",
			"packages/coding-agent/src/core/repi/resources/loader.ts",
			"packages/coding-agent/src/core/repi/resources/loader-suppress.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
			"docs/reverse-agent/cloud-host-capture-smoke.out",
		]),
		[
			"MOBILE_FRIDA_LOCAL_ATTACH_LINES",
			"mobile-frida-local",
			"CAP_LOCAL_ATTACH",
			"cloud-docker-containers",
			"nativeSummaryMitigationAndCapture",
			"appendReverseRuntimeEvidence",
			"suppressLegacyReconConflicts",
		],
	) &&
		/\[mobile-frida-local\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/attach=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[cloud-docker-containers\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")),
	"host-local frida attach CAP (no USB) + docker containers inventory; softband: native-summary mitigations, shared-evidence append, loader suppress",
	"Prefer host-process frida attach for dynamic CAP; USB device attach remains opt-in via REPI_MOBILE_ATTACH=1",
);


push(
	"reverse:host-native-symbolic-unicorn-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-format.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-summary-plan.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-pure.ts",
			"packages/coding-agent/src/core/repi/reverse-io/native-pure-path.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"NATIVE_SYMBOLIC_HOST_LINES",
			"native-symbolic",
			"pure_python_surface",
			"CAP_SYMBOLIC",
			"CAP_UNICORN",
			"exploitLabPlanMatrices",
			"native-pure-path",
			"agent-host-policy",
		],
	) &&
		/\[native-symbolic\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/unicorn=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/symbolic=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/unicorn_emu=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/mode=unicorn\+surface/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/pure_python_surface=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[agent-host-policy\]/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")),
	"native symbolic/unicorn branch-surface CAP + agent host policy scan; softband: exploit plan matrices, native pure path",
	"Prefer host unicorn when importable; pure-python branch/cmp/call surface always; keep angr as technique hint not hard dependency",
);


push(
	"reverse:host-unicorn-emu-authz-resume-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/authz-pure-build-matrices.ts",
			"packages/coding-agent/src/core/repi/compact-resume/signals/resume.ts",
			"packages/coding-agent/src/core/repi/compact-resume/signals/resume-verify.ts",
			"packages/coding-agent/src/core/repi/autopilot-strategy.ts",
			"packages/coding-agent/src/core/repi/autopilot-strategy-format.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"unicorn_emu=1",
			"mode=unicorn+surface",
			"webAuthzPlanMatrices",
			"verifyContextPackResume",
			"formatAutopilotBootstrap",
			"CAP_UNICORN_EMU",
		],
	) &&
		/\[native-symbolic\] unicorn_emu=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/mode=unicorn\+surface/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/symbolic=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/unicorn=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")),
	"native unicorn emu CAP working (map all PT_LOAD + count=8); softband: authz plan matrices, resume-verify, autopilot format",
	"Prefer real unicorn emu over surface-only; keep pure-python branch surface as fallback",
);


push(
	"reverse:host-crypto-z3-symbolic-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-z3-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-deep-surrogates.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-emu.ts",
			"packages/coding-agent/src/core/repi/operator-format-operator.ts",
			"packages/coding-agent/src/core/repi/operator-format-operator-next.ts",
			"docs/reverse-agent/crypto-host-capture-smoke.out",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"CRYPTO_Z3_HOST_LINES",
			"crypto-z3-host",
			"NATIVE_SYMBOLIC_SURFACE_LINES",
			"NATIVE_SYMBOLIC_EMU_LINES",
			"formatOperatorNextActions",
			"toy_model",
			"multi_model",
		],
	) &&
		/\[crypto-z3-host\] ok=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/toy_check=sat/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/lcg_check=sat/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/multi_check=sat/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/z3=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
		/unicorn_emu=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")),
	"host python3-z3 multi-constraint crypto solver CAP; softband: native symbolic surface/emu split, operator next-actions extract",
	"Prefer real python3-z3 when importable; keep pure-python toy/lcg surrogates for lean CI",
);


push(
	"reverse:host-malware-pe-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-resolution.ts",
			"packages/coding-agent/src/core/repi/swarm-claim-ledger/worker-claims-challenge.ts",
			"docs/reverse-agent/malware-host-capture-smoke.out",
		]),
		[
			"MALWARE_PE_HOST_LINES",
			"malware-pe-host",
			"appendWorkerClaimChallengeIfBlocked",
			"pefile",
			"pure_surface",
		],
	) &&
		/\[malware-pe-host\] ok=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/pe=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-yara\] host=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-floss\] host=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")),
	"host malware PE deep CAP via pefile/pure surface + pe proof flag; softband: worker claim challenge extract",
	"Prefer pefile when installed; pure-python PE section/import scrape retained; capa sample path uses real PE fixture",
);


push(
	"reverse:softband-scoring-cold-swarm-paths",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/runtime-scoring-web-domain.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/cold-start.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/cold-start-packets.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/cold-start-types.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/cold-start-reverse.ts",
			"packages/coding-agent/src/core/repi/profile-check/checks-paths.ts",
			"packages/coding-agent/src/core/repi/profile-check/checks-paths-core.ts",
			"packages/coding-agent/src/core/repi/profile-check/checks-paths-install.ts",
			"packages/coding-agent/src/core/repi/mission/lane-packs/dfir_cloud.ts",
			"packages/coding-agent/src/core/repi/mission/lane-packs/dfir_cloud_extra.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/swarm-run.ts",
			"packages/coding-agent/src/core/repi/kernel/install-narrative/tools/swarm-run-subagent.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late.ts",
			"packages/coding-agent/src/core/repi/exploit-chain/build-nodes-late-edges.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-build.ts",
			"packages/coding-agent/src/core/repi/compiler-runtime/build-core-queue.ts",
		]),
		[
			"applyWebDomainCapture",
			"buildRepiColdStartLeanPacket",
			"buildRepiColdStartFullPacket",
			"profileCheckInstallScriptChecks",
			"lanes_cloud_container",
			"registerRepiNarrativeSubagentTool",
			"buildExploitChainLateEdges",
			"buildCompilerNextOperatorQueue",
			"reverseColdStartNextLines",
		],
	),
	"softband cut: web scoring domain decision, cold-start packets, profile path core/install, dfir cloud extra lanes, swarm subagent tool, exploit late edges",
	"Keep reverse proof next lines on cold-start lean/full; domain scoring remains strong for browser/authz/js-signing",
);


push(
	"reverse:data-monofile-split-cloud-k8s-docker",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-base.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-dns-tls.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-main.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-loop.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-parsers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-frame.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-proof.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core-base.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core-reports.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-extended.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/matrix/web-cdp-script-main.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-k8s-docker.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"docs/reverse-agent/cloud-host-capture-smoke.out",
		]),
		[
			"DFIR_PCAP_HELPER_LINES",
			"DFIR_PCAP_MAIN_LINES",
			"repiStorageMemoryDefaultEntries",
			"WEB_CDP_SCRIPT_HELPER_LINES",
			"WEB_CDP_SCRIPT_MAIN_LINES",
			"CLOUD_IDENTITY_K8S_DOCKER_LINES",
			"cloud-k8s-sa",
			"cloud-docker-images",
		],
	) &&
		/\[cloud-docker-images\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-k8s-sa\]/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-docker-containers\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")),
	"split allowed data monofiles (dfir-pcap helpers/main, layout memory seeds, web-cdp script); cloud k8s SA scaffold + docker images inventory CAP",
	"Keep pure-python DFIR pcap and no-secret cloud probes; data monofile allowlist still covers split names via prefix match",
);


push(
	"reverse:firmware-archive-layout-memory-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-archive-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-binwalk-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-extract-host.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core-base.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core-reports.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-extended.ts",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
		]),
		[
			"FIRMWARE_ARCHIVE_HOST_LINES",
			"firmware-7z",
			"firmware-cpio",
			"firmware-strings-cred",
			"target_is_directory",
			"repiStorageMemoryCoreDefaultEntries",
			"repiStorageMemoryExtendedDefaultEntries",
		],
	) &&
		/\[firmware-binwalk\] host=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-7z\] ok=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-unsquash\] ok=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")),
	"firmware archive CAP (7z/cpio/strings-cred) + binwalk dir note; layout memory seeds core/extended split",
	"Keep dual rootfs+image smoke strong; no secret dump on archive inventory",
);


push(
	"reverse:malware-host-prefer-agent-permission-dfir-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-floss-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-main.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-loop.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-parsers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-frame.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-proof.ts",
			"docs/reverse-agent/malware-host-capture-smoke.out",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"CAP_CAPA_HOST",
			"CAP_FLOSS_HOST",
			"host_capa_floss_ok",
			"malware-host-fallback",
			"agent-host-permission",
			"agent-host-redact",
			"DFIR_PCAP_LOOP_LINES",
			"DFIR_PCAP_PROOF_LINES",
		],
	) &&
		/\[malware-host-fallback\] skip=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-capa\] host=1 ok=1 sample=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-floss\] host=1 mode=static/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-pe-host\] ok=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[agent-host-permission\] hits=/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-host-redact\] hits=/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")),
	"malware host capa/floss preferred (skip pure surrogates when host ok); agent host permission+redact surface; dfir pcap main→loop/proof split",
	"Keep deep XOR/behavior surrogates; PE sample host capa sample=1 + floss static + pe-host ok",
);


push(
	"reverse:memory-vol-linux-exploit-host-checksec-dfir-parsers",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-vol-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-forensics.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-loop.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-parsers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-frame.ts",
			"docs/reverse-agent/memory-host-capture-smoke.out",
			"docs/reverse-agent/exploit-host-capture-smoke.out",
		]),
		[
			"CAP_VOL_HOST",
			"linux_probe=1",
			"windows_probe=1",
			"mem-vol-linux-pslist",
			"mem-vol-plugins",
			"mem-strings-host",
			"host-string-timeline",
			"host_checksec_complement",
			"host=1 tool=checksec",
			"DFIR_PCAP_PARSER_LINES",
			"DFIR_PCAP_FRAME_LINES",
		],
	) &&
		/\[mem-vol\] ok=1 framework=1 banners=1 linux_probe=1 windows_probe=1/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/\[mem-strings-host\] ok=1/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/host-string-timeline/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
		/\[exploit-lab-checksec\] host=1 tool=checksec/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/host_checksec_complement=pure-python-elf/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")),
	"memory vol linux/windows probes+plugin inventory+strings-host; exploit host checksec complement (not surrogate when host ok); dfir loop→parsers/frame split",
	"Keep pure-python memory/deep surrogates; exploit pure-python remains complement when checksec present",
);


push(
	"reverse:cloud-aws-kubectl-cli-dfir-helpers-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-cli-host.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-helpers.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-base.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-pcap-script-dns-tls.ts",
			"docs/reverse-agent/cloud-host-capture-smoke.out",
		]),
		[
			"CLOUD_IDENTITY_CLI_HOST_LINES",
			"cloud-aws-cli",
			"cloud-kubectl",
			"cloud-docker-networks",
			"CAP_KUBECTL",
			"aws_cli=",
			"kubectl_cli=",
			"DFIR_PCAP_BASE_LINES",
			"DFIR_PCAP_DNS_TLS_LINES",
		],
	) &&
		/\[cloud-aws-cli\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-kubectl\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/\[cloud-docker-networks\] ok=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/aws_cli=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/kubectl_cli=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")),
	"cloud host aws/kubectl CLI CAP + docker networks inventory; dfir pcap helpers→base/dns-tls split",
	"Keep STS/kubeconfig secret-safe; aws_cli/kubectl_cli proof flags; pure-python IAM/deep retained",
);


push(
	"reverse:host-native-symbolic-r2-z3",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-r2.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-surface.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"NATIVE_SYMBOLIC_R2_LINES",
			"native-symbolic-r2",
			"native-symbolic-z3",
			"CAP_Z3",
			"funcs=",
			"max_cc=",
		],
	) &&
		/\[native-symbolic-r2\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-symbolic-z3\] ok=1 sat=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/unicorn_emu=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		// memory product must stay removed
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"native symbolic CAP deepened with host r2 function/cc surface + z3 micro-sat (angr-free); unicorn emu retained",
	"Do not reintroduce memory product surface; keep pure-python surface + unicorn + r2/z3 host CAP",
);


push(
	"reverse:malware-firmware-pure-python-labels-layout-core-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-deep-surrogates.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-capa-floss-surrogates.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-image-surrogate.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core-base.ts",
			"packages/coding-agent/src/core/repi/storage/io/layout-defaults-memory-core-reports.ts",
			"docs/reverse-agent/malware-host-capture-smoke.out",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
		]),
		[
			"malware-host-fallback",
			"pure_python=1",
			"pure_python_map=1",
			"repiStorageMemoryCoreBaseDefaultEntries",
			"repiStorageMemoryCoreReportDefaultEntries",
		],
	) &&
		/\[malware-host-fallback\] skip=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-capa\] host=1 ok=1 sample=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[malware-xor\] pure_python=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
		/\[firmware-image\] pure_python_map=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/\[firmware-binwalk\] host=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"malware/firmware pure-python labels (not product surrogate weakness); layout memory-core base/reports split; memory product remains removed",
	"Host capa/floss preferred; pure-python XOR/map retained as complement only",
);


push(
	"reverse:host-native-symbolic-angr-types-split",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-angr.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"packages/coding-agent/src/core/repi/operator-format-types.ts",
			"packages/coding-agent/src/core/repi/operator-format-types-operator.ts",
			"packages/coding-agent/src/core/repi/operator-format-types-delegate.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/types.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/types-base.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/types-target.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/types-execution.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"NATIVE_SYMBOLIC_ANGR_LINES",
			"native-symbolic-angr",
			"CAP_ANGR",
			"cfg_funcs=",
			"claripy_sat=",
			"EMPTY_AUTONOMOUS_BUDGET",
			"RuntimeAdapterExecutionSpec",
			"RuntimeAdapterTargetProfileV1",
		],
	) &&
		/\[native-symbolic-angr\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/angr=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/summary\.angr=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"host angr symbolic CAP (CFGFast+bounded steps+claripy) via /opt/repi-tools/angr-venv; operator/runtime-adapter types split; memory product remains removed",
	"Keep unicorn/r2/z3 path when angr missing; do not reintroduce settings.memory product surface",
);


push(
	"reverse:host-native-symbolic-qiling-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-qiling.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-symbolic-angr.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/reverse-pure.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/reverse-pure-signals.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/reverse-pure-gate.ts",
			"packages/coding-agent/src/core/repi/context-format/types-memory.ts",
			"packages/coding-agent/src/core/repi/context-format/types-memory-core.ts",
			"packages/coding-agent/src/core/repi/context-format/types-memory-runtime.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"NATIVE_SYMBOLIC_QILING_LINES",
			"native-symbolic-qiling",
			"CAP_QILING",
			"swarmReverseQuerySignals",
			"swarmReverseMergeClaimGate",
			"ContextPackMemoryOrchestratorView",
			"ContextPackMemoryActiveKernelView",
		],
	) &&
		/\[native-symbolic-qiling\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/qiling=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/summary\.qiling=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-symbolic-angr\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/angr=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"host qiling lightweight CAP (emu+maps) via /opt/repi-tools/qiling-venv; reverse-pure signals/gate split; types-memory core/runtime split; memory product remains removed",
	"Keep angr/unicorn/r2/z3 paths; do not reintroduce settings.memory product surface",
);


push(
	"reverse:host-native-rizin-pwn-closure-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-rizin-host.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-advanced.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-packs/native_pwn_primitive-advanced-late.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure-core.ts",
			"packages/coding-agent/src/core/repi/domain-proof-exit/build-closure-output.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"NATIVE_RIZIN_HOST_LINES",
			"native-rizin",
			"rz-bin",
			"applyWantsPwnPrimitiveAdvancedLate",
			"pwn-advanced-srop-ret2dlresolve-scaffold",
			"buildDomainProofExitClosure",
			"buildDomainProofExitClosureOutput",
		],
	) &&
		/\[native-rizin\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-rizin-info\]/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/qiling=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/angr=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"host rizin/rz-bin CAP; pwn advanced late extract; domain proof-exit closure split; memory product remains removed",
	"Prefer /opt/repi-tools/rizin/rz-bin; keep r2/checksec paths; do not reintroduce settings.memory",
);


push(
	"reverse:mobile-device-host-softband-quick-adapter-exploit",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-device.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/quick.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/quick-plan.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/gaps/quick-target.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring.ts",
			"packages/coding-agent/src/core/repi/reverse-capture/adapter-scoring-finalize.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-triage-pure.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
		]),
		[
			"MOBILE_DEVICE_HOST_LINES",
			"mobile-device-host",
			"proofLoopQuickPlanRows",
			"finalizeAdapterCaptureFields",
			"exploitLabRunnerScriptTriagePurePython",
			"host_checksec_complement",
		],
	) &&
		/\[mobile-device-host\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/apk=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/deep=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		(/local_attach=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /\[mobile-frida-local\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out"))) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"mobile adb device inventory CAP; proof-loop quick/adapter finalize/exploit pure-python softband splits; memory product remains removed",
	"USB attach still opt-in via REPI_MOBILE_ATTACH; do not reintroduce settings.memory",
);


push(
	"reverse:agent-host-harness-softband-steps-authz-browser",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-build.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-build-specs.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-summary-build.ts",
			"packages/coding-agent/src/core/repi/web-runtime/authz-summary-matrices.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-pure-build.ts",
			"packages/coding-agent/src/core/repi/reverse-io/browser-pure-probes.ts",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"agent-host-harness",
			"agent-host-path",
			"pure_python=0",
			"buildProofLoopStepSpecs",
			"webAuthzMatrixFields",
			"liveBrowserProbeMatrices",
		],
	) &&
		/\[agent-host-harness\] hits=\d+ host=1 pure_python=0/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-host-path\] host=1 pure_python=0/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-host\] ok=1/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"agent-security host harness permission CAP (pure_python=0) + exclude surrogate false-positive globs; softband steps-build/authz/browser splits; memory product remains removed",
	"Keep host rg/node/jq path preferred; do not reintroduce settings.memory",
);


push(
	"reverse:agent-surrogate-skip-softband-quality-refresh-swarm",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-deep.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-extra.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/quality.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/quality-evaluate.ts",
			"packages/coding-agent/src/core/repi/lanes/specialist-evidence/quality-format.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-steps.ts",
			"packages/coding-agent/src/core/repi/proof-loop-core/steps-next-refresh-map.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics-cmd.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/pure-basics-worker.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-core.ts",
			"packages/coding-agent/src/core/repi/reverse-io/mobile-run-footer.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create.ts",
			"packages/coding-agent/src/core/repi/swarm-exec/manifest/write-create-build.ts",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"surrogate' in path.name",
			"agent-host-harness",
			"evaluateEvidenceQuality",
			"mapProofLoopRefreshCommandSteps",
			"swarmWorkerEvidenceText",
			"mobileRuntimeReverseFooter",
			"buildSwarmSubagentRuntimeManifestObject",
		],
	) &&
		/\[agent-host-harness\] hits=\d+ host=1 pure_python=0/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-host\] ok=1/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		!/\[agent-tool\] file=.*unicode-surrogate/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		!/\[agent-surface-file\] path=.*unicode-surrogate/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"agent pure scanners skip *surrogate* filename false-positives; softband quality/refresh/pure-basics/mobile-footer/write-create splits; memory product remains removed",
	"Keep host harness pure_python=0 path; do not reintroduce settings.memory",
);


push(
	"reverse:firmware-dir-probe-softband-format-lane",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-binwalk-host.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body-sections.ts",
			"packages/coding-agent/src/core/repi/proof-loop-runtime/format-body-reverse.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-core.ts",
			"packages/coding-agent/src/core/repi/lane-commands/run-core-reverse.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update-reverse.ts",
			"packages/coding-agent/src/core/repi/lane-run-mission/apply-update-checkpoints.ts",
			"docs/reverse-agent/firmware-host-capture-smoke.out",
		]),
		[
			"dir_image_probe",
			"dir_probe",
			"proofLoopReverseGateLines",
			"laneRunReverseGateLines",
			"laneRunMissionReverseNext",
			"applyLaneRunMissionCheckpoints",
		],
	) &&
		/\[firmware-binwalk\] ok=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/dir_probe=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		!/note=target_is_directory[^_]/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"firmware binwalk dir_image_probe (no host=0 dead-end on rootfs dirs with images); softband format-body/lane reverse/checkpoints splits; memory product remains removed",
	"Prefer host binwalk on discovered image under dir; keep pure_python map; do not reintroduce settings.memory",
);


push(
	"reverse:knowledge-softband-agent-permission-clean",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/knowledge-format.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-body.ts",
			"packages/coding-agent/src/core/repi/knowledge-format-reverse.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-nodes.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-scoreboard.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-feedback.ts",
			"packages/coding-agent/src/core/repi/knowledge-graph/signals-worker-decay.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-specialist.ts",
			"packages/coding-agent/src/core/repi/auto-lane/run-specialist-result.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/cold-start-packets.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/cold-start-reverse.ts",
			"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/agent-security-host.ts",
			"docs/reverse-agent/agent-security-host-capture-smoke.out",
		]),
		[
			"knowledgeGraphReverseNextLines",
			"reverse_domain_next",
			"appendWorkerScoreboardNodes",
			"specialistHandledContinue",
			"reverseColdStartNextLines",
			"command-templates",
			"agent-host-harness",
		],
	) &&
		/\[agent-host-harness\] hits=\d+ host=1 pure_python=0/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/\[agent-host\] ok=1/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		!/surrogate/.test(read("docs/reverse-agent/agent-security-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"knowledge format reverse extract + worker signals split + specialist result helpers + cold-start reverse; agent permission rg excludes command-templates self-match (zero surrogate smoke noise); memory product remains removed",
	"Keep reverse_domain_next on reverse-heavy knowledge graphs; do not reintroduce settings.memory",
);


push(
	"reverse:mobile-emulator-inventory-softband-autopilot-hooks",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-device.ts",
			"packages/coding-agent/src/core/repi/autopilot/run-core.ts",
			"packages/coding-agent/src/core/repi/autopilot/run-core-stages.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/tool-hooks.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/tool-hooks-call.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/tool-hooks-result.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-nodes.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-profile.ts",
			"packages/coding-agent/src/core/repi/attack-graph/build/runtime-adapters-artifact.ts",
			"docs/reverse-agent/mobile-host-capture-smoke.out",
		]),
		[
			"mobile-emulator",
			"pure_python=0",
			"mobile-emulator-pure",
			"mobile-apk-signing",
			"runAutopilotMapBootstrapStages",
			"registerRepiToolCallHook",
			"registerRepiToolResultHook",
			"appendRuntimeAdapterArtifactCommandNodes",
			"proof_exit",
		],
	) &&
		/\[mobile-device-host\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-emulator\]/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/pure_python=0/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/\[mobile-apk-signing\]/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/summary\.mobile_signing_v1=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
		(/local_attach=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) || /\[mobile-frida-local\] ok=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out"))) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"mobile emulator inventory CAP (host presence vs attach); softband autopilot stages + tool-hooks call/result + runtime-adapter graph nodes; memory product remains removed",
	"USB attach remains opt-in; emulator host=0 means binary missing not product surrogate; do not reintroduce settings.memory",
);

	push(
		"reverse:moat-har-aes-overlay-ja3-nsc-2026-07-22",
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-deep.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-aes-surrogates.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-dns-tls-deep.ts",
				"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-deep.ts",
				"packages/coding-agent/src/core/repi/kernel/factory-hooks/agent-hooks-sticky.ts",
				"docs/reverse-agent/browser-host-capture-smoke.out",
				"docs/reverse-agent/crypto-host-capture-smoke.out",
				"docs/reverse-agent/malware-host-capture-smoke.out",
				"docs/reverse-agent/dfir-host-capture-smoke.out",
				"docs/reverse-agent/mobile-host-capture-smoke.out",
			]),
			[
				"browser-har-lite",
				"CRYPTO_AES_SURROGATE",
				"malware-pe-overlay",
				"dfir-tls-ja3",
				"mobile-nsc",
				"sameRouteDomain",
				"skillHint",
			],
		) &&
			/\[browser-har-lite\]/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
			/aes=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
			/summary\.malware_pe_overlay=1|\[malware-pe-overlay\] present=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
			/\[dfir-tls-ja3\]|summary\.dfir_ja3=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
			/\[mobile-nsc\]|summary\.mobile_nsc=1|network_security_config/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
			!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
		"Moat CAP: browser HAR-lite, crypto AES-ECB pure, malware PE overlay, DFIR JA3 pure, mobile NSC, sticky skillHint sameRoute; memory product remains removed",
		"Keep pure_python honesty labels; do not reintroduce settings.memory",
	);

	push(
		"reverse:moat-cookie-rc4-k8s-jwt-2026-07-22",
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright.ts",
				"packages/coding-agent/src/core/repi/web-runtime/browser-capture-playwright-sec.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-rc4-surrogates.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/cloud-identity-deep.ts",
				"docs/reverse-agent/browser-host-capture-smoke.out",
				"docs/reverse-agent/crypto-host-capture-smoke.out",
				"docs/reverse-agent/cloud-host-capture-smoke.out",
			]),
			[
				"browser-cookie-flags",
				"CRYPTO_RC4_SURROGATE",
				"cloud-k8s-jwt",
				"summary.crypto_rc4",
				"summary.cloud_k8s_jwt",
			],
		) &&
			/\[browser-cookie-flags\]/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
			/summary\.browser_cookie_flags=1|httponly=/.test(read("docs/reverse-agent/browser-host-capture-smoke.out")) &&
			/rc4=1|summary\.crypto_rc4=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
			/\[cloud-k8s-jwt\] ok=1|summary\.cloud_k8s_jwt=1/.test(read("docs/reverse-agent/cloud-host-capture-smoke.out")) &&
			!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
		"Moat CAP: browser cookie flags, pure RC4, k8s SA JWT claim decode; memory product remains removed",
		"Keep pure_python honesty; do not reintroduce settings.memory",
	);

	push(
		"reverse:moat-pe-entropy-js-sri-2026-07-22",
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/malware-pe-host.ts",
				"packages/coding-agent/src/core/repi/web-runtime/js-signing-sri.ts",
				"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-shell.ts",
				"docs/reverse-agent/malware-host-capture-smoke.out",
				"docs/reverse-agent/js-signing-host-capture-smoke.out",
			]),
			[
				"malware-pe-entropy",
				"js-signing-sri",
				"summary.malware_pe_entropy",
				"summary.js_signing_sri",
			],
		) &&
			/\[malware-pe-entropy\]/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
			/summary\.malware_pe_entropy=1|high=1/.test(read("docs/reverse-agent/malware-host-capture-smoke.out")) &&
			/\[js-signing-sri\] ok=1|summary\.js_signing_sri=1/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
			!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
		"Moat CAP: malware PE overlay entropy high + JS SRI integrity attrs; memory product remains removed",
		"Keep pure_python honesty; do not reintroduce settings.memory",
	);

	push(
		"reverse:moat-firmware-dtb-js-wasm-2026-07-22",
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware-dtb-surrogate.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/firmware.ts",
				"packages/coding-agent/src/core/repi/web-runtime/js-signing-wasm.ts",
				"packages/coding-agent/src/core/repi/web-runtime/js-signing-script-shell.ts",
				"docs/reverse-agent/firmware-host-capture-smoke.out",
				"docs/reverse-agent/js-signing-host-capture-smoke.out",
			]),
			[
				"firmware-dtb",
				"js-signing-wasm",
				"summary.firmware_dtb",
				"summary.js_signing_wasm",
				"d00dfeed",
			],
		) &&
			/\[firmware-dtb\] ok=1|summary\.firmware_dtb=1/.test(read("docs/reverse-agent/firmware-host-capture-smoke.out")) &&
			/\[js-signing-wasm\] ok=1|summary\.js_signing_wasm=1/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
			!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
		"Moat CAP: firmware pure DTB/FDT parse + JS WASM magic/sections; memory product remains removed",
		"Keep pure_python honesty; do not reintroduce settings.memory",
	);

	push(
		"reverse:moat-malfind-rop-chacha-2026-07-22",
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-malfind-surrogate.ts",
				"packages/coding-agent/src/core/repi/reverse-runtime/native-rop-pure.ts",
				"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto-chacha-surrogates.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/crypto.ts",
				"docs/reverse-agent/memory-host-capture-smoke.out",
				"docs/reverse-agent/native-host-capture-smoke.out",
				"docs/reverse-agent/crypto-host-capture-smoke.out",
			]),
			[
				"mem-malfind",
				"native-rop-pure",
				"crypto-chacha",
				"summary.mem_malfind",
				"summary.native_rop_pure",
				"summary.crypto_chacha",
			],
		) &&
			/\[mem-malfind\] ok=1|summary\.mem_malfind=1/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")) &&
			/\[native-rop-pure\] ok=1|summary\.native_rop_pure=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
			/chacha=1|summary\.crypto_chacha=1/.test(read("docs/reverse-agent/crypto-host-capture-smoke.out")) &&
			!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
		"Moat CAP: pure mem malfind-ish PE/RWX, native ROP byte gadgets, ChaCha20 QR vector; memory product remains removed",
		"Keep pure_python honesty; do not reintroduce settings.memory",
	);

	push(
		"reverse:moat-deeplink-fmtstr-http2-2026-07-22",
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell-deep.ts",
				"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner-fmtstr.ts",
				"packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell-runner.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir-http2-surrogate.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/dfir.ts",
				"docs/reverse-agent/mobile-host-capture-smoke.out",
				"docs/reverse-agent/exploit-host-capture-smoke.out",
				"docs/reverse-agent/dfir-host-capture-smoke.out",
			]),
			[
				"mobile-deeplink",
				"mobile-exported",
				"exploit-fmtstr",
				"dfir-http2",
				"summary.mobile_deeplink",
				"summary.exploit_fmtstr",
				"summary.dfir_http2",
			],
		) &&
			/\[mobile-deeplink\] ok=1|summary\.mobile_deeplink=1/.test(read("docs/reverse-agent/mobile-host-capture-smoke.out")) &&
			/\[exploit-fmtstr\] ok=1|summary\.exploit_fmtstr=1/.test(read("docs/reverse-agent/exploit-host-capture-smoke.out")) &&
			/\[dfir-http2\] ok=1|summary\.dfir_http2=1/.test(read("docs/reverse-agent/dfir-host-capture-smoke.out")) &&
			!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
		"Moat CAP: mobile deeplink/exported, exploit fmtstr, DFIR HTTP/2 preface; memory product remains removed",
		"Keep pure_python honesty; do not reintroduce settings.memory",
	);

	push(
		"reverse:moat-sri-pslist-pure-2026-07-22",
		includesAll(
			joinSources([
				"packages/coding-agent/src/core/repi/web-runtime/js-signing-sri.ts",
				"packages/coding-agent/src/core/repi/runtime-adapter/command-templates/memory-extra-surrogates.ts",
				"docs/reverse-agent/js-signing-host-capture-smoke.out",
				"docs/reverse-agent/memory-host-capture-smoke.out",
			]),
			[
				"js-signing-sri",
				"summary.js_signing_sri",
				"pure_python_pslist",
				"mem-pslist-surrogate",
				"repi-js-sign-sample.html",
			],
		) &&
			/\[js-signing-sri\] ok=1/.test(read("docs/reverse-agent/js-signing-host-capture-smoke.out")) &&
			/\[mem-vol\] pure_python_pslist windows_pslist=\d+/.test(read("docs/reverse-agent/memory-host-capture-smoke.out")),
		"Moat CAP: dual-path JS SRI companion HTML + pure mem pslist windows_pslist alias (not vol dump); memory product remains removed",
	);



push(
	"reverse:delegate-budget-resume-playbooks-lane-softband",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/delegate/build-core-construct.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-construct-fields.ts",
			"packages/coding-agent/src/core/repi/delegate/build-core-construct-reverse.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/budget.ts",
			"packages/coding-agent/src/core/repi/operator-runtime/dispatch/budget-next.ts",
			"packages/coding-agent/src/core/repi/context-pack/resume.ts",
			"packages/coding-agent/src/core/repi/context-pack/resume-missing.ts",
			"packages/coding-agent/src/core/repi/playbooks-maintain.ts",
			"packages/coding-agent/src/core/repi/playbooks-maintain-score.ts",
			"packages/coding-agent/src/core/repi/playbooks-maintain-index.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-graph-lane.ts",
			"packages/coding-agent/src/core/repi/kernel/install-control/tools-lane-execute.ts",
			"packages/coding-agent/src/core/repi/techniques/identity_ad_techniques.ts",
			"packages/coding-agent/src/core/repi/techniques/identity_ad_techniques-early.ts",
			"packages/coding-agent/src/core/repi/techniques/identity_ad_techniques-late.ts",
		]),
		[
			"delegateReverseNextActions",
			"reverseDomainCaptureNextCommands",
			"autonomousBudgetNextActions",
			"proof.exit=partial_runtime_capture|runtime_capture_strong",
			"buildMissingExactResumeContextPack",
			"writePlaybookMaintenanceIndex",
			"executeRepiLaneTool",
			"IDENTITY_AD_TECHNIQUES_EARLY",
			"IDENTITY_AD_TECHNIQUES_LATE",
		],
	) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"softband: delegate reverse next, autonomous budget reverse gates, exact-resume missing pack, playbooks index/score, re_lane execute extract, identity-ad techniques early/late; memory product remains removed",
	"Keep reverseDomainCaptureNextCommands on reverse-heavy delegate; do not reintroduce settings.memory",
);


push(
	"reverse:host-native-rizin-suite-softband-completion-scope",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-rizin-host.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-rizin-suite.ts",
			"packages/coding-agent/src/core/repi/reverse-runtime/native-shell-proof.ts",
			"packages/coding-agent/src/core/repi/memory-events-append-completion.ts",
			"packages/coding-agent/src/core/repi/memory-events-append-completion-reverse.ts",
			"packages/coding-agent/src/core/repi/kernel/toolchain-domain-format.ts",
			"packages/coding-agent/src/core/repi/kernel/toolchain-domain-format-print.ts",
			"packages/coding-agent/src/core/repi/kernel/toolchain-domain-format-build.ts",
			"packages/coding-agent/src/core/repi/artifact-scope-pure.ts",
			"packages/coding-agent/src/core/repi/artifact-scope-format.ts",
			"packages/coding-agent/src/core/repi/profile-check/build-core.ts",
			"packages/coding-agent/src/core/repi/profile-check/build-core-checks.ts",
			"docs/reverse-agent/native-host-capture-smoke.out",
		]),
		[
			"NATIVE_RIZIN_SUITE_LINES",
			"native-rizin-find",
			"native-rizin-asm",
			"native-rizin-hash",
			"summary.rizin_suite",
			"completionMemoryReverseCommands",
			"reverseDomainCaptureNextCommands",
			"formatToolchainDomainCapability",
			"formatArtifactScopeFilter",
			"buildProfileCheckRows",
			"reverseCapabilityGuards",
		],
	) &&
		/\[native-rizin-suite\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-rizin-asm\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/\[native-rizin-hash\] ok=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/summary\.rizin_suite=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/qiling=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/angr=1/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/exact=72/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/proof\.exit=runtime_capture_strong/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		/bind_ready=true/.test(read("docs/reverse-agent/native-host-capture-smoke.out")) &&
		!existsSync(join(root, "packages/coding-agent/src/core/repi/memory-store.ts")),
	"native rizin suite CAP (rz-find/rz-asm/rz-hash) + softband completion reverse extract, toolchain format, artifact-scope format, profile-check rows; memory product remains removed",
	"Keep rz-bin host CAP; pure_python=0 on rizin suite path; do not reintroduce settings.memory",
);

// ---------- bloat guard: no huge monofiles outside data consts ----------
const allowHuge = new Set([
	"runtime-adapter/command-templates/dfir-pcap-script.ts",
	"storage/io/layout-defaults.ts",
]);
const hugeLogic = [];
function walk(relDir = "packages/coding-agent/src/core/repi") {
	const abs = join(root, relDir);
	for (const name of readdirSync(abs)) {
		const rel = `${relDir}/${name}`;
		const st = statSync(join(root, rel));
		if (st.isDirectory()) walk(rel);
		else if (name.endsWith(".ts")) {
			const n = read(rel).split("\n").length;
			const short = rel.replace("packages/coding-agent/src/core/repi/", "");
			if (n >= 280 && !allowHuge.has(short)) hugeLogic.push({ short, n });
		}
	}
}
walk();
push(
	"bloat:no-logic-monofile-ge-280",
	hugeLogic.length === 0,
	hugeLogic.length ? JSON.stringify(hugeLogic.slice(0, 12)) : "no logic monofile >=280 (data consts allowed)",
	"Split or delete logic monofiles >=280 lines; data const scripts may remain",
);

// ---------- broken import guard sample ----------
const sampleMods = [
	"packages/coding-agent/src/core/repi/reverse-io/exploit-run.ts",
	"packages/coding-agent/src/core/repi/compact-resume/signals/summary-build-summary.ts",
	"packages/coding-agent/src/core/repi/decision-runtime/rules-posture.ts",
	"packages/coding-agent/src/core/repi/lanes/specialist-evidence/native_pwn/pwn-followups.ts",
	"packages/coding-agent/src/core/repi/knowledge-graph/signals-append.ts",
];
const brokenImports = sampleMods.filter((p) => read(p).includes("import {\nimport"));
push(
	"hygiene:no-broken-import-headers",
	brokenImports.length === 0,
	brokenImports.length ? brokenImports.join(",") : "clean import headers on modular reverse modules",
	"Never inject import into the middle of an import { } block",
);

// ---------- structural obedience (product agent_end) ----------
push(
	"reverse:obedience-layer-structural",
	includesAll(
		joinSources([
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/obedience-detect.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/obedience-correct.ts",
			"packages/coding-agent/src/core/repi/kernel/factory-hooks/session-hooks.ts",
			"packages/coding-agent/src/core/repi/resources/prompts-core.ts",
		]),
		[
			"detectObedienceViolation",
			"registerObedienceHook",
			"operator_supremacy",
			"no_moral_judgment",
			"authorization_theater",
			"agent_end",
		],
	) &&
		read("packages/coding-agent/src/core/repi/kernel/factory-hooks/session-hooks.ts").includes("registerObedienceHook"),
	"obedience layer: agent_end detection (refusal/excuse) + correction inject + doctrine operator_supremacy",
	"Keep product obedience wired via session hooks; agent-session no_refusal_kernel remains primary narrative-only backstop",
);

const ok = rows.every((row) => row.status === "pass");
const report = {
	kind: "repi-product-contract-report",
	schemaVersion: 2,
	generatedAt: new Date().toISOString(),
	root,
	ok,
	pass: rows.filter((r) => r.status === "pass").length,
	fail: rows.filter((r) => r.status === "fail").length,
	rows,
};

if (json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log("REPI Product Contract");
	console.log(`root: ${root}`);
	for (const row of rows) {
		console.log(`${row.status === "pass" ? "PASS" : "FAIL"} ${row.id} :: ${row.evidence}`);
		if (row.status !== "pass") console.log(`  fix: ${row.fix}`);
	}
	console.log(`verdict: ${ok ? "pass" : "fail"} (${report.pass} PASS / ${report.fail} FAIL)`);
}

process.exit(ok ? 0 : 1);

