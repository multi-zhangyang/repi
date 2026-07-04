import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createRegisteredReconHarness } from "./recon-profile-harness.ts";

vi.setConfig({ testTimeout: 60_000 });

describe("REPI kernel profile proof-loop flow", () => {
	it("wires proof-loop gaps into a quick verifier/replayer/autofix path", async () => {
		const harness = createRegisteredReconHarness("repi-profile-proof-loop");
		try {
			const proofLoopTool = harness.tools.get("re_proof_loop") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const runtimeAdapterTool = harness.tools.get("re_runtime_adapter") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const graphTool = harness.tools.get("re_graph") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			await runtimeAdapterTool.execute("tool-call-id", {
				action: "run",
				target: "https://target.local/app",
			});
			await graphTool.execute("tool-call-id", { action: "build" });
			const proof = await proofLoopTool.execute("tool-call-id", {
				action: "plan",
				target: "https://target.local/app",
			});
			expect(proof.content[0]?.text).toContain("gap_classifier:");
			expect(proof.content[0]?.text).toContain("source=attack_graph");
			expect(proof.content[0]?.text).toContain("class=runtime_adapter_gap");
			expect(proof.content[0]?.text).toContain("class=missing_artifact");
			expect(proof.content[0]?.text).toContain("quick_path:");
			expect(proof.content[0]?.text).toContain("quick_plan_phases:");
			expect(proof.content[0]?.text).toContain("runtime_adapter_before_replay=pass");
			expect(proof.content[0]?.text).toContain(
				"re_runtime_adapter run web-cdp-network-adapter https://target.local/app",
			);
			expect(proof.content[0]?.text).toContain("re_verifier matrix https://target.local/app");
			expect(proof.content[0]?.text).toContain("re_replayer run https://target.local/app 1");
			expect(proof.content[0]?.text).toContain("re_autofix plan https://target.local/app");
			expect(proof.content[0]?.text).toContain("source=attack_graph_gap");
			const caseMemoryPath = join(harness.agentDir, "recon", "memory", "case-memory.jsonl");
			expect(existsSync(caseMemoryPath) ? readFileSync(caseMemoryPath, "utf-8") : "").not.toContain(
				"proof_loop plan",
			);

			const proofRun = await proofLoopTool.execute("tool-call-id", {
				action: "run",
				target: "https://target.local/app",
				maxSteps: 1,
				replaySteps: 1,
			});
			const proofRunText = proofRun.content[0]?.text ?? "";
			expect(proofRunText).toContain("proof_loop:");
			expect(proofRunText).toContain("executed_steps: 1");
			expect(proofRunText).toContain(
				"quick_path_execution: index=1 phase=runtime-adapter command=re_runtime_adapter run web-cdp-network-adapter https://target.local/app",
			);
			expect(readFileSync(caseMemoryPath, "utf-8")).toContain("proof_loop run");
			const nextProofActions = /next_proof_actions:([\s\S]*?)source_artifacts:/m.exec(proofRunText)?.[1] ?? "";
			expect(nextProofActions).not.toContain(
				"re_runtime_adapter run web-cdp-network-adapter https://target.local/app",
			);

			const graph = await graphTool.execute("tool-call-id", { action: "build" });
			const graphPath = /graph_artifact: (.+)/.exec(graph.content[0]?.text ?? "")?.[1]?.trim();
			expect(graphPath).toBeDefined();
			const graphText = readFileSync(graphPath!, "utf-8");
			expect(graphText).toContain("proof_loop plan");
			expect(graphText).toContain("quick_path");
			expect(graphText).toContain("quick_plan_phases");
			expect(graphText).toContain("proof-loop-gap");
			expect(graphText).toContain("proof-loop-output-hash");
			expect(graphText).toContain("output_sha256");
			expect(graphText).toContain("re_runtime_adapter run web-cdp-network-adapter https://target.local/app");
			expect(graphText).toContain("runtime-adapter-lineage");
			expect(graphText).toContain("runtime-adapter-artifact");
		} finally {
			harness.restore();
		}
	});
});
