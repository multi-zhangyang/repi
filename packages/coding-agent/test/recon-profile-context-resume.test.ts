import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createRegisteredReconHarness, ENV_BRANCH_ID } from "./recon-profile-harness.ts";

vi.setConfig({ testTimeout: 60_000 });

describe("REPI context resume closure", () => {
	it("blocks exact context resume negative fixtures and completion closure", async () => {
		const harness = createRegisteredReconHarness("repi-context-resume");
		try {
			process.env[ENV_BRANCH_ID] = "branch-a";
			const runtimeBridgeTool = harness.tools.get("re_runtime_bridge") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const runtimeBridge = await runtimeBridgeTool.execute("tool-call-id", {
				action: "show",
				bridge: "web-cdp-replay",
			});
			expect(runtimeBridge.content[0]?.text).toContain("ProfessionalRuntimeBridgesCheckV1");
			expect(runtimeBridge.content[0]?.text).toContain("cdp-network-capture");

			const runtimeAdapterTool = harness.tools.get("re_runtime_adapter") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const runtimeAdapter = await runtimeAdapterTool.execute("tool-call-id", {
				action: "plan",
				adapter: "r2-native-xref-adapter",
			});
			expect(runtimeAdapter.content[0]?.text).toContain("RuntimeAdapterExecutionCheckV1");
			expect(runtimeAdapter.content[0]?.text).toContain("adapter-r2-native-xref-runner");

			const missionTool = harness.tools.get("re_mission") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const mapTool = harness.tools.get("re_map") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const contextTool = harness.tools.get("re_context") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const completeTool = harness.tools.get("re_complete") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};

			await missionTool.execute("tool-call-id", {
				action: "new",
				task: "exact resume negative fixture target-a",
			});
			await mapTool.execute("tool-call-id", { target: "target-a", depth: 1 });
			const contextPack = await contextTool.execute("tool-call-id", { action: "pack", target: "target-a" });
			const contextPath = /context_artifact: (.+)/.exec(contextPack.content[0]?.text ?? "")?.[1]?.trim();
			const mapPath = /- map: (.+?) exists=true sha256=/.exec(contextPack.content[0]?.text ?? "")?.[1]?.trim();
			expect(contextPath).toBeDefined();
			expect(mapPath).toBeDefined();
			expect(contextPack.content[0]?.text).toContain("closure:");
			expect(contextPack.content[0]?.text).toContain("- status=open");

			process.env[ENV_BRANCH_ID] = "branch-b";
			const branchResume = await contextTool.execute("tool-call-id", {
				action: "resume",
				target: "target-a",
				contextPath,
			});
			expect(branchResume.content[0]?.text).toContain("resume_queue_status: blocked");
			expect(branchResume.content[0]?.text).toContain("branch mismatch");
			const branchCompletion = await completeTool.execute("tool-call-id", { action: "audit" });
			expect(branchCompletion.content[0]?.text).toContain("context resume verification blocks completion");
			expect(branchCompletion.content[0]?.text).toContain("branch mismatch");

			process.env[ENV_BRANCH_ID] = "branch-a";
			const mismatchResume = await contextTool.execute("tool-call-id", {
				action: "resume",
				target: "target-b",
				contextPath,
			});
			expect(mismatchResume.content[0]?.text).toContain("resume_queue_status: blocked");
			expect(mismatchResume.content[0]?.text).toContain("- status=blocked");
			expect(mismatchResume.content[0]?.text).toContain("target mismatch");
			const mismatchCompletion = await completeTool.execute("tool-call-id", { action: "audit" });
			expect(mismatchCompletion.content[0]?.text).toContain("context resume closure blocks completion");
			expect(mismatchCompletion.content[0]?.text).toContain("context resume queue not done");

			writeFileSync(mapPath!, `${readFileSync(mapPath!, "utf-8")}\n# mutate map artifact for hash drift\n`, "utf-8");
			const driftResume = await contextTool.execute("tool-call-id", {
				action: "resume",
				target: "target-a",
				contextPath,
			});
			expect(driftResume.content[0]?.text).toContain("resume_queue_status: blocked");
			expect(driftResume.content[0]?.text).toContain("artifact hash drift");
			const driftCompletion = await completeTool.execute("tool-call-id", { action: "audit" });
			expect(driftCompletion.content[0]?.text).toContain("context resume verification blocks completion");
			expect(driftCompletion.content[0]?.text).toContain("artifact hash drift");

			const missingResume = await contextTool.execute("tool-call-id", {
				action: "resume",
				contextPath: join(harness.agentDir, "recon", "evidence", "contexts", "missing-pack.md"),
			});
			expect(missingResume.content[0]?.text).toContain("resume_queue_status: blocked");
			expect(missingResume.content[0]?.text).toContain("context pack not found");
		} finally {
			harness.restore();
		}
	});
});
