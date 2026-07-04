import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "../src/core/extensions/types.ts";
import { createReconExtensionFactory } from "../src/core/recon-profile.ts";

export const ENV_AGENT_DIR = "REPI_CODING_AGENT_DIR";
export const ENV_BRANCH_ID = "REPI_BRANCH_ID";

export type RegisteredReconHarness = {
	tempDir: string;
	agentDir: string;
	commands: Map<string, unknown>;
	tools: Map<string, unknown>;
	handlers: Map<string, unknown[]>;
	execCalls: Array<{ command: string; args: string[] }>;
	restore: () => void;
};

export function createRegisteredReconHarness(
	prefix: string,
	options: {
		exec?: (
			command: string,
			args: string[],
		) => Promise<{ code: number; stdout: string; stderr: string; killed: boolean }>;
	} = {},
): RegisteredReconHarness {
	const tempDir = join(tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	const agentDir = join(tempDir, "agent");
	mkdirSync(agentDir, { recursive: true });
	const previousAgentDir = process.env[ENV_AGENT_DIR];
	const previousBranchId = process.env[ENV_BRANCH_ID];
	process.env[ENV_AGENT_DIR] = agentDir;

	const commands = new Map<string, unknown>();
	const tools = new Map<string, unknown>();
	const handlers = new Map<string, unknown[]>();
	const execCalls: Array<{ command: string; args: string[] }> = [];
	const fakePi = {
		registerCommand(name: string, commandOptions: unknown) {
			commands.set(name, commandOptions);
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
			return options.exec ? options.exec(command, args) : { code: 0, stdout: "", stderr: "", killed: false };
		},
	} as unknown as ExtensionAPI;

	createReconExtensionFactory()(fakePi);

	return {
		tempDir,
		agentDir,
		commands,
		tools,
		handlers,
		execCalls,
		restore: () => {
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
		},
	};
}
