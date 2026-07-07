import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const MODEL_INSPECT = fileURLToPath(new URL("../../../scripts/reverse-agent/model-inspect.mjs", import.meta.url));
const REPI_MODEL_ENV_NAMES = [
	"REPI_AUTH_TOKEN",
	"REPI_API_KEY",
	"REPI_MODEL_API_KEY",
	"REPI_BASE_URL",
	"REPI_MODEL_BASE_URL",
	"REPI_MODEL",
	"REPI_MODEL_ID",
	"REPI_MODEL_API",
	"REPI_API",
	"REPI_PROVIDER",
	"REPI_MODEL_PROVIDER",
	"REPI_PROVIDER_ID",
	"REPI_CONTEXT_WINDOW",
	"REPI_MODEL_CONTEXT_WINDOW",
	"REPI_AUTO_COMPACT_WINDOW",
	"REPI_MODEL_AUTO_COMPACT_WINDOW",
	"REPI_MAX_TOKENS",
	"REPI_MODEL_MAX_TOKENS",
	"REPI_MAX_OUTPUT_TOKENS",
	"REPI_SUBAGENT_MODEL",
];

describe("repi model argument parsing", () => {
	let tempRoot: string;
	let agentDir: string;
	let workspace: string;

	beforeEach(() => {
		tempRoot = mkdtempSync(join(tmpdir(), "repi-model-args-"));
		agentDir = join(tempRoot, "agent");
		workspace = join(tempRoot, "workspace");
		mkdirSync(agentDir, { recursive: true });
		mkdirSync(workspace, { recursive: true });
		writeFileSync(
			join(agentDir, "models.json"),
			`${JSON.stringify(
				{
					providers: {
						alpha: {
							api: "openai-completions",
							baseUrl: "https://example.invalid/v1",
							apiKey: "$ALPHA_KEY",
							models: [{ id: "model-a", contextWindow: 8192, maxTokens: 1024, cost: {} }],
						},
					},
				},
				null,
				2,
			)}\n`,
		);
	});

	afterEach(() => {
		rmSync(tempRoot, { recursive: true, force: true });
	});

	function run(args: string[], env: Record<string, string> = {}) {
		const cleanEnv = { ...process.env };
		for (const name of REPI_MODEL_ENV_NAMES) delete cleanEnv[name];
		const result = spawnSync(process.execPath, [MODEL_INSPECT, workspace, ...args, "--json"], {
			encoding: "utf8",
			env: { ...cleanEnv, REPI_CODING_AGENT_DIR: agentDir, ...env },
			timeout: 10_000,
		});
		return { result, json: JSON.parse(result.stdout) as Record<string, unknown> };
	}

	it("accepts provider/model as positionals for the default command", () => {
		const { result, json } = run(["default", "alpha", "model-a"]);
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
		expect(json).toMatchObject({ ok: true, provider: "alpha", model: "model-a" });
		expect(JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"))).toMatchObject({
			defaultProvider: "alpha",
			defaultModel: "model-a",
		});
	});

	it("accepts a positional model after a --provider flag", () => {
		const { result, json } = run(["default", "--provider", "alpha", "model-a"]);
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
		expect(json).toMatchObject({ ok: true, provider: "alpha", model: "model-a" });
	});

	it("does not mistake flag values for missing positionals", () => {
		const { result, json } = run(["default", "--model", "model-a"]);
		expect(result.status).toBe(1);
		expect(json).toMatchObject({
			ok: false,
			error: "model default requires --provider <id> --model <id>",
		});
	});

	it("lists an environment-only model provider without leaking the base URL by default", () => {
		const { result, json } = run(["list"], {
			REPI_AUTH_TOKEN: "env-only-key",
			REPI_BASE_URL: "https://env-gateway.example.invalid/v1",
			REPI_MODEL: "env-main-model",
			REPI_MODEL_API: "anthropic",
			REPI_CONTEXT_WINDOW: "262144",
			REPI_SUBAGENT_MODEL: "env-worker-model",
		});
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
		expect(json).toMatchObject({
			ok: true,
			baseUrlHidden: true,
		});
		const rows = json.rows as Array<Record<string, unknown>>;
		expect(rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					provider: "repi-env",
					model: "env-main-model",
					api: "anthropic-messages",
					contextWindow: 262144,
					auth: "$REPI_AUTH_TOKEN:set",
				}),
				expect.objectContaining({
					provider: "repi-env",
					model: "env-worker-model",
					api: "anthropic-messages",
				}),
			]),
		);
		const envRow = rows.find((row) => row.provider === "repi-env" && row.model === "env-main-model");
		expect(envRow?.baseUrl).toMatch(/^<redacted:url:/);
		expect(envRow?.baseUrl).not.toContain("env-gateway");
	});

	it("reports the effective REPI env-only model status without leaking the base URL", () => {
		const { result, json } = run(["status"], {
			REPI_AUTH_TOKEN: "env-only-key",
			REPI_BASE_URL: "https://status-gateway.example.invalid/v1",
			REPI_PROVIDER: "status-env",
			REPI_MODEL: "status-main-model",
			REPI_MODEL_API: "openai-responses",
			REPI_AUTO_COMPACT_WINDOW: "131072",
			REPI_MAX_TOKENS: "12000",
			REPI_SUBAGENT_MODEL: "status-worker-model",
		});
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
		expect(json).toMatchObject({
			ok: true,
			env: {
				enabled: true,
				provider: "status-env",
				model: "status-main-model",
				api: "openai-responses",
				authEnv: "REPI_AUTH_TOKEN",
				authPresent: true,
				contextWindow: 131072,
				autoCompactWindow: 131072,
				maxTokens: 12000,
				subagentModel: "status-worker-model",
			},
			effective: {
				source: "REPI_* environment",
				provider: "status-env",
				model: "status-main-model",
				api: "openai-responses",
				contextWindow: 131072,
				maxTokens: 12000,
			},
		});
		expect((json.env as Record<string, unknown>).baseUrl).toMatch(/^<redacted:url:/);
		expect((json.env as Record<string, unknown>).baseUrl).not.toContain("status-gateway");
	});

	it("warns when REPI_BASE_URL shape does not match the selected SDK wire format", () => {
		const openai = run(["status"], {
			REPI_AUTH_TOKEN: "env-only-key",
			REPI_BASE_URL: "https://status-gateway.example.invalid",
			REPI_MODEL: "status-main-model",
			REPI_MODEL_API: "openai-compatible",
		});
		expect(openai.result.status, `${openai.result.stderr}\n${openai.result.stdout}`).toBe(0);
		expect(JSON.stringify(openai.json.diagnostics)).toContain("usually ends with /v1");

		const anthropic = run(["status"], {
			REPI_AUTH_TOKEN: "env-only-key",
			REPI_BASE_URL: "https://status-gateway.example.invalid/v1",
			REPI_MODEL: "status-main-model",
			REPI_MODEL_API: "anthropic",
		});
		expect(anthropic.result.status, `${anthropic.result.stderr}\n${anthropic.result.stdout}`).toBe(0);
		expect(JSON.stringify(anthropic.json.diagnostics)).toContain("usually omits /v1");
	});

	it("fails model status on invalid REPI_MODEL_API instead of silently selecting chat completions", () => {
		const { result, json } = run(["status"], {
			REPI_AUTH_TOKEN: "env-only-key",
			REPI_BASE_URL: "https://status-gateway.example.invalid/v1",
			REPI_MODEL: "status-main-model",
			REPI_MODEL_API: "custom-wire-format",
		});
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(1);
		expect(json).toMatchObject({
			ok: false,
			env: {
				enabled: true,
				model: "status-main-model",
				rawApi: "custom-wire-format",
				invalidApi: "custom-wire-format",
			},
		});
		expect(JSON.stringify(json.diagnostics)).toContain("env-model-api");
		expect(JSON.stringify(json.diagnostics)).toContain("REPI_MODEL_API is invalid");
	});

	it("rejects removed provider presets and requires explicit model configuration", () => {
		const cleanEnv = { ...process.env };
		for (const name of REPI_MODEL_ENV_NAMES) delete cleanEnv[name];
		const result = spawnSync(
			process.execPath,
			[MODEL_INSPECT, workspace, "add", "--preset", "baseten-kimi-k2.7-code", "--json"],
			{
				encoding: "utf8",
				env: { ...cleanEnv, REPI_CODING_AGENT_DIR: agentDir },
				timeout: 10_000,
			},
		);
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(1);
		const report = JSON.parse(result.stdout) as { ok: boolean; error: string };
		expect(report.ok).toBe(false);
		expect(report.error).toContain("provider presets have been removed");
		expect(report.error).toContain("--provider --api --base-url --model");
	});

	it("resets saved model profile while preserving auth by default", () => {
		writeFileSync(
			join(agentDir, "settings.json"),
			`${JSON.stringify(
				{
					defaultProvider: "alpha",
					defaultModel: "model-a",
					defaultThinkingLevel: "high",
					enabledModels: ["alpha/model-a"],
					memory: { mode: "scoped" },
				},
				null,
				2,
			)}\n`,
		);
		writeFileSync(
			join(agentDir, "auth.json"),
			`${JSON.stringify({ alpha: { type: "api_key", key: "secret" } }, null, 2)}\n`,
		);

		const missingConfirm = run(["reset"]);
		expect(missingConfirm.result.status).toBe(1);
		expect(missingConfirm.json).toMatchObject({ ok: false });
		expect(String(missingConfirm.json.error)).toContain("requires --yes");

		const { result, json } = run(["reset", "--yes"]);
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
		expect(json).toMatchObject({
			ok: true,
			preservedAuth: true,
			before: { providerCount: 1, modelCount: 1 },
			after: { providerCount: 0, modelCount: 0 },
		});
		expect(JSON.parse(readFileSync(join(agentDir, "models.json"), "utf8"))).toEqual({ providers: {} });
		expect(JSON.parse(readFileSync(join(agentDir, "auth.json"), "utf8"))).toMatchObject({
			alpha: { type: "api_key", key: "secret" },
		});
		const settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8")) as Record<string, unknown>;
		expect(settings.defaultProvider).toBeUndefined();
		expect(settings.defaultModel).toBeUndefined();
		expect(settings.defaultThinkingLevel).toBeUndefined();
		expect(settings.enabledModels).toBeUndefined();
		expect(settings.memory).toEqual({ mode: "scoped" });
	});

	it("adds an explicit provider without leaking the key or URL by default", () => {
		const cleanEnv = { ...process.env };
		for (const name of REPI_MODEL_ENV_NAMES) delete cleanEnv[name];
		const result = spawnSync(
			process.execPath,
			[
				MODEL_INSPECT,
				workspace,
				"add",
				"--provider",
				"explicit-gateway",
				"--api",
				"openai-completions",
				"--base-url",
				"https://gateway.example.invalid/v1",
				"--model",
				"vendor/model",
				"--api-key-stdin",
				"--set-default",
				"--json",
			],
			{
				encoding: "utf8",
				env: { ...cleanEnv, REPI_CODING_AGENT_DIR: agentDir },
				input: "explicit-test-key\n",
				timeout: 10_000,
			},
		);
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
		const report = JSON.parse(result.stdout) as {
			ok: boolean;
			preset: null;
			provider: string;
			model: string;
			baseUrl: string;
			authWritten: boolean;
		};
		expect(report).toMatchObject({
			ok: true,
			preset: null,
			provider: "explicit-gateway",
			model: "vendor/model",
			authWritten: true,
		});
		expect(report.baseUrl).toMatch(/^<redacted:url:/);
		expect(report.baseUrl).not.toContain("gateway.example");
		const models = JSON.parse(readFileSync(join(agentDir, "models.json"), "utf8")) as {
			providers: Record<
				string,
				{ baseUrl: string; api: string; apiKey: string; models: Array<{ id: string; contextWindow: number }> }
			>;
		};
		expect(models.providers["explicit-gateway"]).toMatchObject({
			baseUrl: "https://gateway.example.invalid/v1",
			api: "openai-completions",
			apiKey: "$REPI_EXPLICIT_GATEWAY_API_KEY",
		});
		expect(models.providers["explicit-gateway"].models[0]).toMatchObject({
			id: "vendor/model",
			contextWindow: 262144,
		});
		expect(JSON.parse(readFileSync(join(agentDir, "auth.json"), "utf8"))).toMatchObject({
			"explicit-gateway": { type: "api_key", key: "explicit-test-key" },
		});
		expect(JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"))).toMatchObject({
			defaultProvider: "explicit-gateway",
			defaultModel: "vendor/model",
		});
	});
});
