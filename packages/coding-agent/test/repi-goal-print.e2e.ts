import { describe, expect, it, vi } from "vitest";
import { installRepiGoalMode, REPI_GOAL_STATE_ENTRY_TYPE } from "../src/core/repi/goal.ts";
import { createHarnessWithExtensions } from "./test-harness.ts";

describe.skipIf(process.env.REPI_RUN_RECON_E2E !== "1")("REPI goal mode print integration", () => {
	it("runs /goal end-to-end through the print AgentSession command path", async () => {
		const harness = await createHarnessWithExtensions({
			extensionFactories: [installRepiGoalMode],
			responses: [
				{
					toolCalls: [
						{
							name: "goal_complete",
							args: { summary: "Implemented and verified by the print harness." },
						},
					],
				},
			],
		});

		try {
			await harness.session.prompt("/goal verify print runtime");

			await vi.waitFor(() => expect(harness.faux.callCount).toBe(1));
			expect(JSON.stringify(harness.faux.contexts[0]?.messages ?? [])).toContain("verify print runtime");
			expect(JSON.stringify(harness.faux.contexts[0]?.messages ?? [])).toContain("REPI goal mode is active");
			expect(
				harness.sessionManager
					.getEntries()
					.some((entry) => entry.type === "custom" && entry.customType === REPI_GOAL_STATE_ENTRY_TYPE),
			).toBe(true);
		} finally {
			harness.cleanup();
		}
	});
});
