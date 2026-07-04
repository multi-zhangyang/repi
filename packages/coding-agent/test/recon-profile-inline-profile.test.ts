import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { REPI_COMMAND_NAMES, REPI_TOOL_NAMES } from "../src/core/repi/profile.ts";
import { createRegisteredReconHarness } from "./recon-profile-harness.ts";

vi.setConfig({ testTimeout: 60_000 });

describe("REPI inline profile registration", () => {
	it("registers built-in commands, tools, and goal mode through an inline extension factory", async () => {
		const harness = createRegisteredReconHarness("repi-inline-profile", {
			exec: async () => ({ code: 0, stdout: "main\nstrcmp\n", stderr: "", killed: false }),
		});
		try {
			expect([...harness.commands.keys()]).toEqual(expect.arrayContaining([...REPI_COMMAND_NAMES, "goal"]));
			expect([...harness.tools.keys()]).toEqual(expect.arrayContaining([...REPI_TOOL_NAMES, "goal_complete"]));
			expect(harness.handlers.has("before_agent_start")).toBe(true);
			expect(harness.handlers.has("tool_call")).toBe(true);
			expect(harness.handlers.has("session_before_compact")).toBe(true);

			const bootstrapTool = harness.tools.get("re_bootstrap") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const bootstrapPlan = await bootstrapTool.execute("tool-call-id", { action: "plan", tools: ["gdb"] });
			expect(bootstrapPlan.content[0]?.text).toContain("sudo apt-get install -y gdb");

			const missionTool = harness.tools.get("re_mission") as {
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
			expect(readFileSync(join(harness.agentDir, "recon", "mission", "current.json"), "utf-8")).toContain(
				"Native reverse",
			);

			const kernelTool = harness.tools.get("re_kernel") as {
				execute: (
					toolCallId: string,
					params: Record<string, unknown>,
				) => Promise<{ content: Array<{ text: string }> }>;
			};
			const kernelResult = await kernelTool.execute("tool-call-id", { action: "build", target: "./license" });
			expect(kernelResult.content[0]?.text).toContain("execution_kernel:");
			expect(kernelResult.content[0]?.text).toContain("next_kernel_command:");
		} finally {
			harness.restore();
		}
	});
});
