import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { ModelRegistry } from "../src/core/model-registry.ts";
import { createAgentSession } from "../src/core/sdk.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createTestResourceLoader } from "./utilities.ts";

const REPI_ENV_NAMES = [
	"REPI_AUTH_TOKEN",
	"REPI_BASE_URL",
	"REPI_MODEL",
	"REPI_MODEL_API",
	"REPI_CONTEXT_WINDOW",
	"REPI_AUTO_COMPACT_WINDOW",
	"REPI_MAX_TOKENS",
	"REPI_PROVIDER",
	"KIMCHI_TEST_KEY",
] as const;

function setEnv(values: Record<string, string>): Map<string, string | undefined> {
	const originals = new Map<string, string | undefined>();
	for (const name of REPI_ENV_NAMES) {
		originals.set(name, process.env[name]);
		delete process.env[name];
	}
	for (const [name, value] of Object.entries(values)) process.env[name] = value;
	return originals;
}

function restoreEnv(originals: Map<string, string | undefined>) {
	for (const [name, value] of originals) {
		if (value === undefined) delete process.env[name];
		else process.env[name] = value;
	}
}

describe("createAgentSession REPI env model priority", () => {
	let tempDir: string;
	let cwd: string;
	let agentDir: string;
	let envOriginals: Map<string, string | undefined>;

	beforeEach(() => {
		tempDir = join(tmpdir(), `repi-env-model-priority-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		cwd = join(tempDir, "project");
		agentDir = join(tempDir, "agent");
		mkdirSync(cwd, { recursive: true });
		mkdirSync(agentDir, { recursive: true });
		envOriginals = setEnv({
			REPI_AUTH_TOKEN: "morph-test-key",
			REPI_BASE_URL: "https://api.morphllm.com/v1",
			REPI_MODEL: "morph-glm52-744b",
			REPI_MODEL_API: "openai-compatible",
			REPI_CONTEXT_WINDOW: "262144",
			REPI_AUTO_COMPACT_WINDOW: "262144",
			REPI_MAX_TOKENS: "16384",
			KIMCHI_TEST_KEY: "kimchi-test-key",
		});
	});

	afterEach(() => {
		restoreEnv(envOriginals);
		if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
	});

	it("uses REPI_* env model instead of restoring an existing session model", async () => {
		const authStorage = AuthStorage.create(join(agentDir, "auth.json"));
		const modelRegistry = ModelRegistry.create(authStorage, join(agentDir, "models.json"));
		modelRegistry.registerProvider("kimchi", {
			name: "Kimchi",
			api: "openai-completions",
			baseUrl: "https://kimchi.example.invalid/v1",
			apiKey: "$KIMCHI_TEST_KEY",
			models: [
				{
					id: "kimi-k2.7",
					name: "Kimi K2.7",
					contextWindow: 262144,
					maxTokens: 16384,
					input: ["text"],
					reasoning: true,
					cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				},
			],
		});

		const sessionManager = SessionManager.inMemory(cwd);
		sessionManager.appendModelChange("kimchi", "kimi-k2.7");
		sessionManager.appendMessage({ role: "user", content: "old turn", timestamp: 1 });

		const { session } = await createAgentSession({
			cwd,
			agentDir,
			authStorage,
			modelRegistry,
			settingsManager: SettingsManager.create(cwd, agentDir),
			sessionManager,
			resourceLoader: createTestResourceLoader(),
		});
		try {
			expect(session.agent.state.model.provider).toBe("repi-env");
			expect(session.agent.state.model.id).toBe("morph-glm52-744b");
			expect(session.agent.state.model.contextWindow).toBe(262144);
			expect(session.agent.state.model.maxTokens).toBe(16384);
		} finally {
			session.dispose();
		}
	});
});
