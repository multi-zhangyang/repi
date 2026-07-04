import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createRegisteredReconHarness } from "./recon-profile-harness.ts";

vi.setConfig({ testTimeout: 60_000 });

describe("REPI profile MemoryStoreV5 wiring", () => {
	it("verifies and repairs MemoryStoreV5 transactional memory", async () => {
		const harness = createRegisteredReconHarness("repi-memory-store-v5");
		try {
			const memoryTool = harness.tools.get("re_memory") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }>; details?: Record<string, unknown> }>;
			};
			const appendResult = await memoryTool.execute("tool-call-id", {
				action: "append",
				scene: "native",
				title: "license runtime anchor",
				text: "runtime strcmp anchor verified; command: strings ./license | rg license",
			});
			expect(appendResult.content[0]?.text).toContain("memory_event:");
			const memoryDir = join(harness.agentDir, "recon", "memory");
			const storeReportPath = join(memoryDir, "store-report.json");
			const transactionDir = join(memoryDir, "transactions");
			expect(readFileSync(storeReportPath, "utf-8")).toContain("MemoryStoreV5");
			expect(readFileSync(join(transactionDir, readdirSync(transactionDir)[0]!), "utf-8")).toContain(
				"repi-memory-append-transaction",
			);

			const verifyPass = await memoryTool.execute("tool-call-id", { action: "verify" });
			expect(verifyPass.content[0]?.text).toContain("memory_store_v5:");
			expect(verifyPass.content[0]?.text).toContain("status=pass");
			expect(verifyPass.content[0]?.text).toContain("hash_chain_ok=true");

			writeFileSync(join(memoryDir, "case-memory.jsonl"), "", "utf-8");
			const verifyRepairable = await memoryTool.execute("tool-call-id", { action: "verify" });
			expect(verifyRepairable.content[0]?.text).toContain("status=repairable");
			expect(verifyRepairable.content[0]?.text).toContain("re_memory repair-index");

			const repaired = await memoryTool.execute("tool-call-id", { action: "repair-index" });
			expect(repaired.content[0]?.text).toContain("status=pass");
			expect(readFileSync(join(memoryDir, "case-memory.jsonl"), "utf-8")).toContain("repi-case-memory");

			const snapshot = await memoryTool.execute("tool-call-id", { action: "snapshot" });
			expect(snapshot.content[0]?.text).toContain("snapshot=");
			expect(readFileSync(join(memoryDir, "store-snapshot.json"), "utf-8")).toContain("repi-memory-store-snapshot");

			const evalResult = await memoryTool.execute("tool-call-id", { action: "eval" });
			expect(evalResult.content[0]?.text).toContain("memory_usefulness_eval:");
			expect(evalResult.content[0]?.text).toContain("hit_at_k=");
			expect(readFileSync(join(memoryDir, "usefulness-eval.json"), "utf-8")).toContain(
				"repi-memory-usefulness-eval",
			);
		} finally {
			harness.restore();
		}
	});
});
