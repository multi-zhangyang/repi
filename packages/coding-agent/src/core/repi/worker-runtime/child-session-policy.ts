/** Worker child-session launch policy. */

import { join } from "node:path";
import type { RepiWorkerChildSessionLaunchPolicyV1 } from "./types.ts";

export function workerChildSessionLaunchPolicy(options?: {
	cwd?: string;
	isolatedHome?: string;
	timeoutMs?: number;
}): RepiWorkerChildSessionLaunchPolicyV1 {
	const isolatedHome =
		options?.isolatedHome ?? join(process.cwd(), ".repi", "runtime", "child-session-home", ".repi", "agent");
	return {
		command: "repi",
		args: ["--recon", "--offline", "--project-context", "--worker-runtime"],
		cwd: options?.cwd ?? process.cwd(),
		isolatedHome,
		profileDir: isolatedHome,
		timeoutMs: Math.max(1000, Math.min(30 * 60 * 1000, Math.floor(options?.timeoutMs ?? 30000))),
		cancelSignal: "SIGTERM",
		killAfterMs: 3000,
		importPiAuth: false,
		updateChecksDisabled: true,
		telemetryDisabled: true,
		envAllowlist: [
			"HOME",
			"PATH",
			"REPI_PRODUCT",
			"REPI_OFFLINE",
			"REPI_SKIP_VERSION_CHECK",
			"REPI_SKIP_PACKAGE_UPDATE_CHECK",
			"REPI_TELEMETRY",
			"REPI_AUTH_TOKEN",
			"REPI_MODEL_API_KEY",
			"REPI_BASE_URL",
			"REPI_MODEL_BASE_URL",
			"REPI_PROVIDER",
			"REPI_MODEL_PROVIDER",
			"REPI_PROVIDER_ID",
			"REPI_MODEL",
			"REPI_MODEL_ID",
			"REPI_MODEL_API",
			"REPI_API",
			"REPI_SUBAGENT_MODEL",
			"REPI_SUBAGENT_PROVIDER",
			"REPI_CONTEXT_WINDOW",
			"REPI_MODEL_CONTEXT_WINDOW",
			"REPI_AUTO_COMPACT_WINDOW",
			"REPI_MODEL_AUTO_COMPACT_WINDOW",
			"REPI_MAX_TOKENS",
			"REPI_MODEL_MAX_TOKENS",
			"REPI_MAX_OUTPUT_TOKENS",
			"OPENAI_COMPAT_BASE_URL",
			"OPENAI_COMPAT_API_KEY",
			"ANTHROPIC_COMPAT_BASE_URL",
			"ANTHROPIC_COMPAT_API_KEY",
			"LOCAL_OPENAI_BASE_URL",
			"LOCAL_OPENAI_API_KEY",
		],
		envDenylist: ["GITHUB_TOKEN", "GITHUB_TOKEN_FOR_PUSH", "ANTHROPIC_AUTH_TOKEN", "NPM_TOKEN"],
	};
}
