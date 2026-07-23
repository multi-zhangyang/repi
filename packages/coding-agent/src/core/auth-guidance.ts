import { join } from "node:path";
import { getDocsPath, IS_REPI_PRODUCT } from "../config.ts";

const UNKNOWN_PROVIDER = "unknown";

export function getProviderLoginHelp(): string {
	if (IS_REPI_PRODUCT) {
		return [
			"Configure a model with REPI_* environment variables or ~/.repi/agent/models.json.",
			"Docs: https://github.com/multi-zhangyang/repi#快速开始",
			`Local package docs (if present):`,
			`  ${join(getDocsPath(), "repi-runtime-configuration.md")}`,
			`  ${join(getDocsPath(), "model-provider-formats.md")}`,
			"",
			"Quick env-only path (OpenAI-compatible gateway):",
			"  export REPI_AUTH_TOKEN=YOUR_TOKEN",
			"  export REPI_BASE_URL=https://gateway.example/v1",
			"  export REPI_PROVIDER=gateway  # optional label",
			"  export REPI_MODEL=vendor/model-id",
			"  export REPI_MODEL_API=openai-compatible",
			"  export REPI_AUTO_COMPACT_WINDOW=262144  # optional",
			"  repi doctor",
			"  repi --list-models",
			'  repi -p "Reply exactly: REPI_OK"',
			"",
			"Or interactive local config (credentials stay under ~/.repi, never commit):",
			"  repi model add",
			"  repi model login",
			"  repi model test",
		].join("\n");
	}
	return [
		"Use /login to log into a provider via OAuth or API key. See:",
		`  ${join(getDocsPath(), "providers.md")}`,
		`  ${join(getDocsPath(), "models.md")}`,
	].join("\n");
}

export function formatNoModelsAvailableMessage(): string {
	return `No models available. ${getProviderLoginHelp()}`;
}

export function formatNoModelSelectedMessage(): string {
	return `No model selected.\n\n${getProviderLoginHelp()}\n\nThen use /model to select a model.`;
}

export function formatNoApiKeyFoundMessage(provider: string): string {
	const providerDisplay = provider === UNKNOWN_PROVIDER ? "the selected model" : provider;
	return `No API key found for ${providerDisplay}.\n\n${getProviderLoginHelp()}`;
}
