import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ExtensionAPI } from "../src/core/extensions/types.ts";
import { createReconExtensionFactory } from "../src/core/recon-profile.ts";

const ENV_AGENT_DIR = "REPI_CODING_AGENT_DIR";
const ENV_BRANCH_ID = "REPI_BRANCH_ID";

describe.skipIf(process.env.REPI_RUN_RECON_E2E !== "1")("REPI full inline profile integration", () => {
	let tempDir: string;
	let agentDir: string;
	let previousAgentDir: string | undefined;
	let previousBranchId: string | undefined;

	beforeEach(() => {
		tempDir = join(tmpdir(), `repi-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		agentDir = join(tempDir, "agent");
		mkdirSync(agentDir, { recursive: true });
		previousAgentDir = process.env[ENV_AGENT_DIR];
		previousBranchId = process.env[ENV_BRANCH_ID];
		process.env[ENV_AGENT_DIR] = agentDir;
	});

	afterEach(() => {
		if (previousAgentDir === undefined) {
			delete process.env[ENV_AGENT_DIR];
		} else {
			process.env[ENV_AGENT_DIR] = previousAgentDir;
		}
		if (previousBranchId === undefined) {
			delete process.env[ENV_BRANCH_ID];
		} else {
			process.env[ENV_BRANCH_ID] = previousBranchId;
		}
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("runs the full REPI inline extension integration chain", async () => {
		const commands = new Map<string, unknown>();
		const tools = new Map<string, unknown>();
		const handlers = new Map<string, unknown[]>();
		const execCalls: Array<{ command: string; args: string[] }> = [];
		const fakePi = {
			registerCommand(name: string, options: unknown) {
				commands.set(name, options);
			},
			registerTool(tool: { name: string }) {
				tools.set(tool.name, tool);
			},
			on(event: string, handler: unknown) {
				handlers.set(event, [...(handlers.get(event) ?? []), handler]);
			},
			appendEntry() {},
			getSessionName: () => undefined,
			setSessionName() {},
			sendMessage() {},
			exec: async (command: string, args: string[]) => {
				execCalls.push({ command, args });
				return {
					code: 0,
					stdout: "### lane-command 1: r2-xrefs\nmain\n### lane-command 2: objdump-control\nstrcmp\n",
					stderr: "",
					killed: false,
				};
			},
		} as unknown as ExtensionAPI;

		createReconExtensionFactory()(fakePi);

		expect(commands.has("re-route")).toBe(true);
		expect(commands.has("re-kernel")).toBe(true);
		expect(commands.has("re-decision")).toBe(true);
		expect(commands.has("re-live-browser")).toBe(true);
		expect(commands.has("re-web-authz-state")).toBe(true);
		expect(commands.has("re-exploit-lab")).toBe(true);
		expect(commands.has("re-mobile-runtime")).toBe(true);
		expect(commands.has("re-native-runtime")).toBe(true);
		expect(commands.has("re-tools")).toBe(true);
		expect(commands.has("re-toolchain")).toBe(true);
		expect(commands.has("re-runtime-bridge")).toBe(true);
		expect(commands.has("re-runtime-adapter")).toBe(true);
		expect(commands.has("re-memory")).toBe(true);
		expect(commands.has("re-mission")).toBe(true);
		expect(commands.has("re-evidence")).toBe(true);
		expect(commands.has("re-graph")).toBe(true);
		expect(commands.has("re-chain")).toBe(true);
		expect(commands.has("re-campaign")).toBe(true);
		expect(commands.has("re-operation")).toBe(true);
		expect(commands.has("re-delegate")).toBe(true);
		expect(commands.has("re-swarm")).toBe(true);
		expect(commands.has("re-supervisor")).toBe(true);
		expect(commands.has("re-reflect")).toBe(true);
		expect(commands.has("re-context")).toBe(true);
		expect(commands.has("re-operator")).toBe(true);
		expect(commands.has("re-verifier")).toBe(true);
		expect(commands.has("re-compiler")).toBe(true);
		expect(commands.has("re-replayer")).toBe(true);
		expect(commands.has("re-autofix")).toBe(true);
		expect(commands.has("re-proof-loop")).toBe(true);
		expect(commands.has("re-knowledge-graph")).toBe(true);
		expect(commands.has("re-profile-check")).toBe(true);
		expect(commands.has("re-lane")).toBe(true);
		expect(commands.has("re-map")).toBe(true);
		expect(commands.has("re-auto")).toBe(true);
		expect(commands.has("re-bootstrap")).toBe(true);
		expect(commands.has("re-complete")).toBe(true);
		expect(commands.has("re-self-review")).toBe(true);
		expect(commands.has("goal")).toBe(true);
		expect(tools.has("re_route")).toBe(true);
		expect(tools.has("re_kernel")).toBe(true);
		expect(tools.has("re_decision_core")).toBe(true);
		expect(tools.has("re_live_browser")).toBe(true);
		expect(tools.has("re_web_authz_state")).toBe(true);
		expect(tools.has("re_exploit_lab")).toBe(true);
		expect(tools.has("re_mobile_runtime")).toBe(true);
		expect(tools.has("re_native_runtime")).toBe(true);
		expect(tools.has("re_memory")).toBe(true);
		expect(tools.has("re_tool_index")).toBe(true);
		expect(tools.has("re_toolchain_domain")).toBe(true);
		expect(tools.has("re_runtime_bridge")).toBe(true);
		expect(tools.has("re_runtime_adapter")).toBe(true);
		expect(tools.has("re_mission")).toBe(true);
		expect(tools.has("re_evidence")).toBe(true);
		expect(tools.has("re_graph")).toBe(true);
		expect(tools.has("re_exploit_chain")).toBe(true);
		expect(tools.has("re_campaign")).toBe(true);
		expect(tools.has("re_operation")).toBe(true);
		expect(tools.has("re_delegate")).toBe(true);
		expect(tools.has("re_swarm")).toBe(true);
		expect(tools.has("re_supervisor")).toBe(true);
		expect(tools.has("re_reflect")).toBe(true);
		expect(tools.has("re_context")).toBe(true);
		expect(tools.has("re_operator")).toBe(true);
		expect(tools.has("re_verifier")).toBe(true);
		expect(tools.has("re_compiler")).toBe(true);
		expect(tools.has("re_replayer")).toBe(true);
		expect(tools.has("re_autofix")).toBe(true);
		expect(tools.has("re_proof_loop")).toBe(true);
		expect(tools.has("re_knowledge_graph")).toBe(true);
		expect(tools.has("re_profile_check")).toBe(true);
		expect(tools.has("re_lane")).toBe(true);
		expect(tools.has("re_map")).toBe(true);
		expect(tools.has("re_autopilot")).toBe(true);
		expect(tools.has("re_bootstrap")).toBe(true);
		expect(tools.has("re_complete")).toBe(true);
		expect(tools.has("goal_complete")).toBe(true);

		const bootstrapTool = tools.get("re_bootstrap") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const bootstrapPlan = await bootstrapTool.execute("tool-call-id", { action: "plan", tools: ["gdb"] });
		expect(bootstrapPlan.content[0]?.text).toContain("sudo apt-get install -y gdb");
		const bootstrapGoPlan = await bootstrapTool.execute("tool-call-id", {
			action: "plan",
			tools: ["nuclei", "msfconsole"],
		});
		expect(bootstrapGoPlan.content[0]?.text).toContain("apt-get install -y golang-go");
		expect(bootstrapGoPlan.content[0]?.text).toContain("metasploit-framework");

		const missionTool = tools.get("re_mission") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const missionResult = await missionTool.execute("tool-call-id", {
			action: "new",
			task: "分析 ELF 许可证校验",
		});
		expect(missionResult.content[0]?.text).toContain("mission_id:");
		expect(readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8")).toContain("Native reverse");

		const kernelTool = tools.get("re_kernel") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const kernelResult = await kernelTool.execute("tool-call-id", { action: "build", target: "./license" });
		expect(kernelResult.content[0]?.text).toContain("execution_kernel:");
		expect(kernelResult.content[0]?.text).toContain("kernel_artifact:");
		expect(kernelResult.content[0]?.text).toContain("directive_stack:");
		expect(kernelResult.content[0]?.text).toContain("operator-command-floor");
		expect(kernelResult.content[0]?.text).toContain("execution_invariants:");
		expect(kernelResult.content[0]?.text).toContain("operator_command_floor:");
		expect(kernelResult.content[0]?.text).toContain("specialist_capability_matrix:");
		expect(kernelResult.content[0]?.text).toContain("proof_exit_criteria:");
		expect(kernelResult.content[0]?.text).toContain("native-deep");
		expect(kernelResult.content[0]?.text).toContain("narrative_only_answer");
		expect(kernelResult.content[0]?.text).toContain("refusal_to_execution_rules:");
		expect(kernelResult.content[0]?.text).toContain("tool_call_policy:");
		expect(kernelResult.content[0]?.text).toContain("artifact_contract:");
		expect(kernelResult.content[0]?.text).toContain("stall_recovery:");
		expect(kernelResult.content[0]?.text).toContain("next_kernel_command:");
		const kernelPath = /kernel_artifact: (.+)/.exec(kernelResult.content[0]?.text ?? "")?.[1]?.trim();
		expect(kernelPath).toBeDefined();
		expect(existsSync(kernelPath!)).toBe(true);
		expect(readFileSync(kernelPath!, "utf-8")).toContain("REPI Execution Kernel Artifact");
		expect(readFileSync(join(agentDir, "recon", "memory", "execution-kernel.md"), "utf-8")).toContain(
			"Execution Kernel",
		);
		const missionAfterKernel = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterKernel.checkpoints.find((gate) => gate.name === "execution_kernel_ready")?.status).toBe(
			"done",
		);

		const decisionTool = tools.get("re_decision_core") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const decisionResult = await decisionTool.execute("tool-call-id", { action: "tick", target: "./license" });
		expect(decisionResult.content[0]?.text).toContain("decision_core:");
		expect(decisionResult.content[0]?.text).toContain("decision_artifact:");
		expect(decisionResult.content[0]?.text).toContain("objective_stack:");
		expect(decisionResult.content[0]?.text).toContain("check_pressure:");
		expect(decisionResult.content[0]?.text).toContain("evidence_priority:");
		expect(decisionResult.content[0]?.text).toContain("tool_posture:");
		expect(decisionResult.content[0]?.text).toContain("artifact_posture:");
		expect(decisionResult.content[0]?.text).toContain("decision_rules:");
		expect(decisionResult.content[0]?.text).toContain("operator_queue:");
		expect(decisionResult.content[0]?.text).toContain("operator_next_command:");
		expect(decisionResult.content[0]?.text).toContain("next_decision_command:");
		const decisionPath = /decision_artifact: (.+)/.exec(decisionResult.content[0]?.text ?? "")?.[1]?.trim();
		expect(decisionPath).toBeDefined();
		expect(existsSync(decisionPath!)).toBe(true);
		expect(readFileSync(decisionPath!, "utf-8")).toContain("REPI Decision Core Artifact");
		expect(readFileSync(join(agentDir, "recon", "memory", "decision-core.md"), "utf-8")).toContain("Decision Core");
		const missionAfterDecision = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterDecision.checkpoints.find((gate) => gate.name === "decision_core_ready")?.status).toBe("done");

		const decisionRun = await decisionTool.execute("tool-call-id", {
			action: "run",
			target: "./license",
			maxSteps: 1,
		});
		expect(decisionRun.content[0]?.text).toContain("decision_core:");
		expect(decisionRun.content[0]?.text).toContain("mode: run");
		expect(decisionRun.content[0]?.text).toContain("executed_steps: 1");
		expect(decisionRun.content[0]?.text).toContain("next_decision_command: re_verifier matrix");
		const decisionRunPath = /decision_artifact: (.+)/.exec(decisionRun.content[0]?.text ?? "")?.[1]?.trim();
		expect(decisionRunPath).toBeDefined();
		expect(existsSync(decisionRunPath!)).toBe(true);
		expect(readFileSync(decisionRunPath!, "utf-8")).toContain("REPI Decision Core Artifact");
		expect(readFileSync(join(agentDir, "recon", "memory", "decision-core.md"), "utf-8")).toContain("## Executed");

		const liveBrowserTool = tools.get("re_live_browser") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const browserPlan = await liveBrowserTool.execute("tool-call-id", {
			action: "plan",
			target: "https://target.local/app",
		});
		expect(browserPlan.content[0]?.text).toContain("live_browser:");
		expect(browserPlan.content[0]?.text).toContain("browser_artifact:");
		expect(browserPlan.content[0]?.text).toContain("runtime_matrix:");
		expect(browserPlan.content[0]?.text).toContain("auth_matrix:");
		expect(browserPlan.content[0]?.text).toContain("idor_bola_probe_templates:");
		expect(browserPlan.content[0]?.text).toContain("websocket_probes:");
		expect(browserPlan.content[0]?.text).toContain("capture_script:");
		expect(browserPlan.content[0]?.text).toContain("next_browser_command:");
		const browserPath = /browser_artifact: (.+)/.exec(browserPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(browserPath).toBeDefined();
		expect(existsSync(browserPath!)).toBe(true);
		expect(readFileSync(browserPath!, "utf-8")).toContain("REPI Live Browser Artifact");
		const missionAfterBrowser = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterBrowser.checkpoints.find((gate) => gate.name === "live_browser_ready")?.status).toBe("done");

		const invalidBrowserPlan = await liveBrowserTool.execute("tool-call-id", {
			action: "plan",
			target: "/root/ctf",
		});
		expect(invalidBrowserPlan.content[0]?.text).toContain("invalid_url");
		expect(invalidBrowserPlan.content[0]?.text).not.toContain("douyinpic.com");

		const webAuthzTool = tools.get("re_web_authz_state") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const webAuthzPlan = await webAuthzTool.execute("tool-call-id", {
			action: "plan",
			target: "https://target.local/api/users/123",
			timeoutMs: 9000,
		});
		expect(webAuthzPlan.content[0]?.text).toContain("web_authz_state:");
		expect(webAuthzPlan.content[0]?.text).toContain("web_authz_artifact:");
		expect(webAuthzPlan.content[0]?.text).toContain("route_inventory:");
		expect(webAuthzPlan.content[0]?.text).toContain("principal_matrix:");
		expect(webAuthzPlan.content[0]?.text).toContain("object_probes:");
		expect(webAuthzPlan.content[0]?.text).toContain("state_machine:");
		expect(webAuthzPlan.content[0]?.text).toContain("sequence_replay:");
		expect(webAuthzPlan.content[0]?.text).toContain("ownership_checks:");
		expect(webAuthzPlan.content[0]?.text).toContain("rollback_checks:");
		expect(webAuthzPlan.content[0]?.text).toContain("next_web_authz_command:");
		const webAuthzPath = /web_authz_artifact: (.+)/.exec(webAuthzPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(webAuthzPath).toBeDefined();
		expect(existsSync(webAuthzPath!)).toBe(true);
		expect(readFileSync(webAuthzPath!, "utf-8")).toContain("REPI Web Authz State Artifact");
		const missionAfterWebAuthz = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterWebAuthz.checkpoints.find((gate) => gate.name === "web_authz_ready")?.status).toBe("done");

		const exploitLabTool = tools.get("re_exploit_lab") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const exploitLabPlan = await exploitLabTool.execute("tool-call-id", {
			action: "plan",
			target: "./exploit.py",
			runs: 3,
			timeoutMs: 7000,
		});
		expect(exploitLabPlan.content[0]?.text).toContain("exploit_lab:");
		expect(exploitLabPlan.content[0]?.text).toContain("exploit_lab_artifact:");
		expect(exploitLabPlan.content[0]?.text).toContain("lab_matrix:");
		expect(exploitLabPlan.content[0]?.text).toContain("poc_inventory:");
		expect(exploitLabPlan.content[0]?.text).toContain("environment_pins:");
		expect(exploitLabPlan.content[0]?.text).toContain("flake_triage:");
		expect(exploitLabPlan.content[0]?.text).toContain("bundle_manifest:");
		expect(exploitLabPlan.content[0]?.text).toContain("next_lab_command:");
		const exploitLabPath = /exploit_lab_artifact: (.+)/.exec(exploitLabPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(exploitLabPath).toBeDefined();
		expect(existsSync(exploitLabPath!)).toBe(true);
		expect(readFileSync(exploitLabPath!, "utf-8")).toContain("REPI Exploit Lab Artifact");
		const missionAfterExploitLab = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterExploitLab.checkpoints.find((gate) => gate.name === "exploit_lab_ready")?.status).toBe("done");

		const mobileRuntimeTool = tools.get("re_mobile_runtime") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const mobilePlan = await mobileRuntimeTool.execute("tool-call-id", {
			action: "plan",
			target: "./app.apk",
			packageName: "com.demo.app",
			timeoutMs: 9000,
		});
		expect(mobilePlan.content[0]?.text).toContain("mobile_runtime:");
		expect(mobilePlan.content[0]?.text).toContain("mobile_runtime_artifact:");
		expect(mobilePlan.content[0]?.text).toContain("device_matrix:");
		expect(mobilePlan.content[0]?.text).toContain("apk_inventory:");
		expect(mobilePlan.content[0]?.text).toContain("process_map:");
		expect(mobilePlan.content[0]?.text).toContain("hook_plan:");
		expect(mobilePlan.content[0]?.text).toContain("frida_hooks:");
		expect(mobilePlan.content[0]?.text).toContain("native_trace:");
		expect(mobilePlan.content[0]?.text).toContain("anti_debug_checks:");
		expect(mobilePlan.content[0]?.text).toContain("next_mobile_command:");
		const mobilePath = /mobile_runtime_artifact: (.+)/.exec(mobilePlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(mobilePath).toBeDefined();
		expect(existsSync(mobilePath!)).toBe(true);
		expect(readFileSync(mobilePath!, "utf-8")).toContain("REPI Mobile Runtime Artifact");
		const missionAfterMobile = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterMobile.checkpoints.find((gate) => gate.name === "mobile_runtime_ready")?.status).toBe("done");

		const dynamicOnlyMobilePlan = await mobileRuntimeTool.execute("tool-call-id", {
			action: "plan",
			packageName: "com.demo.app",
		});
		expect(dynamicOnlyMobilePlan.content[0]?.text).toContain("analysis_mode=dynamic-only");
		expect(dynamicOnlyMobilePlan.content[0]?.text).toContain("static APK analysis skipped");

		const nativeRuntimeTool = tools.get("re_native_runtime") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const nativePlan = await nativeRuntimeTool.execute("tool-call-id", {
			action: "plan",
			target: "./vuln",
			timeoutMs: 9000,
		});
		expect(nativePlan.content[0]?.text).toContain("native_runtime:");
		expect(nativePlan.content[0]?.text).toContain("native_runtime_artifact:");
		expect(nativePlan.content[0]?.text).toContain("binary_inventory:");
		expect(nativePlan.content[0]?.text).toContain("mitigation_matrix:");
		expect(nativePlan.content[0]?.text).toContain("loader_libc:");
		expect(nativePlan.content[0]?.text).toContain("symbol_map:");
		expect(nativePlan.content[0]?.text).toContain("crash_plan:");
		expect(nativePlan.content[0]?.text).toContain("gdb_trace:");
		expect(nativePlan.content[0]?.text).toContain("breakpoint_plan:");
		expect(nativePlan.content[0]?.text).toContain("exploit_scaffold:");
		expect(nativePlan.content[0]?.text).toContain("next_native_command:");
		const nativePath = /native_runtime_artifact: (.+)/.exec(nativePlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(nativePath).toBeDefined();
		expect(existsSync(nativePath!)).toBe(true);
		expect(readFileSync(nativePath!, "utf-8")).toContain("REPI Native Runtime Artifact");
		const missionAfterNative = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterNative.checkpoints.find((gate) => gate.name === "native_runtime_ready")?.status).toBe("done");

		const laneTool = tools.get("re_lane") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const laneResult = await laneTool.execute("tool-call-id", {
			action: "done",
			lane: "triage",
			note: "headers mapped",
		});
		expect(laneResult.content[0]?.text).toContain("[done] triage");
		expect(laneResult.content[0]?.text).toContain("[in_progress] control-flow");
		expect(readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8")).toContain("passive_map_done");

		const lanePlan = await laneTool.execute("tool-call-id", {
			action: "plan",
			lane: "control-flow",
			target: "./license",
		});
		expect(lanePlan.content[0]?.text).toContain("lane: control-flow");
		expect(lanePlan.content[0]?.text).toContain("case_memory_migrations:");
		expect(lanePlan.content[0]?.text).toContain("r2 -A");
		expect(lanePlan.content[0]?.text).toContain("objdump");
		const missionAfterPlan = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as {
			checkpoints: Array<{ name: string; status: string }>;
		};
		expect(missionAfterPlan.checkpoints.find((gate) => gate.name === "repro_commands_ready")?.status).toBe("done");

		const ctfDir = join(tempDir, "ctf");
		mkdirSync(ctfDir, { recursive: true });
		writeFileSync(join(ctfDir, "vuln"), "#!/bin/sh\nexit 0\n", "utf-8");
		const directoryLanePlan = await laneTool.execute("tool-call-id", {
			action: "plan",
			lane: "triage",
			target: ctfDir,
		});
		expect(directoryLanePlan.content[0]?.text).toContain("directory-triage-file-map");
		expect(directoryLanePlan.content[0]?.text).not.toContain(`readelf -hW '${ctfDir}'`);
		expect(directoryLanePlan.content[0]?.text).not.toContain(`checksec --file='${ctfDir}'`);

		execCalls.length = 0;
		const laneRun = await laneTool.execute("tool-call-id", {
			action: "run",
			lane: "control-flow",
			target: "./license",
		});
		expect(execCalls).toHaveLength(1);
		expect(execCalls[0]?.command).toBe("bash");
		expect(execCalls[0]?.args.join(" ")).toContain("r2 -A");
		expect(execCalls[0]?.args.join(" ")).toContain("objdump");
		expect(laneRun.content[0]?.text).toContain("evidence_artifact:");
		expect(laneRun.content[0]?.text).toContain("evidence_ledger:");
		expect(laneRun.content[0]?.text).toContain("auto_lane_update: control-flow -> runtime-proof");
		expect(laneRun.content[0]?.text).toContain("analysis:");
		expect(laneRun.content[0]?.text).toContain("comparison/verification anchors");
		expect(laneRun.content[0]?.text).toContain("followup_commands:");
		expect(laneRun.content[0]?.text).toContain("runtime-compare-breakpoints");
		const artifactPath = /evidence_artifact: (.+)/.exec(laneRun.content[0]?.text ?? "")?.[1]?.trim();
		expect(artifactPath).toBeDefined();
		expect(existsSync(artifactPath!)).toBe(true);
		expect(readFileSync(artifactPath!, "utf-8")).toContain("REPI Lane Run Artifact");
		expect(readFileSync(artifactPath!, "utf-8")).toContain("## Auto analysis");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain(
			"lane-run control-flow exit 0",
		);
		const missionAfterRun = JSON.parse(readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8")) as {
			lanes: Array<{ name: string; status?: string; note?: string; next: string[] }>;
		};
		const controlFlowLane = missionAfterRun.lanes.find((lane) => lane.name === "control-flow");
		const runtimeLane = missionAfterRun.lanes.find((lane) => lane.name === "runtime-proof");
		expect(controlFlowLane?.status).toBe("done");
		expect(controlFlowLane?.note).toContain("last_run exit=0");
		expect(runtimeLane?.status).toBe("in_progress");
		expect(runtimeLane?.next.join("\n")).toContain("[auto:runtime-compare-breakpoints]");
		expect(runtimeLane?.note).toContain("auto_from=control-flow");

		const laneRunAuto = await laneTool.execute("tool-call-id", {
			action: "run-auto",
			lane: "runtime-proof",
			target: "./license",
			max: 1,
		});
		expect(execCalls).toHaveLength(2);
		expect(laneRunAuto.content[0]?.text).toContain("run_auto_summary:");
		expect(laneRunAuto.content[0]?.text).toContain("adaptive_decisions:");
		expect(laneRunAuto.content[0]?.text).toContain("adaptive_decision:");
		expect(laneRunAuto.content[0]?.text).toContain("steps_executed: 1");
		expect(laneRunAuto.content[0]?.text).toContain("playbook_path:");
		expect(laneRunAuto.content[0]?.text).toContain("field_journal_anchor:");
		expect(laneRunAuto.content[0]?.text).toContain("evolution_anchor:");
		expect(laneRunAuto.content[0]?.text).toContain("## run-auto step 1: runtime-proof");
		expect(laneRunAuto.content[0]?.text).toContain("auto_lane_update: runtime-proof -> report");
		const playbookPath = /playbook_path: (.+)/.exec(laneRunAuto.content[0]?.text ?? "")?.[1]?.trim();
		expect(playbookPath).toBeDefined();
		expect(existsSync(playbookPath!)).toBe(true);
		expect(readFileSync(playbookPath!, "utf-8")).toContain("REPI Auto Playbook");
		expect(readFileSync(playbookPath!, "utf-8")).toContain("quality_score:");
		expect(readFileSync(playbookPath!, "utf-8")).toContain("auto_advance_count:");
		expect(readFileSync(join(agentDir, "recon", "memory", "field-journal.md"), "utf-8")).toContain(
			"run-auto-playbook",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "evolution-log.md"), "utf-8")).toContain(
			"run-auto playbook",
		);
		const missionAfterRunAuto = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as {
			lanes: Array<{ name: string; status?: string; note?: string; next: string[] }>;
			checkpoints: Array<{ name: string; status: string }>;
		};
		expect(missionAfterRunAuto.lanes.find((lane) => lane.name === "runtime-proof")?.status).toBe("done");
		const reportLane = missionAfterRunAuto.lanes.find((lane) => lane.name === "report");
		expect(reportLane?.status).toBe("in_progress");
		expect(reportLane?.next.join("\n")).toContain("[auto:runtime-compare-breakpoints]");
		expect(missionAfterRunAuto.checkpoints.find((gate) => gate.name === "memory_or_evolution_written")?.status).toBe(
			"done",
		);

		const memoryAugmentedPlan = await laneTool.execute("tool-call-id", {
			action: "plan",
			lane: "runtime-proof",
			target: "./fresh-license",
		});
		expect(memoryAugmentedPlan.content[0]?.text).toContain("memory_reuse:");
		expect(memoryAugmentedPlan.content[0]?.text).toContain("memory:");
		expect(memoryAugmentedPlan.content[0]?.text).toContain("quality=");
		expect(memoryAugmentedPlan.content[0]?.text).toContain("./fresh-license");
		expect(memoryAugmentedPlan.content[0]?.text).toContain("case_index_hits:");

		const mapTool = tools.get("re_map") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const passiveMap = await mapTool.execute("tool-call-id", {
			target: "./license",
			depth: 2,
		});
		expect(execCalls).toHaveLength(3);
		expect(execCalls[2]?.args.join(" ")).toContain("route-auth-search");
		expect(passiveMap.content[0]?.text).toContain("passive_map_result:");
		expect(passiveMap.content[0]?.text).toContain("map_artifact:");
		const mapArtifactPath = /map_artifact: (.+)/.exec(passiveMap.content[0]?.text ?? "")?.[1]?.trim();
		expect(mapArtifactPath).toBeDefined();
		expect(existsSync(mapArtifactPath!)).toBe(true);
		expect(readFileSync(mapArtifactPath!, "utf-8")).toContain("REPI Passive Map Artifact");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain("passive-map");

		const mapInferredPlan = await laneTool.execute("tool-call-id", {
			action: "plan",
			lane: "control-flow",
		});
		expect(mapInferredPlan.content[0]?.text).toContain("target: ./license");
		expect(mapInferredPlan.content[0]?.text).toContain("map_reuse:");
		expect(mapInferredPlan.content[0]?.text).toContain("map_inferred_target: ./license");
		expect(mapInferredPlan.content[0]?.text).toContain("map-artifact-context");
		expect(mapInferredPlan.content[0]?.text).toContain("sed -n '1,180p'");

		const autopilotTool = tools.get("re_autopilot") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		writeFileSync(
			join(agentDir, "recon", "tools", "tool-index.md"),
			[
				"# REPI Tool Index",
				"",
				"| Tool | Present | Path | Version probe |",
				"|---|---:|---|---|",
				"| file | yes | /usr/bin/file | file |",
				"| sha256sum | yes | /usr/bin/sha256sum | sha256sum |",
				"| readelf | yes | /usr/bin/readelf | readelf |",
				"| strings | yes | /usr/bin/strings | strings |",
				"| objdump | yes | /usr/bin/objdump | objdump |",
				"| rabin2 | yes | /usr/bin/rabin2 | rabin2 |",
				"| r2 | yes | /usr/bin/r2 | r2 |",
				"| checksec | no |  |  |",
				"| python3 | yes | /usr/bin/python3 | Python |",
				"",
			].join("\n"),
		);
		const degradedLaneRun = await laneTool.execute("tool-call-id", {
			action: "run",
			lane: "triage",
			target: "./license",
		});
		expect(execCalls).toHaveLength(4);
		expect(degradedLaneRun.content[0]?.text).toContain("execution_strategy:");
		expect(degradedLaneRun.content[0]?.text).toContain("mode: degraded");
		expect(degradedLaneRun.content[0]?.text).toContain("fallback_commands:");
		expect(execCalls[3]?.args.join(" ")).toContain("rabin2 -I");
		expect(execCalls[3]?.args.join(" ")).not.toContain("checksec --file");

		const autopilotRun = await autopilotTool.execute("tool-call-id", {
			action: "run",
			task: "分析 ELF 许可证校验",
			target: "./license",
			maxAutoSteps: 1,
		});
		expect(execCalls).toHaveLength(7);
		expect(autopilotRun.content[0]?.text).toContain("autopilot_result:");
		expect(autopilotRun.content[0]?.text).toContain("bootstrap_plan:");
		expect(autopilotRun.content[0]?.text).toContain("recommended_tools:");
		expect(autopilotRun.content[0]?.text).toContain("next_bootstrap_command:");
		expect(autopilotRun.content[0]?.text).toContain("execution_strategy:");
		expect(autopilotRun.content[0]?.text).toContain("case_memory_migrations:");
		expect(autopilotRun.content[0]?.text).toContain("case_memory_lane_plan:");
		expect(autopilotRun.content[0]?.text).toContain("mode: degraded");
		expect(autopilotRun.content[0]?.text).toContain("fallback_commands:");
		expect(autopilotRun.content[0]?.text).toContain("checksec");
		expect(autopilotRun.content[0]?.text).toContain("r2");
		expect(execCalls[5]?.args.join(" ")).toContain("rabin2 -I");
		expect(execCalls[5]?.args.join(" ")).not.toContain("checksec --file");
		expect(autopilotRun.content[0]?.text).toContain("passive_map_result:");
		expect(autopilotRun.content[0]?.text).toContain("run_result:");
		expect(autopilotRun.content[0]?.text).toContain("run_auto_summary:");
		expect(autopilotRun.content[0]?.text).toContain("completion_status:");
		expect(autopilotRun.content[0]?.text).toContain("field_journal_anchor:");

		const evidenceTool = tools.get("re_evidence") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const evidenceResult = await evidenceTool.execute("tool-call-id", {
			action: "append",
			kind: "runtime",
			title: "strcmp hook",
			fact: "runtime compared candidate with expected license bytes",
		});
		expect(evidenceResult.content[0]?.text).toContain("P1 runtime");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain(
			"expected license bytes",
		);

		const graphTool = tools.get("re_graph") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const graphResult = await graphTool.execute("tool-call-id", { action: "build" });
		expect(graphResult.content[0]?.text).toContain("attack_graph:");
		expect(graphResult.content[0]?.text).toContain("graph_artifact:");
		expect(graphResult.content[0]?.text).toContain("critical_path:");
		expect(graphResult.content[0]?.text).toContain("operator_next_actions:");
		const graphPath = /graph_artifact: (.+)/.exec(graphResult.content[0]?.text ?? "")?.[1]?.trim();
		expect(graphPath).toBeDefined();
		expect(existsSync(graphPath!)).toBe(true);
		expect(readFileSync(graphPath!, "utf-8")).toContain("REPI Attack Graph Artifact");
		expect(readFileSync(graphPath!, "utf-8")).toContain("## Nodes");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain("attack-graph");
		const graphShow = await graphTool.execute("tool-call-id", { action: "show" });
		expect(graphShow.content[0]?.text).toContain("REPI Attack Graph Artifact");

		const chainTool = tools.get("re_exploit_chain") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const chainPlan = await chainTool.execute("tool-call-id", {
			action: "plan",
			target: "./license",
		});
		expect(chainPlan.content[0]?.text).toContain("exploit_chain:");
		expect(chainPlan.content[0]?.text).toContain("chain_artifact:");
		expect(chainPlan.content[0]?.text).toContain("chain_nodes:");
		expect(chainPlan.content[0]?.text).toContain("proof_path:");
		expect(chainPlan.content[0]?.text).toContain("exploit_path:");
		expect(chainPlan.content[0]?.text).toContain("evidence_gaps:");
		expect(chainPlan.content[0]?.text).toContain("operator_feedback:");
		expect(chainPlan.content[0]?.text).toContain("operator_feedback_queue:");
		expect(chainPlan.content[0]?.text).toContain("replay_commands:");
		expect(chainPlan.content[0]?.text).toContain("operator_queue:");
		expect(chainPlan.content[0]?.text).toContain("next_chain_command:");
		const chainPath = /chain_artifact: (.+)/.exec(chainPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(chainPath).toBeDefined();
		expect(existsSync(chainPath!)).toBe(true);
		expect(readFileSync(chainPath!, "utf-8")).toContain("REPI Exploit Chain Artifact");
		expect(readFileSync(chainPath!, "utf-8")).toContain("primitive_or_state_transition");
		const missionAfterChain = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterChain.checkpoints.find((gate) => gate.name === "exploit_chain_ready")?.status).toBe("done");

		await missionTool.execute("tool-call-id", {
			action: "new",
			task: "Web API JWT auth websocket replay cloud identity",
		});
		const campaignTool = tools.get("re_campaign") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const campaignResult = await campaignTool.execute("tool-call-id", {
			action: "plan",
			target: "https://target.local/app",
		});
		expect(campaignResult.content[0]?.text).toContain("campaign_graph:");
		expect(campaignResult.content[0]?.text).toContain("campaign_artifact:");
		expect(campaignResult.content[0]?.text).toContain("phases:");
		expect(campaignResult.content[0]?.text).toContain("web-authz");
		expect(campaignResult.content[0]?.text).toContain("re_live_browser plan https://target.local/app");
		expect(campaignResult.content[0]?.text).toContain("re_web_authz_state plan https://target.local/app");
		expect(campaignResult.content[0]?.text).toContain("credential-identity");
		expect(campaignResult.content[0]?.text).toContain("cloud-container");
		expect(campaignResult.content[0]?.text).toContain("pivot_candidates:");
		expect(campaignResult.content[0]?.text).toContain("evidence_gaps:");
		expect(campaignResult.content[0]?.text).toContain("tool_gaps:");
		expect(campaignResult.content[0]?.text).toContain("operator_next_actions:");
		expect(campaignResult.content[0]?.text).toContain("next_bootstrap_command:");
		const campaignPath = /campaign_artifact: (.+)/.exec(campaignResult.content[0]?.text ?? "")?.[1]?.trim();
		expect(campaignPath).toBeDefined();
		expect(existsSync(campaignPath!)).toBe(true);
		expect(readFileSync(campaignPath!, "utf-8")).toContain("REPI Campaign Artifact");
		expect(readFileSync(campaignPath!, "utf-8")).toContain("campaign_graph:");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain("campaign-plan");
		const campaignShow = await campaignTool.execute("tool-call-id", { action: "show" });
		expect(campaignShow.content[0]?.text).toContain("REPI Campaign Artifact");

		const operationTool = tools.get("re_operation") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const operationPlan = await operationTool.execute("tool-call-id", {
			action: "next",
			target: "https://target.local/app",
		});
		expect(operationPlan.content[0]?.text).toContain("operation_queue:");
		expect(operationPlan.content[0]?.text).toContain("operation_artifact:");
		expect(operationPlan.content[0]?.text).toContain("phase_runner:");
		expect(operationPlan.content[0]?.text).toContain("re_live_browser plan/run");
		expect(operationPlan.content[0]?.text).toContain("re_web_authz_state plan/run");
		expect(operationPlan.content[0]?.text).toContain(
			"re_verifier/re_compiler/re_replayer/re_autofix/re_proof_loop/re_knowledge_graph",
		);
		expect(operationPlan.content[0]?.text).toContain("steps:");
		expect(operationPlan.content[0]?.text).toContain("re_live_browser plan https://target.local/app");
		expect(operationPlan.content[0]?.text).toContain("re_web_authz_state plan https://target.local/app");
		expect(operationPlan.content[0]?.text).toContain("next_ready_step:");
		expect(operationPlan.content[0]?.text).toContain("next_operation_command:");
		const operationPlanPath = /operation_artifact: (.+)/.exec(operationPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(operationPlanPath).toBeDefined();
		expect(existsSync(operationPlanPath!)).toBe(true);
		expect(readFileSync(operationPlanPath!, "utf-8")).toContain("REPI Operation Artifact");

		const operationRun = await operationTool.execute("tool-call-id", {
			action: "run",
			target: "https://target.local/app",
			maxSteps: 2,
		});
		expect(operationRun.content[0]?.text).toContain("operation_queue:");
		expect(operationRun.content[0]?.text).toContain("phase_runner:");
		expect(operationRun.content[0]?.text).toContain("executed_steps: 2");
		expect(operationRun.content[0]?.text).toContain("live_browser:");
		expect(operationRun.content[0]?.text).toContain("web_authz_state:");
		expect(operationRun.content[0]?.text).toContain("next_operation_command:");
		const operationRunPath = /operation_artifact: (.+)/.exec(operationRun.content[0]?.text ?? "")?.[1]?.trim();
		expect(operationRunPath).toBeDefined();
		expect(existsSync(operationRunPath!)).toBe(true);
		expect(readFileSync(operationRunPath!, "utf-8")).toContain("REPI Operation Artifact");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain("operation-run");
		const missionAfterOperation = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterOperation.checkpoints.find((gate) => gate.name === "operation_queue_ready")?.status).toBe(
			"done",
		);

		const delegateTool = tools.get("re_delegate") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const delegatePlan = await delegateTool.execute("tool-call-id", {
			action: "plan",
			target: "https://target.local/app",
		});
		expect(delegatePlan.content[0]?.text).toContain("delegation_plan:");
		expect(delegatePlan.content[0]?.text).toContain("delegation_artifact:");
		expect(delegatePlan.content[0]?.text).toContain("worker_packets:");
		expect(delegatePlan.content[0]?.text).toContain("evidence_contract:");
		expect(delegatePlan.content[0]?.text).toContain("merge_queue:");
		expect(delegatePlan.content[0]?.text).toContain("specialist_coverage:");
		expect(delegatePlan.content[0]?.text).toContain("adaptive_routing_hints:");
		expect(delegatePlan.content[0]?.text).toContain("worker_promotion_queue:");
		expect(delegatePlan.content[0]?.text).toContain("next_delegate_command:");
		expect(delegatePlan.content[0]?.text).toContain("web-authz");
		const delegatePath = /delegation_artifact: (.+)/.exec(delegatePlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(delegatePath).toBeDefined();
		expect(existsSync(delegatePath!)).toBe(true);
		expect(readFileSync(delegatePath!, "utf-8")).toContain("REPI Delegation Artifact");
		expect(readFileSync(delegatePath!, "utf-8")).toContain("worker_packets:");
		const delegateMerge = await delegateTool.execute("tool-call-id", { action: "merge" });
		expect(delegateMerge.content[0]?.text).toContain("delegation_plan:");
		expect(delegateMerge.content[0]?.text).toContain("merge_summary:");
		expect(delegateMerge.content[0]?.text).toContain("next_delegate_command: re_complete audit");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain("delegation-merge");
		const missionAfterDelegation = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterDelegation.checkpoints.find((gate) => gate.name === "delegation_packets_ready")?.status).toBe(
			"done",
		);

		const swarmTool = tools.get("re_swarm") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const swarmPlan = await swarmTool.execute("tool-call-id", {
			action: "plan",
			target: "https://target.local/app",
		});
		expect(swarmPlan.content[0]?.text).toContain("swarm_plan:");
		expect(swarmPlan.content[0]?.text).toContain("swarm_artifact:");
		expect(swarmPlan.content[0]?.text).toContain("worker_runtime_packets:");
		expect(swarmPlan.content[0]?.text).toContain("parallel_groups:");
		expect(swarmPlan.content[0]?.text).toContain("merge_protocol:");
		expect(swarmPlan.content[0]?.text).toContain("collision_matrix:");
		expect(swarmPlan.content[0]?.text).toContain("execution_audit:");
		expect(swarmPlan.content[0]?.text).toContain("coverage_matrix:");
		expect(swarmPlan.content[0]?.text).toContain("retry_queue:");
		expect(swarmPlan.content[0]?.text).toContain("commander_next_actions:");
		expect(swarmPlan.content[0]?.text).toContain("next_swarm_command:");
		const swarmPath = /swarm_artifact: (.+)/.exec(swarmPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(swarmPath).toBeDefined();
		expect(existsSync(swarmPath!)).toBe(true);
		expect(readFileSync(swarmPath!, "utf-8")).toContain("REPI Swarm Artifact");
		const swarmRun = await swarmTool.execute("tool-call-id", {
			action: "run",
			target: "https://target.local/app",
			maxWorkers: 2,
			maxCommands: 1,
		});
		expect(swarmRun.content[0]?.text).toContain("swarm_plan:");
		expect(swarmRun.content[0]?.text).toContain("mode: run");
		expect(swarmRun.content[0]?.text).toContain("worker_executions:");
		expect(swarmRun.content[0]?.text).toContain("worker_results:");
		expect(swarmRun.content[0]?.text).toContain("merge_digest:");
		expect(swarmRun.content[0]?.text).toContain("execution_audit:");
		expect(swarmRun.content[0]?.text).toContain("coverage_matrix:");
		expect(swarmRun.content[0]?.text).toContain("retry_queue:");
		expect(swarmRun.content[0]?.text).toContain("memory_swarm_writeback:");
		expect(swarmRun.content[0]?.text).toContain("status=pass");
		expect(swarmRun.content[0]?.text).toContain("next_swarm_command: re_swarm merge");
		const swarmRunPath = /swarm_artifact: (.+)/.exec(swarmRun.content[0]?.text ?? "")?.[1]?.trim();
		expect(swarmRunPath).toBeDefined();
		expect(existsSync(swarmRunPath!)).toBe(true);
		expect(readFileSync(swarmRunPath!, "utf-8")).toContain("worker_executions:");
		expect(readFileSync(swarmRunPath!, "utf-8")).toContain("execution_audit:");
		expect(readFileSync(swarmRunPath!, "utf-8")).toContain("coverage_matrix:");
		expect(readFileSync(swarmRunPath!, "utf-8")).toContain("retry_queue:");
		expect(readFileSync(join(agentDir, "recon", "memory", "events.jsonl"), "utf-8")).toContain(
			"memory-swarm-writeback",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "store-report.json"), "utf-8")).toContain("MemoryStoreV5");
		expect(swarmRun.content[0]?.text).toContain("structured_claim_merge:");
		expect(swarmRun.content[0]?.text).toContain("status=blocked");
		const structuredClaimMergePath = swarmRunPath!.replace(/\.md$/i, "-structured-claim-merge.json");
		expect(existsSync(structuredClaimMergePath)).toBe(true);
		expect(readFileSync(structuredClaimMergePath, "utf-8")).toContain("StructuredClaimMergeV1");
		expect(readFileSync(structuredClaimMergePath, "utf-8")).toContain("strict_final_claim_promotion");
		expect(readFileSync(join(agentDir, "recon", "memory", "swarm-run-board.md"), "utf-8")).toContain(
			"Swarm Run Board",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "swarm-run-board.md"), "utf-8")).toContain(
			"Execution audit",
		);
		const swarmMerge = await swarmTool.execute("tool-call-id", { action: "merge" });
		expect(swarmMerge.content[0]?.text).toContain("swarm_plan:");
		expect(swarmMerge.content[0]?.text).toContain("coverage_matrix:");
		expect(swarmMerge.content[0]?.text).toContain("next_swarm_command: re_supervisor review");
		expect(readFileSync(join(agentDir, "recon", "memory", "swarm-board.md"), "utf-8")).toContain("Swarm Board");
		expect(readFileSync(join(agentDir, "recon", "memory", "swarm-board.md"), "utf-8")).toContain("Coverage matrix");
		const missionAfterSwarm = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterSwarm.checkpoints.find((gate) => gate.name === "swarm_plan_ready")?.status).toBe("done");

		const supervisorTool = tools.get("re_supervisor") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const supervisorReview = await supervisorTool.execute("tool-call-id", {
			action: "review",
			target: "https://target.local/app",
		});
		expect(supervisorReview.content[0]?.text).toContain("supervisor_review:");
		expect(supervisorReview.content[0]?.text).toContain("supervisor_artifact:");
		expect(supervisorReview.content[0]?.text).toContain("supervisor_verdict:");
		expect(supervisorReview.content[0]?.text).toContain("swarm_artifact:");
		expect(supervisorReview.content[0]?.text).toContain("worker_reviews:");
		expect(supervisorReview.content[0]?.text).toContain("conflict_matrix:");
		expect(supervisorReview.content[0]?.text).toContain("repair_queue:");
		expect(supervisorReview.content[0]?.text).toContain("commander_merge_queue:");
		expect(supervisorReview.content[0]?.text).toContain("commander_merge_budget:");
		expect(supervisorReview.content[0]?.text).toContain("worker_scoreboard:");
		expect(supervisorReview.content[0]?.text).toContain("priority_queue:");
		expect(supervisorReview.content[0]?.text).toContain("release_check_metadata:");
		expect(supervisorReview.content[0]?.text).toContain("strict_claim_check:");
		expect(supervisorReview.content[0]?.text).toContain("claim_check_result:");
		expect(supervisorReview.content[0]?.text).toContain("next_supervisor_command:");
		const supervisorPath = /supervisor_artifact: (.+)/.exec(supervisorReview.content[0]?.text ?? "")?.[1]?.trim();
		expect(supervisorPath).toBeDefined();
		expect(existsSync(supervisorPath!)).toBe(true);
		expect(readFileSync(supervisorPath!, "utf-8")).toContain("REPI Supervisor Artifact");
		expect(readFileSync(supervisorPath!, "utf-8")).toContain("worker_reviews:");
		expect(readFileSync(supervisorPath!, "utf-8")).toContain("commander_merge_queue:");
		expect(readFileSync(supervisorPath!, "utf-8")).toContain("commander_merge_budget:");
		expect(readFileSync(join(agentDir, "recon", "memory", "commander-merge-board.md"), "utf-8")).toContain(
			"Commander Merge Board",
		);
		const supervisorRepair = await supervisorTool.execute("tool-call-id", { action: "repair" });
		expect(supervisorRepair.content[0]?.text).toContain("supervisor_review:");
		expect(supervisorRepair.content[0]?.text).toContain("mode: repair");
		expect(supervisorRepair.content[0]?.text).toContain("repair_queue:");
		expect(readFileSync(join(agentDir, "recon", "evidence", "ledger.md"), "utf-8")).toContain("supervisor-repair");
		const missionAfterSupervisor = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterSupervisor.checkpoints.find((gate) => gate.name === "supervisor_review_ready")?.status).toBe(
			"blocked",
		);

		const reflectTool = tools.get("re_reflect") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const reflectPlan = await reflectTool.execute("tool-call-id", { action: "plan" });
		expect(reflectPlan.content[0]?.text).toContain("reflection_cycle:");
		expect(reflectPlan.content[0]?.text).toContain("reflection_artifact:");
		expect(reflectPlan.content[0]?.text).toContain("lessons:");
		expect(reflectPlan.content[0]?.text).toContain("failure_patterns:");
		expect(reflectPlan.content[0]?.text).toContain("reuse_rules:");
		expect(reflectPlan.content[0]?.text).toContain("repair_playbook:");
		expect(reflectPlan.content[0]?.text).toContain("next_reflect_command:");
		const reflectPlanPath = /reflection_artifact: (.+)/.exec(reflectPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(reflectPlanPath).toBeDefined();
		expect(existsSync(reflectPlanPath!)).toBe(true);
		expect(readFileSync(reflectPlanPath!, "utf-8")).toContain("REPI Reflection Artifact");

		const reflectWrite = await reflectTool.execute("tool-call-id", { action: "write" });
		expect(reflectWrite.content[0]?.text).toContain("reflection_cycle:");
		expect(reflectWrite.content[0]?.text).toContain("playbook_path:");
		expect(reflectWrite.content[0]?.text).toContain("field_journal_anchor:");
		expect(reflectWrite.content[0]?.text).toContain("evolution_anchor:");
		const reflectWritePath = /reflection_artifact: (.+)/.exec(reflectWrite.content[0]?.text ?? "")?.[1]?.trim();
		expect(reflectWritePath).toBeDefined();
		expect(existsSync(reflectWritePath!)).toBe(true);
		const reflectPlaybookPath = /playbook_path: (.+)/.exec(reflectWrite.content[0]?.text ?? "")?.[1]?.trim();
		expect(reflectPlaybookPath).toBeDefined();
		expect(existsSync(reflectPlaybookPath!)).toBe(true);
		expect(readFileSync(reflectPlaybookPath!, "utf-8")).toContain("REPI Reflection Playbook");
		expect(readFileSync(reflectPlaybookPath!, "utf-8")).toContain("Worker routing / promotion");
		expect(readFileSync(join(agentDir, "recon", "memory", "field-journal.md"), "utf-8")).toContain(
			"supervisor-reflection",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "evolution-log.md"), "utf-8")).toContain(
			"supervisor reflection",
		);
		const missionAfterReflect = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterReflect.checkpoints.find((gate) => gate.name === "reflection_memory_ready")?.status).toBe(
			"done",
		);

		const contextTool = tools.get("re_context") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const contextPack = await contextTool.execute("tool-call-id", {
			action: "pack",
			target: "https://target.local/app",
		});
		expect(contextPack.content[0]?.text).toContain("context_pack:");
		expect(contextPack.content[0]?.text).toContain("context_artifact:");
		expect(contextPack.content[0]?.text).toContain("resume_brief:");
		expect(contextPack.content[0]?.text).toContain("artifact_index:");
		expect(contextPack.content[0]?.text).toContain("repair_queue:");
		expect(contextPack.content[0]?.text).toContain("commander_merge_budget:");
		expect(contextPack.content[0]?.text).toContain("worker_scoreboard:");
		expect(contextPack.content[0]?.text).toContain("swarm_retry_queue:");
		expect(contextPack.content[0]?.text).toContain("swarm_retry_queue=");
		expect(contextPack.content[0]?.text).toContain("autonomous_execution_budget:");
		expect(contextPack.content[0]?.text).toContain("dispatcher_score_decay:");
		expect(contextPack.content[0]?.text).toContain("case_memory_lane_plan:");
		expect(contextPack.content[0]?.text).toContain("case_memory_next_commands:");
		expect(contextPack.content[0]?.text).toContain("reflection_reuse_rules:");
		expect(contextPack.content[0]?.text).toContain("next_operator_commands:");
		expect(contextPack.content[0]?.text).toContain("next_context_command:");
		const contextPackPath = /context_artifact: (.+)/.exec(contextPack.content[0]?.text ?? "")?.[1]?.trim();
		expect(contextPackPath).toBeDefined();
		expect(existsSync(contextPackPath!)).toBe(true);
		expect(readFileSync(contextPackPath!, "utf-8")).toContain("REPI Context Pack Artifact");
		expect(readFileSync(contextPackPath!, "utf-8")).toContain("## Mission snapshot");

		const contextResume = await contextTool.execute("tool-call-id", { action: "resume" });
		expect(contextResume.content[0]?.text).toContain("context_pack:");
		expect(contextResume.content[0]?.text).toContain("mode: resume");
		expect(contextResume.content[0]?.text).toContain("next_operator_commands:");
		const missionAfterContext = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterContext.checkpoints.find((gate) => gate.name === "context_pack_ready")?.status).toBe("done");

		const operatorTool = tools.get("re_operator") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const operatorPlan = await operatorTool.execute("tool-call-id", { action: "plan" });
		expect(operatorPlan.content[0]?.text).toContain("operator_queue:");
		expect(operatorPlan.content[0]?.text).toContain("operator_artifact:");
		expect(operatorPlan.content[0]?.text).toContain("dispatcher_policy:");
		expect(operatorPlan.content[0]?.text).toContain("commander_runtime_policy:");
		expect(operatorPlan.content[0]?.text).toContain("operator_feedback:");
		expect(operatorPlan.content[0]?.text).toContain("operator_feedback_queue:");
		expect(operatorPlan.content[0]?.text).toContain("dispatcher_fallback_plan:");
		expect(operatorPlan.content[0]?.text).toContain("dispatcher_feedback_scoreboard:");
		expect(operatorPlan.content[0]?.text).toContain("dispatcher_learning_hints:");
		expect(operatorPlan.content[0]?.text).toContain("autonomous_execution_budget:");
		expect(operatorPlan.content[0]?.text).toContain("dispatcher_score_decay:");
		expect(operatorPlan.content[0]?.text).toContain("high_score_promotions:");
		expect(operatorPlan.content[0]?.text).toContain("swarm_retry_queue=");
		expect(operatorPlan.content[0]?.text).toContain("case_memory_lane_plan:");
		expect(operatorPlan.content[0]?.text).toContain("case_memory_dispatch_report:");
		expect(operatorPlan.content[0]?.text).toContain("verification_matrix:");
		expect(operatorPlan.content[0]?.text).toContain("escalation_queue:");
		expect(operatorPlan.content[0]?.text).toContain("next_operator_command:");
		const operatorPlanPath = /operator_artifact: (.+)/.exec(operatorPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(operatorPlanPath).toBeDefined();
		expect(existsSync(operatorPlanPath!)).toBe(true);
		expect(readFileSync(operatorPlanPath!, "utf-8")).toContain("REPI Operator Artifact");

		const operatorDispatch = await operatorTool.execute("tool-call-id", { action: "dispatch", maxSteps: 1 });
		expect(operatorDispatch.content[0]?.text).toContain("operator_queue:");
		expect(operatorDispatch.content[0]?.text).toContain("mode: dispatch");
		expect(operatorDispatch.content[0]?.text).toContain("executed_steps: 1");
		expect(operatorDispatch.content[0]?.text).toContain("commander_dispatch_report:");
		const operatorVerify = await operatorTool.execute("tool-call-id", { action: "verify" });
		expect(operatorVerify.content[0]?.text).toContain("mode: verify");
		expect(operatorVerify.content[0]?.text).toContain("verification_matrix:");
		const missionAfterOperator = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterOperator.checkpoints.find((gate) => gate.name === "operator_queue_ready")?.status).toBe(
			"done",
		);

		const verifierTool = tools.get("re_verifier") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const verifierCheck = await verifierTool.execute("tool-call-id", { action: "check" });
		expect(verifierCheck.content[0]?.text).toContain("verifier_matrix:");
		expect(verifierCheck.content[0]?.text).toContain("verifier_artifact:");
		expect(verifierCheck.content[0]?.text).toContain("operator_feedback:");
		expect(verifierCheck.content[0]?.text).toContain("category=swarm_retry_queue");
		expect(verifierCheck.content[0]?.text).toContain("assertions:");
		expect(verifierCheck.content[0]?.text).toContain("evidence_bindings:");
		expect(verifierCheck.content[0]?.text).toContain("counter_evidence:");
		expect(verifierCheck.content[0]?.text).toContain("contradictions:");
		expect(verifierCheck.content[0]?.text).toContain("next_verifier_command:");
		const verifierPath = /verifier_artifact: (.+)/.exec(verifierCheck.content[0]?.text ?? "")?.[1]?.trim();
		expect(verifierPath).toBeDefined();
		expect(existsSync(verifierPath!)).toBe(true);
		expect(readFileSync(verifierPath!, "utf-8")).toContain("REPI Verifier Artifact");

		const verifierMatrix = await verifierTool.execute("tool-call-id", { action: "matrix" });
		expect(verifierMatrix.content[0]?.text).toContain("mode: matrix");
		expect(verifierMatrix.content[0]?.text).toContain("gaps:");
		const missionAfterVerifier = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterVerifier.checkpoints.find((gate) => gate.name === "verifier_matrix_ready")?.status).toBe(
			"done",
		);

		const compilerTool = tools.get("re_compiler") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const compilerDraft = await compilerTool.execute("tool-call-id", { action: "draft" });
		expect(compilerDraft.content[0]?.text).toContain("compiler_report:");
		expect(compilerDraft.content[0]?.text).toContain("compiler_artifact:");
		expect(compilerDraft.content[0]?.text).toContain("operator_feedback:");
		expect(compilerDraft.content[0]?.text).toContain("category=swarm_retry_queue");
		expect(compilerDraft.content[0]?.text).toContain("supervisor_artifact:");
		expect(compilerDraft.content[0]?.text).toContain("release_check_metadata:");
		expect(compilerDraft.content[0]?.text).toContain("strict_claim_check:");
		expect(compilerDraft.content[0]?.text).toContain("claim_check_result:");
		expect(compilerDraft.content[0]?.text).toContain("structured_claim_merge_check:");
		expect(compilerDraft.content[0]?.text).toContain("status=blocked");
		expect(compilerDraft.content[0]?.text).toContain("structured claim merge error:");
		expect(compilerDraft.content[0]?.text).toContain("key_evidence_block:");
		expect(compilerDraft.content[0]?.text).toContain("repro_commands:");
		expect(compilerDraft.content[0]?.text).toContain("contradictions:");
		expect(compilerDraft.content[0]?.text).toContain("next_operator_queue:");
		expect(compilerDraft.content[0]?.text).toContain("next_compiler_command:");
		const compilerPath = /compiler_artifact: (.+)/.exec(compilerDraft.content[0]?.text ?? "")?.[1]?.trim();
		expect(compilerPath).toBeDefined();
		expect(existsSync(compilerPath!)).toBe(true);
		expect(readFileSync(compilerPath!, "utf-8")).toContain("REPI Compiler Artifact");
		const missionAfterCompiler = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterCompiler.checkpoints.find((gate) => gate.name === "compiler_ready")?.status).toBe("done");

		const replayerTool = tools.get("re_replayer") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const replayPlan = await replayerTool.execute("tool-call-id", { action: "plan" });
		expect(replayPlan.content[0]?.text).toContain("replay_matrix:");
		expect(replayPlan.content[0]?.text).toContain("replay_artifact:");
		expect(replayPlan.content[0]?.text).toContain("compiler_artifact:");
		expect(replayPlan.content[0]?.text).toContain("operator_feedback:");
		expect(replayPlan.content[0]?.text).toContain("category=swarm_retry_queue");
		expect(replayPlan.content[0]?.text).toContain("steps:");
		expect(replayPlan.content[0]?.text).toContain("replay_matrix_rows:");
		expect(replayPlan.content[0]?.text).toContain("next_replay_command:");
		const replayPlanPath = /replay_artifact: (.+)/.exec(replayPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(replayPlanPath).toBeDefined();
		expect(existsSync(replayPlanPath!)).toBe(true);
		expect(readFileSync(replayPlanPath!, "utf-8")).toContain("REPI Replayer Artifact");

		const replayRun = await replayerTool.execute("tool-call-id", { action: "run", maxSteps: 2 });
		expect(replayRun.content[0]?.text).toContain("replay_matrix:");
		expect(replayRun.content[0]?.text).toContain("mode: run");
		expect(replayRun.content[0]?.text).toContain("executed_steps:");
		expect(replayRun.content[0]?.text).toContain("stdout_sha256=");
		expect(replayRun.content[0]?.text).toContain("next_replay_actions:");
		const replayRunPath = /replay_artifact: (.+)/.exec(replayRun.content[0]?.text ?? "")?.[1]?.trim();
		expect(replayRunPath).toBeDefined();
		expect(existsSync(replayRunPath!)).toBe(true);
		expect(readFileSync(replayRunPath!, "utf-8")).toContain("REPI Replayer Artifact");
		const missionAfterReplay = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterReplay.checkpoints.find((gate) => gate.name === "replay_ready")?.status).toBe("done");

		const autofixTool = tools.get("re_autofix") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const autofixPlan = await autofixTool.execute("tool-call-id", { action: "plan" });
		expect(autofixPlan.content[0]?.text).toContain("autofix_plan:");
		expect(autofixPlan.content[0]?.text).toContain("autofix_artifact:");
		expect(autofixPlan.content[0]?.text).toContain("operator_feedback:");
		expect(autofixPlan.content[0]?.text).toContain("category=swarm_retry_queue");
		expect(autofixPlan.content[0]?.text).toContain("patch_queue:");
		expect(autofixPlan.content[0]?.text).toContain("command_substitutions:");
		expect(autofixPlan.content[0]?.text).toContain("bootstrap_queue:");
		expect(autofixPlan.content[0]?.text).toContain("evidence_recapture_queue:");
		expect(autofixPlan.content[0]?.text).toContain("next_operator_queue:");
		expect(autofixPlan.content[0]?.text).toContain("next_autofix_command:");
		const autofixPath = /autofix_artifact: (.+)/.exec(autofixPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(autofixPath).toBeDefined();
		expect(existsSync(autofixPath!)).toBe(true);
		expect(readFileSync(autofixPath!, "utf-8")).toContain("REPI Autofix Artifact");
		const missionAfterAutofix = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterAutofix.checkpoints.find((gate) => gate.name === "autofix_ready")?.status).toBe("done");

		const feedbackChainCompose = await chainTool.execute("tool-call-id", {
			action: "compose",
			target: "https://target.local/app",
		});
		expect(feedbackChainCompose.content[0]?.text).toContain("operator_feedback:");
		expect(feedbackChainCompose.content[0]?.text).toContain("operator_feedback_queue:");
		expect(feedbackChainCompose.content[0]?.text).toContain("category=swarm_retry_queue");
		expect(feedbackChainCompose.content[0]?.text).toContain("re_swarm run");

		const feedbackOperatorPlan = await operatorTool.execute("tool-call-id", {
			action: "plan",
			target: "https://target.local/app",
		});
		expect(feedbackOperatorPlan.content[0]?.text).toContain("operator_feedback:");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("operator_feedback_queue:");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("dispatcher_fallback_plan:");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("dispatcher_feedback_scoreboard:");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("dispatcher_learning_hints:");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("autonomous_execution_budget:");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("dispatcher_score_decay:");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("score_decay dispatcher");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("dispatcher_feedback_priority");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("dispatcher_score");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("retry_dispatcher");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("category=swarm_retry_queue");
		expect(feedbackOperatorPlan.content[0]?.text).toContain("operator_feedback_queue=");
		expect(readFileSync(join(agentDir, "recon", "memory", "dispatcher-feedback-board.md"), "utf-8")).toContain(
			"Dispatcher Feedback Board",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "dispatcher-feedback-board.md"), "utf-8")).toContain(
			"Autonomous execution budget",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "dispatcher-promotion-playbook.md"), "utf-8")).toContain(
			"Dispatcher Promotion Playbook",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "dispatcher-promotion-playbook.md"), "utf-8")).toContain(
			"Historical score decay",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "dispatcher-promotion-playbook.md"), "utf-8")).toContain(
			"Ledger:",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "autonomous-budget-ledger.md"), "utf-8")).toContain(
			"Autonomous Budget Ledger",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "autonomous-budget-ledger.md"), "utf-8")).toContain(
			"budget=max_turns",
		);
		const dispatcherDelegatePlan = await delegateTool.execute("tool-call-id", {
			action: "plan",
			target: "https://target.local/app",
		});
		expect(dispatcherDelegatePlan.content[0]?.text).toContain("adaptive_routing_hints:");
		expect(dispatcherDelegatePlan.content[0]?.text).toContain("autonomous_execution_budget:");
		expect(dispatcherDelegatePlan.content[0]?.text).toContain("dispatcher");

		const proofLoopTool = tools.get("re_proof_loop") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const proofLoopPlan = await proofLoopTool.execute("tool-call-id", {
			action: "plan",
			target: "./license",
			maxSteps: 4,
			replaySteps: 1,
		});
		expect(proofLoopPlan.content[0]?.text).toContain("proof_loop:");
		expect(proofLoopPlan.content[0]?.text).toContain("proof_loop_artifact:");
		expect(proofLoopPlan.content[0]?.text).toContain("verdict:");
		expect(proofLoopPlan.content[0]?.text).toContain("case_memory_lane_plan:");
		expect(proofLoopPlan.content[0]?.text).toContain("case_memory_bridge:");
		expect(proofLoopPlan.content[0]?.text).toContain("operator_feedback:");
		expect(proofLoopPlan.content[0]?.text).toContain("operator_feedback_queue:");
		expect(proofLoopPlan.content[0]?.text).toContain("category=swarm_retry_queue");
		expect(proofLoopPlan.content[0]?.text).toContain("operator-feedback");
		expect(proofLoopPlan.content[0]?.text).toContain("swarm_retry_queue:");
		expect(proofLoopPlan.content[0]?.text).toContain("specialist_queue:");
		expect(proofLoopPlan.content[0]?.text).toContain("swarm_bridge:");
		expect(proofLoopPlan.content[0]?.text).toContain("autonomous_execution_budget:");
		expect(proofLoopPlan.content[0]?.text).toContain("dispatcher_score_decay:");
		expect(proofLoopPlan.content[0]?.text).toContain("re_delegate plan");
		expect(proofLoopPlan.content[0]?.text).toContain("next_proof_command:");
		const proofLoopPlanPath = /proof_loop_artifact: (.+)/.exec(proofLoopPlan.content[0]?.text ?? "")?.[1]?.trim();
		expect(proofLoopPlanPath).toBeDefined();
		expect(existsSync(proofLoopPlanPath!)).toBe(true);
		expect(readFileSync(proofLoopPlanPath!, "utf-8")).toContain("REPI Proof Loop Artifact");
		expect(readFileSync(proofLoopPlanPath!, "utf-8")).toContain("specialist_queue:");

		const proofLoopRun = await proofLoopTool.execute("tool-call-id", {
			action: "run",
			target: "./license",
			maxSteps: 6,
			replaySteps: 1,
		});
		expect(proofLoopRun.content[0]?.text).toContain("proof_loop:");
		expect(proofLoopRun.content[0]?.text).toContain("mode: run");
		expect(proofLoopRun.content[0]?.text).toContain("executed_steps:");
		expect(proofLoopRun.content[0]?.text).toContain("evidence_summary:");
		expect(proofLoopRun.content[0]?.text).toContain("case_memory_lane_plan:");
		expect(proofLoopRun.content[0]?.text).toContain("case_memory_bridge:");
		expect(proofLoopRun.content[0]?.text).toContain("operator_feedback:");
		expect(proofLoopRun.content[0]?.text).toContain("operator_feedback_queue:");
		expect(proofLoopRun.content[0]?.text).toContain("operator_feedback: rows=");
		expect(proofLoopRun.content[0]?.text).toContain("operator-feedback");
		expect(proofLoopRun.content[0]?.text).toContain("swarm_retry_queue:");
		expect(proofLoopRun.content[0]?.text).toContain("specialist_queue:");
		expect(proofLoopRun.content[0]?.text).toContain("swarm_bridge:");
		expect(proofLoopRun.content[0]?.text).toContain("autonomous_execution_budget:");
		expect(proofLoopRun.content[0]?.text).toContain("dispatcher_score_decay:");
		expect(proofLoopRun.content[0]?.text).toContain("proof:bridge:");
		expect(proofLoopRun.content[0]?.text).toContain("re_swarm run");
		expect(proofLoopRun.content[0]?.text).toContain("re_swarm merge");
		expect(proofLoopRun.content[0]?.text).toContain("next_proof_actions:");
		const proofLoopRunPath = /proof_loop_artifact: (.+)/.exec(proofLoopRun.content[0]?.text ?? "")?.[1]?.trim();
		expect(proofLoopRunPath).toBeDefined();
		expect(existsSync(proofLoopRunPath!)).toBe(true);
		expect(readFileSync(proofLoopRunPath!, "utf-8")).toContain("REPI Proof Loop Artifact");
		expect(readFileSync(proofLoopRunPath!, "utf-8")).toContain("swarm_bridge:");
		const missionAfterProofLoop = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterProofLoop.checkpoints.find((gate) => gate.name === "proof_loop_ready")?.status).toBe("done");
		const runtimeFailureLedger = join(agentDir, "recon", "evidence", "failures", "ledger.jsonl");
		const runtimeRepairQueue = join(agentDir, "recon", "evidence", "repairs", "queue.jsonl");
		expect(existsSync(runtimeFailureLedger)).toBe(true);
		expect(existsSync(runtimeRepairQueue)).toBe(true);
		expect(readFileSync(runtimeFailureLedger, "utf-8")).toMatch(
			/"source":"re_(?:replayer|autofix|operator|proof_loop)"/,
		);
		expect(readFileSync(runtimeFailureLedger, "utf-8")).toContain('"retryBudget"');
		expect(readFileSync(runtimeRepairQueue, "utf-8")).toContain('"repairAction"');

		const knowledgeTool = tools.get("re_knowledge_graph") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const knowledgeGraph = await knowledgeTool.execute("tool-call-id", { action: "build" });
		expect(knowledgeGraph.content[0]?.text).toContain("knowledge_graph:");
		expect(knowledgeGraph.content[0]?.text).toContain("knowledge_artifact:");
		expect(knowledgeGraph.content[0]?.text).toContain("case_signatures:");
		expect(knowledgeGraph.content[0]?.text).toContain("artifact_nodes:");
		expect(knowledgeGraph.content[0]?.text).toContain("high_value_edges:");
		expect(knowledgeGraph.content[0]?.text).toContain("similarity_index:");
		expect(knowledgeGraph.content[0]?.text).toContain("worker_routing_hints:");
		expect(knowledgeGraph.content[0]?.text).toContain("worker_scoreboard:");
		expect(knowledgeGraph.content[0]?.text).toContain("adaptive_routing_hints:");
		expect(knowledgeGraph.content[0]?.text).toContain("worker_promotion_queue:");
		expect(knowledgeGraph.content[0]?.text).toContain("command_strategy_hints:");
		expect(knowledgeGraph.content[0]?.text).toContain("dispatcher_feedback_scoreboard:");
		expect(knowledgeGraph.content[0]?.text).toContain("dispatcher_routing_hints:");
		expect(knowledgeGraph.content[0]?.text).toContain("autonomous_execution_budget:");
		expect(knowledgeGraph.content[0]?.text).toContain("dispatcher_score_decay:");
		expect(knowledgeGraph.content[0]?.text).toContain("high_score_promotions:");
		expect(knowledgeGraph.content[0]?.text).toContain("dispatcher_score");
		expect(knowledgeGraph.content[0]?.text).toContain("next_knowledge_command:");
		const knowledgePath = /knowledge_artifact: (.+)/.exec(knowledgeGraph.content[0]?.text ?? "")?.[1]?.trim();
		expect(knowledgePath).toBeDefined();
		expect(existsSync(knowledgePath!)).toBe(true);
		expect(readFileSync(knowledgePath!, "utf-8")).toContain("REPI Knowledge Graph Artifact");
		expect(readFileSync(join(agentDir, "recon", "memory", "knowledge-graph-index.md"), "utf-8")).toContain(
			"Knowledge Graph Index",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "knowledge-graph-index.md"), "utf-8")).toContain(
			"Adaptive routing hints",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "knowledge-graph-index.md"), "utf-8")).toContain(
			"Dispatcher feedback scoreboard",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "knowledge-graph-index.md"), "utf-8")).toContain(
			"Autonomous execution budget",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "knowledge-graph-index.md"), "utf-8")).toContain(
			"Dispatcher score decay",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "knowledge-graph-index.md"), "utf-8")).toContain(
			"High-score promotions",
		);
		expect(readFileSync(join(agentDir, "recon", "memory", "dispatcher-promotion-playbook.md"), "utf-8")).toContain(
			"Score decay",
		);
		const profileCheckTool = tools.get("re_profile_check") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const profileCheck = await profileCheckTool.execute("tool-call-id", { action: "full" });
		expect(profileCheck.content[0]?.text).toContain("profile_check:");
		expect(profileCheck.content[0]?.text).toContain("profile_check_artifact:");
		expect(profileCheck.content[0]?.text).toContain("verdict:");
		expect(profileCheck.content[0]?.text).toContain("install_readiness:");
		expect(profileCheck.content[0]?.text).toContain("reverse_capability_guards:");
		expect(profileCheck.content[0]?.text).toContain("regression_guards:");
		expect(profileCheck.content[0]?.text).toContain("compact_resume_case_memory");
		expect(profileCheck.content[0]?.text).toContain("re_native_runtime");
		const profileCheckPath = /profile_check_artifact: (.+)/.exec(profileCheck.content[0]?.text ?? "")?.[1]?.trim();
		expect(profileCheckPath).toBeDefined();
		expect(existsSync(profileCheckPath!)).toBe(true);
		expect(readFileSync(profileCheckPath!, "utf-8")).toContain("REPI Profile Check Artifact");

		const migratedLanePlan = await laneTool.execute("tool-call-id", {
			action: "plan",
			lane: "control-flow",
			target: "./license",
		});
		expect(migratedLanePlan.content[0]?.text).toContain("case_memory_migrations:");
		expect(migratedLanePlan.content[0]?.text).toContain("case_memory_migration:");
		expect(migratedLanePlan.content[0]?.text).toContain("dispatcher-feedback");
		const migratedAutopilotPlan = await autopilotTool.execute("tool-call-id", {
			action: "plan",
			lane: "control-flow",
			target: "./license",
		});
		expect(migratedAutopilotPlan.content[0]?.text).toContain("case_memory_lane_plan:");
		expect(migratedAutopilotPlan.content[0]?.text).toMatch(/action: (reprioritized|added|skipped)/);
		const missionAfterKnowledge = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { checkpoints: Array<{ name: string; status: string }> };
		expect(missionAfterKnowledge.checkpoints.find((gate) => gate.name === "knowledge_graph_ready")?.status).toBe(
			"done",
		);

		const completeTool = tools.get("re_complete") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const completionAudit = await completeTool.execute("tool-call-id", { action: "audit" });
		expect(completionAudit.content[0]?.text).toContain("completion_status:");
		expect(completionAudit.content[0]?.text).toContain("pending check:");

		const memoryTool = tools.get("re_memory") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const playbookMaintenance = await memoryTool.execute("tool-call-id", { action: "playbooks" });
		const playbookIndexPath = join(agentDir, "recon", "memory", "playbooks", "index.md");
		expect(playbookMaintenance.content[0]?.text).toContain("Playbook Maintenance");
		expect(playbookMaintenance.content[0]?.text).toContain("active:");
		expect(existsSync(playbookIndexPath)).toBe(true);
		expect(readFileSync(playbookIndexPath, "utf-8")).toContain("Quality");
		expect(readFileSync(playbookIndexPath, "utf-8")).toContain("Policy:");
		expect(readFileSync(playbookIndexPath, "utf-8")).toContain("dispatcher-promotion");

		const playbookPrune = await memoryTool.execute("tool-call-id", { action: "prune-playbooks" });
		expect(playbookPrune.content[0]?.text).toContain("Playbook Maintenance");
		expect(readFileSync(playbookIndexPath, "utf-8")).toContain("archive=true");

		const evolutionResult = await memoryTool.execute("tool-call-id", {
			action: "evolve",
			title: "test evolution",
			text: "prefer runtime evidence over stale source",
		});
		expect(evolutionResult.content[0]?.text).toContain("Appended evolution entry");
		expect(readFileSync(join(agentDir, "recon", "memory", "evolution-log.md"), "utf-8")).toContain(
			"runtime evidence",
		);

		expect(handlers.has("before_agent_start")).toBe(true);
		expect(handlers.has("tool_call")).toBe(true);
		expect(handlers.has("session_before_compact")).toBe(true);

		const beforeAgentStart = handlers.get("before_agent_start")?.[0] as (
			event: Record<string, unknown>,
			ctx: Record<string, unknown>,
		) => Promise<{ systemPrompt?: string } | undefined>;
		const injected = await beforeAgentStart(
			{
				type: "before_agent_start",
				prompt: "分析这个 ELF 的许可证校验逻辑",
				systemPrompt: "base-system",
				systemPromptOptions: {},
			},
			{ hasUI: false },
		);
		expect(injected?.systemPrompt).toContain("Mission blackboard:");
		expect(injected?.systemPrompt).toContain("Execution kernel:");
		expect(injected?.systemPrompt).toContain("execution_kernel:");
		expect(injected?.systemPrompt).toContain("Decision core:");
		expect(injected?.systemPrompt).toContain("decision_core:");
		expect(injected?.systemPrompt).toContain("Evidence ledger tail:");
		expect(injected?.systemPrompt).toContain("Context/resume pack:");
		expect(injected?.systemPrompt).toContain("Completion checkpoint audit:");
		expect(readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8")).toContain("Native reverse");
	}, 240_000);
});
