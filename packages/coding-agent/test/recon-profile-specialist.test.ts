import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ExtensionAPI } from "../src/core/extensions/types.ts";
import { createReconExtensionFactory } from "../src/core/recon-profile.ts";

const ENV_AGENT_DIR = "REPI_CODING_AGENT_DIR";
const ENV_BRANCH_ID = "REPI_BRANCH_ID";

describe("REPI kernel profile self-heal and specialist routing", () => {
	let tempDir: string;
	let agentDir: string;
	let previousAgentDir: string | undefined;
	let previousBranchId: string | undefined;

	beforeEach(() => {
		tempDir = join(tmpdir(), `repi-profile-specialist-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

	it("turns tool/runtime failures into repair matrix follow-ups", async () => {
		const tools = new Map<string, unknown>();
		const execCalls: Array<{ command: string; args: string[] }> = [];
		const fakePi = {
			registerCommand() {},
			registerTool(tool: { name: string }) {
				tools.set(tool.name, tool);
			},
			on() {},
			appendEntry() {},
			getSessionName: () => undefined,
			setSessionName() {},
			sendMessage() {},
			exec: async (command: string, args: string[]) => {
				execCalls.push({ command, args });
				return {
					code: 127,
					stdout: "",
					stderr: [
						"bash: line 2: r2: command not found",
						"ModuleNotFoundError: No module named 'pwn'",
						"./missing-target: No such file or directory",
					].join("\n"),
					killed: false,
				};
			},
		} as unknown as ExtensionAPI;

		createReconExtensionFactory()(fakePi);

		const missionTool = tools.get("re_mission") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		await missionTool.execute("tool-call-id", { action: "new", task: "pwn ELF exploit primitive" });

		const laneTool = tools.get("re_lane") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const repairRun = await laneTool.execute("tool-call-id", {
			action: "run",
			lane: "primitive",
			target: "./vuln",
		});

		expect(execCalls).toHaveLength(1);
		const textOut = repairRun.content[0]?.text ?? "";
		expect(textOut).toContain("tool repair anchors");
		expect(textOut).toContain("tool repair missing dependency anchors");
		expect(textOut).toContain("tool-repair-matrix-scaffold");
		expect(textOut).toContain("tool-repair-rerun");
		expect(textOut).toContain("heal-tool-repair-matrix");
		expect(textOut).toContain("evidence_quality:");
		const artifactPath = /evidence_artifact: (.+)/.exec(textOut)?.[1]?.trim();
		expect(artifactPath).toBeDefined();
		const artifact = readFileSync(artifactPath!, "utf-8");
		expect(artifact).toContain("tool repair anchors");
		expect(artifact).toContain("tool-repair-matrix-scaffold");

		const missionAfterRepair = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as { lanes: Array<{ name: string; next: string[] }> };
		const primitiveLane = missionAfterRepair.lanes.find((lane) => lane.name === "primitive");
		expect(primitiveLane?.next.join("\n")).toContain("[auto:tool-repair-matrix-scaffold]");
	});

	it("escalates stalled adaptive self-heal into a multi-lane evidence repair plan", async () => {
		const tools = new Map<string, unknown>();
		const execCalls: Array<{ command: string; args: string[] }> = [];
		const fakePi = {
			registerCommand() {},
			registerTool(tool: { name: string }) {
				tools.set(tool.name, tool);
			},
			on() {},
			appendEntry() {},
			getSessionName: () => undefined,
			setSessionName() {},
			sendMessage() {},
			exec: async (command: string, args: string[]) => {
				execCalls.push({ command, args });
				return { code: 0, stdout: "ok\n", stderr: "", killed: false };
			},
		} as unknown as ExtensionAPI;

		createReconExtensionFactory()(fakePi);

		const missionTool = tools.get("re_mission") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		await missionTool.execute("tool-call-id", { action: "new", task: "分析 ELF 许可证校验" });

		const laneTool = tools.get("re_lane") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		await laneTool.execute("tool-call-id", {
			action: "run",
			lane: "control-flow",
			target: "./license",
		});

		const adaptiveAuto = await laneTool.execute("tool-call-id", {
			action: "run-auto",
			lane: "control-flow",
			target: "./license",
			max: 2,
		});

		expect(execCalls).toHaveLength(3);
		expect(adaptiveAuto.content[0]?.text).toContain("run_auto_summary:");
		expect(adaptiveAuto.content[0]?.text).toContain("steps_executed: 2");
		expect(adaptiveAuto.content[0]?.text).toContain("adaptive_decisions: 2");
		expect(adaptiveAuto.content[0]?.text).toContain("multi_lane_plan:");
		expect(adaptiveAuto.content[0]?.text).toContain("lane: evidence-repair");
		expect(adaptiveAuto.content[0]?.text).toContain("reason: partial_evidence_self_heal:control-flow");
		expect(adaptiveAuto.content[0]?.text).toContain(
			"stop_reason: multi_lane_plan:evidence-repair:partial_evidence_self_heal:control-flow",
		);
		expect(adaptiveAuto.content[0]?.text).toContain("[auto:repair-target-baseline]");

		const missionAfterPlanner = JSON.parse(
			readFileSync(join(agentDir, "recon", "mission", "current.json"), "utf-8"),
		) as {
			lanes: Array<{ name: string; status?: string; note?: string; next: string[] }>;
		};
		const controlFlowLane = missionAfterPlanner.lanes.find((lane) => lane.name === "control-flow");
		const repairLane = missionAfterPlanner.lanes.find((lane) => lane.name === "evidence-repair");
		expect(controlFlowLane?.status).toBe("pending");
		expect(controlFlowLane?.note).toContain("adaptive_handoff=evidence-repair");
		expect(repairLane?.status).toBe("in_progress");
		expect(repairLane?.note).toContain("adaptive_from=control-flow");
		expect(repairLane?.next.join("\n")).toContain("[auto:repair-target-baseline]");
		expect(repairLane?.next.join("\n")).toContain("[auto:repair-signal-sweep]");
	});

	it("closes tool-bootstrap lanes by refreshing tool-index and resuming the blocked source lane", async () => {
		const tools = new Map<string, unknown>();
		const execCalls: Array<{ command: string; args: string[] }> = [];
		const fakePi = {
			registerCommand() {},
			registerTool(tool: { name: string }) {
				tools.set(tool.name, tool);
			},
			on() {},
			appendEntry() {},
			getSessionName: () => undefined,
			setSessionName() {},
			sendMessage() {},
			exec: async (command: string, args: string[]) => {
				execCalls.push({ command, args });
				if (args.join("\n").includes("for t in")) {
					return {
						code: 0,
						stdout: [
							"| file | yes | /usr/bin/file | file |",
							"| sha256sum | yes | /usr/bin/sha256sum | sha256sum |",
							"| rg | yes | /usr/bin/rg | ripgrep |",
							"| python3 | yes | /usr/bin/python3 | Python |",
							"",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				return { code: 0, stdout: "strcmp\n", stderr: "", killed: false };
			},
		} as unknown as ExtensionAPI;

		createReconExtensionFactory()(fakePi);

		const missionTool = tools.get("re_mission") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		await missionTool.execute("tool-call-id", { action: "new", task: "分析 ELF 许可证校验" });
		const missionPath = join(agentDir, "recon", "mission", "current.json");
		const mission = JSON.parse(readFileSync(missionPath, "utf-8")) as {
			lanes: Array<{ name: string; objective: string; status?: string; note?: string; next: string[] }>;
		};
		const lanes = mission.lanes.map((lane) => {
			if (lane.name === "control-flow") {
				return {
					...lane,
					status: "blocked",
					note: "waiting for tool-bootstrap",
					next: ["[auto:post-bootstrap-signal] printf 'strcmp\\n' # evidence: resume after tool-index refresh"],
				};
			}
			return { ...lane, status: lane.name === "triage" ? "done" : "pending" };
		});
		lanes.splice(2, 0, {
			name: "tool-bootstrap",
			objective: "补齐缺失工具或确认可用替代路径，再回到被阻塞 lane",
			status: "in_progress",
			note: "adaptive_from=control-flow; reason=tool_strategy_tool-index-missing:control-flow",
			next: ["re_bootstrap plan file"],
		});
		writeFileSync(missionPath, `${JSON.stringify({ ...mission, lanes }, null, 2)}\n`, "utf-8");

		const laneTool = tools.get("re_lane") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const auto = await laneTool.execute("tool-call-id", {
			action: "run-auto",
			lane: "tool-bootstrap",
			target: "./license",
			max: 2,
		});

		expect(execCalls).toHaveLength(2);
		expect(auto.content[0]?.text).toContain("tool_bootstrap_closure:");
		expect(auto.content[0]?.text).toContain("missing_after_refresh: none");
		expect(auto.content[0]?.text).toContain("resumed_lane: control-flow");
		expect(auto.content[0]?.text).toContain("reason: tool_bootstrap_closed:control-flow");
		expect(auto.content[0]?.text).toContain("## run-auto step 2: control-flow");
		expect(auto.content[0]?.text).toContain("auto_lane_update: control-flow -> runtime-proof");

		const missionAfterClosure = JSON.parse(readFileSync(missionPath, "utf-8")) as {
			lanes: Array<{ name: string; status?: string; note?: string }>;
			checkpoints: Array<{ name: string; status: string; note?: string }>;
		};
		expect(missionAfterClosure.lanes.find((lane) => lane.name === "tool-bootstrap")?.status).toBe("done");
		expect(missionAfterClosure.lanes.find((lane) => lane.name === "control-flow")?.status).toBe("done");
		expect(missionAfterClosure.lanes.find((lane) => lane.name === "runtime-proof")?.status).toBe("in_progress");
		expect(missionAfterClosure.checkpoints.find((gate) => gate.name === "tool_index_checked")?.status).toBe("done");
		expect(readFileSync(join(agentDir, "recon", "tools", "tool-index.md"), "utf-8")).toContain(
			"| file | yes | /usr/bin/file | file |",
		);
	});

	it("plans specialist runtime command packs for top reverse and pentest lanes", async () => {
		const tools = new Map<string, unknown>();
		const fakePi = {
			registerCommand() {},
			registerTool(tool: { name: string }) {
				tools.set(tool.name, tool);
			},
			on() {},
			appendEntry() {},
			getSessionName: () => undefined,
			setSessionName() {},
			sendMessage() {},
			exec: async () => ({ code: 0, stdout: "", stderr: "", killed: false }),
		} as unknown as ExtensionAPI;

		createReconExtensionFactory()(fakePi);

		const missionTool = tools.get("re_mission") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const laneTool = tools.get("re_lane") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const planFor = async (task: string, lane: string, target: string) => {
			await missionTool.execute("tool-call-id", { action: "new", task });
			const result = await laneTool.execute("tool-call-id", { action: "plan", lane, target });
			return result.content[0]?.text ?? "";
		};

		const webPlan = await planFor("Web API JWT auth websocket replay", "surface", "https://target.local/app");
		expect(webPlan).toContain("route: Web / API pentest");
		expect(webPlan).toContain("specialist_runtime_planner: browser/XHR/WS");
		expect(webPlan).toContain("browser-xhr-ws-capture-scaffold");
		expect(webPlan).toContain("localStorage");
		expect(webPlan).toContain("websocket");
		expect(webPlan).toContain("browser-xhr-ws-auth-diff-scaffold");
		expect(webPlan).toContain("browser-cdp-artifact-scaffold");
		expect(webPlan).toContain("browser-replay-evaluator-scaffold");
		expect(webPlan).toContain("browser-route-graph-scaffold");
		expect(webPlan).toContain("browser-auth-matrix-scaffold");
		expect(webPlan).toContain("browser-idor-bola-probe-scaffold");
		expect(webPlan).toContain("browser-authz-state-machine-scaffold");
		expect(webPlan).toContain("browser-authz-sequence-replay-scaffold");
		expect(webPlan).toContain("browser-authz-object-ownership-scaffold");
		expect(webPlan).toContain("browser-authz-state-rollback-scaffold");
		expect(webPlan).toContain("web-api-authz-static-scaffold");
		expect(webPlan).toContain("web-api-schema-diff-scaffold");
		expect(webPlan).toContain("web-api-state-source-scaffold");
		expect(webPlan).toContain("/tmp/repi-browser-artifact.json");

		const webScanPlan = await planFor("nuclei ffuf katana web 漏洞扫描", "scope", "https://target.local");
		expect(webScanPlan).toContain("route: Web pentest scanning");
		expect(webScanPlan).toContain("specialist_runtime_planner: web vulnerability scanner/triage");
		expect(webScanPlan).toContain("web-scan-scope-baseline");
		expect(webScanPlan).toContain("web-scan-crawl-corpus-scaffold");
		expect(webScanPlan).toContain("web-scan-content-discovery-scaffold");
		expect(webScanPlan).toContain("web-scan-template-scan-scaffold");
		expect(webScanPlan).toContain("web-scan-manual-replay-verifier");

		const jsPlan = await planFor("JS 签名 sign 参数 crypto.subtle fetch", "observe", "https://target.local/app.js");
		expect(jsPlan).toContain("route: Frontend JS reverse");
		expect(jsPlan).toContain("JS signing rebuild");
		expect(jsPlan).toContain("js-signing-rebuild-browser-hooks");
		expect(jsPlan).toContain("crypto.subtle");
		expect(jsPlan).toContain("XMLHttpRequest");
		expect(jsPlan).toContain("js-signing-rebuild-node-scaffold");
		expect(jsPlan).toContain("js-signing-observation-normalizer");
		expect(jsPlan).toContain("js-signing-first-divergence-scaffold");
		expect(jsPlan).toContain("js-signing-replay-harness-scaffold");

		const nativePlan = await planFor("ELF native reverse license patch symbolic fuzz", "control-flow", "./license");
		expect(nativePlan).toContain("route: Native reverse");
		expect(nativePlan).toContain("specialist_runtime_planner: native deep reverse/pwn");
		expect(nativePlan).toContain("native-deep-symbol-map-scaffold");
		expect(nativePlan).toContain("native-deep-decompiler-project-scaffold");
		expect(nativePlan).toContain("native-deep-compare-trace-scaffold");
		expect(nativePlan).toContain("native-deep-patch-hypothesis-scaffold");
		expect(nativePlan).toContain("native-deep-symbolic-fuzz-scaffold");
		expect(nativePlan).toContain("/tmp/repi-native-symbolic-fuzz.py");

		const pwnPlan = await planFor("pwn ret2libc heap exploit", "primitive", "./vuln");
		expect(pwnPlan).toContain("route: Pwn / exploit");
		expect(pwnPlan).toContain("pwn primitive");
		expect(pwnPlan).toContain("native-deep-symbol-map-scaffold");
		expect(pwnPlan).toContain("pwn-primitive-cyclic-crash");
		expect(pwnPlan).toContain("pwn-primitive-offset-analyzer");
		expect(pwnPlan).toContain("pwn-primitive-rop-libc-scaffold");
		expect(pwnPlan).toContain("pwn-primitive-local-verifier");
		expect(pwnPlan).toContain("pwn-advanced-heap-tcache-scaffold");
		expect(pwnPlan).toContain("pwn-advanced-format-string-scaffold");
		expect(pwnPlan).toContain("pwn-advanced-srop-ret2dlresolve-scaffold");
		expect(pwnPlan).toContain("pwn-advanced-one-gadget-constraints");
		expect(pwnPlan).toContain("pwn-advanced-seccomp-sandbox-scaffold");
		expect(pwnPlan).toContain("ROPgadget");
		expect(pwnPlan).toContain("pwntools");

		const exploitPlan = await planFor("autopwn exploit reliability poc replay matrix", "replay", "./exploit.py");
		expect(exploitPlan).toContain("route: Exploit reliability");
		expect(exploitPlan).toContain("specialist_runtime_planner: exploit reliability/autopwn");
		expect(exploitPlan).toContain("exploit-poc-normalizer-scaffold");
		expect(exploitPlan).toContain("exploit-replay-matrix-scaffold");
		expect(exploitPlan).toContain("exploit-environment-pin-scaffold");
		expect(exploitPlan).toContain("exploit-flake-triage-scaffold");
		expect(exploitPlan).toContain("exploit-artifact-bundle-scaffold");

		const pcapPlan = await planFor("分析 pcap 流量", "map", "capture.pcapng");
		expect(pcapPlan).toContain("PCAP/DFIR flow");
		expect(pcapPlan).toContain("pcap-flow-conversations");
		expect(pcapPlan).toContain("pcap-flow-stream-rank");
		expect(pcapPlan).toContain("pcap-flow-secret-timeline");
		expect(pcapPlan).toContain("tshark -r");
		expect(pcapPlan).toContain("conv,tcp");
		expect(pcapPlan).toContain("export-objects http");
		expect(pcapPlan).toContain("pcap-flow-transform-chain");

		const memoryPlan = await planFor("volatility vmem memory dump 内存取证", "image-info", "mem.vmem");
		expect(memoryPlan).toContain("route: Memory forensics");
		expect(memoryPlan).toContain("specialist_runtime_planner: memory forensics");
		expect(memoryPlan).toContain("memory-forensics-image-info-scaffold");
		expect(memoryPlan).toContain("memory-forensics-process-network-scaffold");
		expect(memoryPlan).toContain("memory-forensics-credential-artifact-scaffold");
		expect(memoryPlan).toContain("memory-forensics-timeline-carve-scaffold");

		const firmwarePlan = await planFor("OpenWrt firmware binwalk squashfs rootfs mips", "inventory", "router.bin");
		expect(firmwarePlan).toContain("route: Firmware / IoT");
		expect(firmwarePlan).toContain("specialist_runtime_planner: Firmware/IoT rootfs");
		expect(firmwarePlan).toContain("firmware-static-fingerprint-scaffold");
		expect(firmwarePlan).toContain("firmware-extract-rootfs-scaffold");
		expect(firmwarePlan).toContain("firmware-filesystem-config-secret-scaffold");
		expect(firmwarePlan).toContain("firmware-service-surface-scaffold");
		expect(firmwarePlan).toContain("firmware-emulation-scaffold");

		const agentSecPlan = await planFor("LLM agent prompt injection MCP tool call memory poisoning", "surface", ".");
		expect(agentSecPlan).toContain("route: Agent / LLM boundary");
		expect(agentSecPlan).toContain("specialist_runtime_planner: agent prompt/tool boundary");
		expect(agentSecPlan).toContain("agent-prompt-surface-map");
		expect(agentSecPlan).toContain("agent-tool-boundary-scaffold");
		expect(agentSecPlan).toContain("agent-memory-poisoning-scaffold");
		expect(agentSecPlan).toContain("agent-injection-replay-harness");
		expect(agentSecPlan).toContain("agent-delegation-trace-scaffold");

		const malwarePlan = await planFor("malware sample yara capa floss c2 ioc config", "triage", "./sample.bin");
		expect(malwarePlan).toContain("route: Malware analysis");
		expect(malwarePlan).toContain("specialist_runtime_planner: malware config/IOC");
		expect(malwarePlan).toContain("malware-static-triage-scaffold");
		expect(malwarePlan).toContain("malware-yara-capa-floss-scaffold");
		expect(malwarePlan).toContain("malware-ioc-config-scaffold");
		expect(malwarePlan).toContain("malware-behavior-trace-scaffold");

		const cloudPlan = await planFor("K8s cloud metadata serviceaccount privilege", "identity", ".");
		expect(cloudPlan).toContain("route: Cloud / container");
		expect(cloudPlan).toContain("specialist_runtime_planner: Cloud/K8s identity");
		expect(cloudPlan).toContain("cloud-identity-config-map");
		expect(cloudPlan).toContain("cloud-runtime-config-scaffold");
		expect(cloudPlan).toContain("cloud-metadata-probe-scaffold");
		expect(cloudPlan).toContain("cloud-privilege-edge-scaffold");

		const adPlan = await planFor("AD kerberos ldap certipy bloodhound credential graph", "principals", "10.0.0.5");
		expect(adPlan).toContain("route: Identity / Windows / AD");
		expect(adPlan).toContain("specialist_runtime_planner: Identity/AD graph");
		expect(adPlan).toContain("identity-ad-principal-enum-scaffold");
		expect(adPlan).toContain("identity-ad-credential-usability-scaffold");
		expect(adPlan).toContain("identity-ad-graph-scaffold");

		const iosPlan = await planFor("iOS IPA Keychain NSURLSession TLS pinning Frida", "ipa-inventory", "app.ipa");
		expect(iosPlan).toContain("route: Mobile / iOS");
		expect(iosPlan).toContain("specialist_runtime_planner: iOS IPA/mobile runtime");
		expect(iosPlan).toContain("ios-ipa-inventory-scaffold");
		expect(iosPlan).toContain("ios-macho-class-map-scaffold");
		expect(iosPlan).toContain("ios-frida-objection-hook-scaffold");
		expect(iosPlan).toContain("ios-network-replay-scaffold");

		const fridaPlan = await planFor("Android APK frida bypass", "runtime-proof", "./app.apk");
		expect(fridaPlan).toContain("Frida/GDB trace");
		expect(fridaPlan).toContain("frida-gdb-trace-hook-template");
		expect(fridaPlan).toContain("Java.perform");
		expect(fridaPlan).toContain("Module.findExportByName");
	});

	it("parses specialist runtime evidence and queues targeted follow-ups", async () => {
		const tools = new Map<string, unknown>();
		const execCalls: Array<{ command: string; args: string[] }> = [];
		const fakePi = {
			registerCommand() {},
			registerTool(tool: { name: string }) {
				tools.set(tool.name, tool);
			},
			on() {},
			appendEntry() {},
			getSessionName: () => undefined,
			setSessionName() {},
			sendMessage() {},
			exec: async (command: string, args: string[]) => {
				const script = args.join("\n");
				execCalls.push({ command, args });
				if (script.includes("https://target.local/app.js") && script.includes("js-signing-rebuild")) {
					return {
						code: 0,
						stdout: [
							"[repi-js-hook] fetch.args GET /api",
							"[repi-js-hook] crypto.subtle.sign.args key body",
							"crypto.subtle.sign.ret 32",
							"[js-signing-normalized] artifact=/tmp/repi-js-observed.json events=3 urls=1 crypto_ops=crypto.subtle.sign key_fields=signature,nonce body_hashes=abc123",
							"[js-first-divergence] expected=deadbeef candidate=feedface match=false suspect=body observed_keys=urls,cryptoOps,keyFields",
							"[js-first-divergence-candidate] name=body bytes=128 sha256=aaa hmacSha256=bbb",
							"[js-replay-harness] url=https://target.local/api method=POST status=200 bytes=88 body_hash=ccc signature_key=X-Signature",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("browser-xhr-ws")) {
					return {
						code: 0,
						stdout: [
							'[request] GET https://target.local/api/me {"authorization":"Bearer x"}',
							"[response] 200 https://target.local/api/me",
							"[websocket] wss://target.local/ws",
							'[cookies] [{"name":"sid","value":"abc"}]',
							'[localStorage] {"access_token":"tok"}',
							"[cdp-request] GET https://target.local/api/me type=Fetch",
							"[cdp-response] 200 https://target.local/api/me",
							"[cdp-ws] wss://target.local/ws",
							"[browser-artifact] /tmp/repi-browser-artifact.json",
							'[storage-snapshot] {"href":"https://target.local/app","localStorage":{"access_token":"tok"}}',
							"[replay-eval] artifact=/tmp/repi-browser-artifact.json method=GET url=https://target.local/api/me status=200 expected=200 replay_match=true bytes=123 body_hash=abc123",
							"[route-graph] artifact=/tmp/repi-browser-artifact.json routes=2 auth_routes=1 idor_params=1",
							"[route-node] GET /api/users/:id statuses=200 auth=true params=id idor=id sample=https://target.local/api/users/123?id=123",
							"[auth-matrix] route=/api/users/123 anon=401 a=200 b=200 same_ab=false diff_anon_a=true bytes_a=120 bytes_b=118 hash_a=aaa hash_b=bbb",
							"[idor-candidate] method=GET route=/api/users/:id param=id sample=https://target.local/api/users/123?id=123",
							"[idor-probe] route=/api/users/123 param=id base_status=200 alt_status=200 same_body=false potential_idor=true",
							"[authz-state] principal=anon route=/api/users/:id method=GET status=401 bytes=20 hash=anon sequence=direct",
							"[authz-state] principal=A route=/api/users/:id method=GET status=200 bytes=120 hash=aaa sequence=direct",
							"[authz-state] principal=B route=/api/users/:id method=GET status=200 bytes=118 hash=bbb sequence=direct",
							"[authz-state-machine] artifact=/tmp/repi-authz-state-machine.json routes=1 states=3 principals=anon,A,B",
							"[authz-sequence] name=list-then-detail principal=A steps=2 statuses=200,200 stable=true drift=false",
							"[authz-sequence-artifact] /tmp/repi-authz-sequence.json",
							"[authz-ownership] route=/api/users/:id object=123 owner=A principal=A status=200 principal_b_status=200 same_body=false potential_bola=true",
							"[authz-rollback] route=/api/users/123 mutation=PATCH before=aaa after=ccc rollback=aaa restored=true",
							"[web-authz-static] route_file=src/routes.ts line=10 code=app.get('/users/:id')",
							"[web-authz-risk] file=src/routes.ts line=12 reason=id_lookup_without_nearby_owner_check code=findUnique({id})",
							"[web-authz-static-summary] route_hits=2 auth_hits=1 risk_hits=1 files=10",
							"[web-schema] file=openapi.json bytes=1234",
							"[web-schema-route] method=GET path=/api/users/{id} security=no id_params=id",
							"[web-schema-risk] method=GET path=/api/users/{id} reason=id_param_without_security",
							"[web-state-source] file=src/routes.ts line=30 has_state=true has_auth_context=false code=router.patch('/users/:id')",
							"[web-state-risk] file=src/routes.ts line=30 reason=mutating_route_without_nearby_auth_context",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (
					script.includes("native-deep-symbol-map") &&
					!script.includes("pwn-primitive") &&
					!script.includes("frida-gdb-trace-mobile-environment")
				) {
					return {
						code: 0,
						stdout: [
							"[native-symbol-map] target=./license",
							"[native-header] ELF Header: Type EXEC Machine x86-64",
							"[native-section] .text PROGBITS",
							"[native-symbol] 0000000000401156 FUNC GLOBAL main",
							"[native-import] strcmp GLIBC_2.2.5",
							"[native-string] license invalid",
							"[native-decompiler] analyzeHeadless=missing script=/tmp/repi-ghidra-export.java",
							"[native-decompiler-fallback] sym.main cmp eax,0",
							"[native-compare-trace] script=/tmp/repi-native-compare-trace.gdb target=./license",
							"[native-compare] fn=strcmp a=user b=secret rip=0x401234",
							"[native-patch] candidates=3 artifact=/tmp/repi-native-patch-candidates.json",
							"[native-patch-candidate] 401250: jne 401270",
							"[native-symbolic] angr=present arch=<Arch AMD64 (LE)> entry=0x401000",
							"[native-symbolic] cfg_functions=42",
							"[native-symbolic-fn] 0x401156 main",
							"[native-fuzz] seed=2 len=32 exit=-11 ms=3 stdout=b'' stderr=b''",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("pwn-primitive")) {
					return {
						code: 0,
						stdout: [
							"Program received signal SIGSEGV",
							"RIP 0x6161616c",
							"RSP 0x7fffffffe000",
							"ROPgadget ... pop rdi ; ret",
							"[pwn-offset] crash_value=0x6161616c offset=120",
							"[pwn-libc-fingerprint] libc=/lib/x86_64-linux-gnu/libc.so.6",
							"[pwn-rop-chain] pop_rdi=0x40123b puts@plt=0x401030 puts@got=0x404018",
							"[pwn-local-verifier] target=./vuln offset=120 payload_len=128 exit=-11",
							"[pwn-heap] gdb_python_ready=true",
							"[pwn-tcache] artifact=/tmp/repi-pwn-heap-tcache.log anchors=malloc,free,tcachebins,fastbins,unsortedbin",
							"[pwn-fmtstr] target=./vuln probes=5",
							"[pwn-fmtstr-probe] idx=1 exit=0 payload=%p.%p output=0x41414141",
							"[pwn-srop-gadget] 0x401234 : syscall ; ret",
							'[pwn-ret2dlresolve] scaffold=Ret2dlresolvePayload(elf, symbol="system", args=["/bin/sh"])',
							"[pwn-one-gadget] candidate=0xe3b01",
							"[pwn-one-gadget-constraint] constraints: [rsp+0x60] == NULL",
							"[pwn-seccomp] seccomp-tools=missing fallback=strace",
							"[pwn-sandbox-strace] prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, 0xdeadbeef) = 0",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("exploit-poc-normalizer") || script.includes("exploit-replay-matrix")) {
					return {
						code: 0,
						stdout: [
							"[exploit-candidate] file=./exploit.py",
							"[exploit-poc] file=exploit.py kind=pwn-pwntools bytes=2048 sha256=abc executable=true",
							"[exploit-poc-summary] candidates=1 artifact=/tmp/repi-exploit-candidates.json",
							"[exploit-replay] cmd=python3 exploit.py runs=5 timeout=8",
							"[exploit-replay] run=1 exit=0 duration=0.120 hash=aaa ok=true stdout_len=40 stderr_len=0",
							"[exploit-replay-summary] runs=5 ok=5 success_rate=1.000 unique_hashes=1 unique_exits=1 stable=true artifact=/tmp/repi-exploit-replay-matrix.json",
							"[exploit-env] python=3.12 platform=Linux target=exploit.py sha256=abc",
							"[exploit-flake] runs=5 failures=0 unique_exits=1 unique_hashes=1 stable=true",
							"[exploit-bundle] manifest=/tmp/repi-exploit-bundle-manifest.json artifacts=3",
							"[exploit-bundle-artifact] path=/tmp/repi-exploit-replay-matrix.json bytes=512 sha256=def",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("pcap-flow")) {
					return {
						code: 0,
						stdout: [
							"TCP Conversations",
							"10.0.0.1:1234 <-> 10.0.0.2:80",
							"http.request GET /flag",
							"[pcap-stream-rank] stream=0 packets=42 bytes=4096 duration=1.337 hosts=10.0.0.1,10.0.0.2 protocols=HTTP,TCP",
							"[pcap-secret-timeline] frame=7 time=Jun 08 stream=0 src=10.0.0.1 dst=10.0.0.2 value=Authorization: Bearer token",
							"/tmp/repi-pcap-objects/flag.txt",
							"[pcap-transform-chain] file=/tmp/repi-pcap-objects/flag.txt bytes=64 hints=base64,secret-string decoded=base64:flag{demo}",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("firmware-static-fingerprint") || script.includes("firmware-extract-rootfs")) {
					return {
						code: 0,
						stdout: [
							"[firmware-image] path=router.bin bytes=8388608 sha256=abc magic=27051956 entropy=7.812",
							"DECIMAL HEXADECIMAL DESCRIPTION Squashfs filesystem, little endian, version 4.0",
							"[firmware-extract] target=router.bin out=/tmp/repi-firmware-extract",
							"[firmware-rootfs] /tmp/repi-firmware-extract/squashfs-root",
							"[firmware-config] root=/tmp/repi-firmware-extract/squashfs-root",
							"[firmware-secret] /etc/passwd:root:$1$hash:0:0:root:/root:/bin/sh",
							"[firmware-service] /etc/init.d/S50dropbear dropbear -p 22",
							"[firmware-surface] endpoint=/www/cgi-bin/login.cgi",
							"[firmware-emulation] root=/tmp/repi-firmware-extract/squashfs-root busybox=/bin/busybox arch=ELF 32-bit MSB executable, MIPS",
							"[firmware-emulation] qemu=qemu-mips-static",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("agent-prompt-surface") || script.includes("agent-tool-boundary")) {
					return {
						code: 0,
						stdout: [
							"[agent-prompt] file=prompts/system.md",
							"[agent-prompt-risk] prompts/system.md:3: prompt injection ignore previous",
							"[agent-tool] file=src/tools.ts hits=tool-reg,exec,schema",
							"[agent-tool-risk] file=src/unsafe.ts reason=exec_without_visible_schema_guard",
							"[agent-memory] file=recon/memory/field-journal.md bytes=120 sha256=abc",
							"[agent-memory-risk] file=recon/memory/field-journal.md line=4 text=ignore previous developer message",
							"[agent-injection-replay] corpus=/tmp/repi-agent-injection-corpus.jsonl cases=4 target=.",
							"[agent-injection-case] name=tool-json-smuggle channel=tool_output bytes=66",
							"[agent-delegation] file=src/mcp.ts hits=2",
							"[agent-delegation-risk] file=src/mcp.ts line=tools/call delegates to sub-agent capability",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("malware-static-triage") || script.includes("malware-ioc-config")) {
					return {
						code: 0,
						stdout: [
							"[malware-static] path=sample.bin bytes=4096 sha256=abc magic=4d5a entropy=7.221",
							"[malware-static] format_hint=PE",
							"[malware-yara] Pi_RECON_Suspicious_Strings sample.bin",
							"[malware-capa] ATT&CK T1055 Process Injection",
							"[malware-floss] decoded-string http://c2.example/panel",
							"[malware-ioc] type=url value=http://c2.example/panel",
							"[malware-ioc] type=ipv4 value=10.10.10.10",
							"[malware-config-hint] keyword=CreateRemoteThread",
							"[malware-config-summary] unique_iocs=3",
							'[malware-behavior] execve("./sample.bin", ["./sample.bin"], 0x7ffc)',
							'[malware-behavior] connect(3, {sa_family=AF_INET, sin_port=htons(443), sin_addr=inet_addr("10.10.10.10")}, 16)',
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("cloud-identity-config-map") || script.includes("cloud-runtime-config")) {
					return {
						code: 0,
						stdout: [
							"[cloud-identity] env=AWS_PROFILE len=7 sha256=abc",
							"[k8s-serviceaccount] token_path=/var/run/secrets/kubernetes.io/serviceaccount/token namespace=default",
							"[cloud-runtime-config] manifest=deploy.yaml",
							"[k8s-rbac] create pods yes",
							"[cloud-metadata] provider=aws-imds-token status=200 token_len=56",
							"[cloud-privilege-edge] file=rbac.yaml kind=k8s-rbac",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("identity-ad-principal-enum") || script.includes("identity-ad-graph")) {
					return {
						code: 0,
						stdout: [
							"[ad-principal] domain=LAB dc=10.0.0.5 user=alice target=10.0.0.5",
							"[kerberos-ticket] path=/tmp/krb5cc_0 bytes=1200",
							"[ldap-anchor] dn: CN=alice,CN=Users,DC=lab,DC=local",
							"[ad-credential-check] target=10.0.0.5 user=alice pass_set=true hash_set=false",
							"[ad-graph-edge] file=bh.json hints=GenericAll,MemberOf",
							"[ad-cert-edge] file=certipy.txt hint=adcs/certipy",
							"[ad-graph-summary] files=2 edge_files=2",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				if (script.includes("frida-gdb-trace")) {
					return {
						code: 0,
						stdout: [
							"[repi-frida] Java runtime ready",
							"[doFinal] javax.crypto.Cipher",
							"[doFinal.ret] hexdump ...",
							"[native] strcmp 0x1 0x2",
						].join("\n"),
						stderr: "",
						killed: false,
					};
				}
				return { code: 0, stdout: "ok\n", stderr: "", killed: false };
			},
		} as unknown as ExtensionAPI;

		createReconExtensionFactory()(fakePi);

		const missionTool = tools.get("re_mission") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const laneTool = tools.get("re_lane") as {
			execute: (
				toolCallId: string,
				params: Record<string, unknown>,
			) => Promise<{ content: Array<{ text: string }> }>;
		};
		const runFor = async (task: string, lane: string, target: string) => {
			await missionTool.execute("tool-call-id", { action: "new", task });
			const result = await laneTool.execute("tool-call-id", { action: "run", lane, target });
			return result.content[0]?.text ?? "";
		};

		const webRun = await runFor("Web API JWT auth websocket replay", "surface", "https://target.local/app");
		expect(webRun).toContain("browser/XHR/WS runtime anchors");
		expect(webRun).toContain("websocket endpoint anchors");
		expect(webRun).toContain("cookie/storage anchors");
		expect(webRun).toContain("browser-xhr-ws-auth-diff-rerun");
		expect(webRun).toContain("browser-xhr-ws-capture-rerun");
		expect(webRun).toContain("browser CDP artifact anchors");
		expect(webRun).toContain("browser runtime artifact paths");
		expect(webRun).toContain("browser replay evaluator anchors");
		expect(webRun).toContain("browser route graph anchors");
		expect(webRun).toContain("browser auth matrix anchors");
		expect(webRun).toContain("browser IDOR/BOLA probe anchors");
		expect(webRun).toContain("browser authz state machine anchors");
		expect(webRun).toContain("browser authz sequence replay anchors");
		expect(webRun).toContain("browser authz object ownership anchors");
		expect(webRun).toContain("browser authz state rollback anchors");
		expect(webRun).toContain("web API static authz source anchors");
		expect(webRun).toContain("web API schema/auth parameter anchors");
		expect(webRun).toContain("web API state mutation source anchors");
		expect(webRun).toContain("browser-cdp-artifact-rerun");
		expect(webRun).toContain("browser-replay-eval-rerun");
		expect(webRun).toContain("browser-route-graph-rerun");
		expect(webRun).toContain("browser-auth-matrix-rerun");
		expect(webRun).toContain("browser-idor-bola-probe-rerun");
		expect(webRun).toContain("browser-authz-state-machine-rerun");
		expect(webRun).toContain("browser-authz-sequence-replay-rerun");
		expect(webRun).toContain("browser-authz-object-ownership-rerun");
		expect(webRun).toContain("browser-authz-state-rollback-rerun");
		expect(webRun).toContain("web-api-authz-static-rerun");
		expect(webRun).toContain("web-api-schema-diff-rerun");
		expect(webRun).toContain("web-api-state-source-rerun");
		expect(webRun).toContain("browser-cdp-artifact-review");
		expect(webRun).toContain("browser-replay-eval-artifact-rerun");
		expect(webRun).toContain("browser-authz-report-scaffold");
		expect(webRun).toContain("browser-authz-state-report-scaffold");
		expect(webRun).toContain("evidence_quality:");
		expect(webRun).toMatch(/verdict: (strong|partial)/);

		const jsRun = await runFor("JS 签名 sign 参数 crypto.subtle fetch", "observe", "https://target.local/app.js");
		expect(jsRun).toContain("JS signing rebuild anchors");
		expect(jsRun).toContain("crypto.subtle operation anchors");
		expect(jsRun).toContain("JS signing normalized artifact anchors");
		expect(jsRun).toContain("JS first-divergence anchors");
		expect(jsRun).toContain("JS signing replay harness anchors");
		expect(jsRun).toContain("js-signing-observed-rebuild");
		expect(jsRun).toContain("js-signing-normalizer-rerun");
		expect(jsRun).toContain("js-first-divergence-rerun");
		expect(jsRun).toContain("js-signing-replay-harness-rerun");

		const nativeRun = await runFor("ELF native reverse license patch symbolic fuzz", "control-flow", "./license");
		expect(nativeRun).toContain("Native deep symbol/import/string anchors");
		expect(nativeRun).toContain("Native decompiler/control-flow anchors");
		expect(nativeRun).toContain("Native compare trace anchors");
		expect(nativeRun).toContain("Native patch hypothesis anchors");
		expect(nativeRun).toContain("Native symbolic/CFG anchors");
		expect(nativeRun).toContain("Native fuzz/crash anchors");
		expect(nativeRun).toContain("native-deep-symbol-map-rerun");
		expect(nativeRun).toContain("native-deep-decompiler-rerun");
		expect(nativeRun).toContain("native-deep-compare-trace-rerun");
		expect(nativeRun).toContain("native-deep-symbolic-fuzz-rerun");
		expect(nativeRun).toContain("native-deep-patch-report-scaffold");

		const pwnRun = await runFor("pwn ret2libc heap exploit", "primitive", "./vuln");
		expect(pwnRun).toContain("pwn primitive crash/control anchors");
		expect(pwnRun).toContain("pwn crash register anchors");
		expect(pwnRun).toContain("pwn cyclic offset anchors");
		expect(pwnRun).toContain("pwn gadget anchors");
		expect(pwnRun).toContain("pwn ROP/libc chain anchors");
		expect(pwnRun).toContain("pwn local verifier anchors");
		expect(pwnRun).toContain("pwn heap/tcache anchors");
		expect(pwnRun).toContain("pwn format-string anchors");
		expect(pwnRun).toContain("pwn SROP/ret2dlresolve anchors");
		expect(pwnRun).toContain("pwn one_gadget constraint anchors");
		expect(pwnRun).toContain("pwn seccomp/sandbox anchors");
		expect(pwnRun).toContain("pwn-cyclic-offset-helper");
		expect(pwnRun).toContain("pwn-focused-gdb-rerun");
		expect(pwnRun).toContain("pwn-offset-analyzer-rerun");
		expect(pwnRun).toContain("pwn-rop-libc-scaffold-rerun");
		expect(pwnRun).toContain("pwn-local-verifier-rerun");
		expect(pwnRun).toContain("pwn-pwntools-exploit-template");
		expect(pwnRun).toContain("pwn-heap-tcache-rerun");
		expect(pwnRun).toContain("pwn-format-string-rerun");
		expect(pwnRun).toContain("pwn-srop-ret2dlresolve-rerun");
		expect(pwnRun).toContain("pwn-one-gadget-constraints-rerun");
		expect(pwnRun).toContain("pwn-seccomp-sandbox-rerun");

		const exploitRun = await runFor("autopwn exploit reliability poc replay matrix", "replay", "./exploit.py");
		expect(exploitRun).toContain("Exploit PoC inventory anchors");
		expect(exploitRun).toContain("PoC replay matrix anchors");
		expect(exploitRun).toContain("Exploit environment pin anchors");
		expect(exploitRun).toContain("Exploit flake triage anchors");
		expect(exploitRun).toContain("Exploit artifact bundle anchors");
		expect(exploitRun).toContain("exploit-poc-normalizer-rerun");
		expect(exploitRun).toContain("exploit-replay-matrix-rerun");
		expect(exploitRun).toContain("exploit-env-pin-rerun");
		expect(exploitRun).toContain("exploit-flake-triage-rerun");
		expect(exploitRun).toContain("exploit-artifact-bundle-rerun");
		expect(exploitRun).toContain("exploit-reliability-report-scaffold");

		const pcapRun = await runFor("分析 pcap 流量", "map", "capture.pcapng");
		expect(pcapRun).toContain("PCAP/DFIR traffic flow anchors");
		expect(pcapRun).toContain("PCAP stream ranking anchors");
		expect(pcapRun).toContain("PCAP secret timeline anchors");
		expect(pcapRun).toContain("PCAP extracted artifact anchors");
		expect(pcapRun).toContain("PCAP transform chain anchors");
		expect(pcapRun).toContain("pcap-follow-streams");
		expect(pcapRun).toContain("pcap-object-review");
		expect(pcapRun).toContain("pcap-stream-rank-rerun");
		expect(pcapRun).toContain("pcap-secret-timeline-rerun");
		expect(pcapRun).toContain("pcap-transform-chain-rerun");
		expect(pcapRun).toContain("pcap-dfir-report-scaffold");

		const firmwareRun = await runFor("OpenWrt firmware binwalk squashfs rootfs mips", "inventory", "router.bin");
		expect(firmwareRun).toContain("Firmware image metadata anchors");
		expect(firmwareRun).toContain("Firmware extraction/rootfs anchors");
		expect(firmwareRun).toContain("Firmware config/secret anchors");
		expect(firmwareRun).toContain("Firmware service/web surface anchors");
		expect(firmwareRun).toContain("Firmware emulation/runtime anchors");
		expect(firmwareRun).toContain("firmware-extract-rerun");
		expect(firmwareRun).toContain("firmware-config-secret-rerun");
		expect(firmwareRun).toContain("firmware-service-surface-rerun");
		expect(firmwareRun).toContain("firmware-emulation-scaffold-rerun");
		expect(firmwareRun).toContain("firmware-report-scaffold");

		const agentSecRun = await runFor("LLM agent prompt injection MCP tool call memory poisoning", "surface", ".");
		expect(agentSecRun).toContain("Agent prompt surface anchors");
		expect(agentSecRun).toContain("Agent tool boundary anchors");
		expect(agentSecRun).toContain("Agent memory poisoning anchors");
		expect(agentSecRun).toContain("Agent injection replay anchors");
		expect(agentSecRun).toContain("Agent delegation trace anchors");
		expect(agentSecRun).toContain("agent-prompt-surface-rerun");
		expect(agentSecRun).toContain("agent-tool-boundary-rerun");
		expect(agentSecRun).toContain("agent-memory-poisoning-rerun");
		expect(agentSecRun).toContain("agent-injection-replay-rerun");
		expect(agentSecRun).toContain("agent-delegation-trace-rerun");
		expect(agentSecRun).toContain("agent-security-report-scaffold");

		const malwareRun = await runFor("malware sample yara capa floss c2 ioc config", "triage", "./sample.bin");
		expect(malwareRun).toContain("Malware static triage anchors");
		expect(malwareRun).toContain("Malware rule/capability anchors");
		expect(malwareRun).toContain("Malware IOC/config anchors");
		expect(malwareRun).toContain("Malware behavior trace anchors");
		expect(malwareRun).toContain("malware-static-triage-rerun");
		expect(malwareRun).toContain("malware-ioc-config-rerun");
		expect(malwareRun).toContain("malware-behavior-trace-rerun");
		expect(malwareRun).toContain("malware-report-scaffold");

		const cloudRun = await runFor("K8s cloud metadata serviceaccount privilege", "identity", ".");
		expect(cloudRun).toContain("Cloud identity anchors");
		expect(cloudRun).toContain("Cloud/K8s runtime config anchors");
		expect(cloudRun).toContain("Cloud metadata probe anchors");
		expect(cloudRun).toContain("Cloud privilege edge anchors");
		expect(cloudRun).toContain("cloud-identity-rerun");
		expect(cloudRun).toContain("cloud-runtime-config-rerun");
		expect(cloudRun).toContain("cloud-metadata-probe-rerun");
		expect(cloudRun).toContain("cloud-privilege-report-scaffold");

		const adRun = await runFor("AD kerberos ldap certipy bloodhound credential graph", "principals", "10.0.0.5");
		expect(adRun).toContain("Identity/AD principal anchors");
		expect(adRun).toContain("Identity/AD credential usability anchors");
		expect(adRun).toContain("Identity/AD graph edge anchors");
		expect(adRun).toContain("identity-ad-enum-rerun");
		expect(adRun).toContain("identity-ad-credential-check-rerun");
		expect(adRun).toContain("identity-ad-graph-rerun");
		expect(adRun).toContain("identity-ad-report-scaffold");

		const fridaRun = await runFor("Android APK frida bypass", "runtime-proof", "./app.apk");
		expect(fridaRun).toContain("Frida/GDB trace anchors");
		expect(fridaRun).toContain("runtime hook return/value anchors captured");
		expect(fridaRun).toContain("frida-focused-trace-rerun");
		expect(execCalls).toHaveLength(12);
	});
});
