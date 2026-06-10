import { join } from "node:path";
import { getDocsPath, IS_REPI_PRODUCT } from "../config.ts";

const UNKNOWN_PROVIDER = "unknown";

export function getProviderLoginHelp(): string {
	if (IS_REPI_PRODUCT) {
		return [
			"Configure a provider in ~/.repi/agent/models.json or use /login for built-in OAuth/API-key providers. See:",
			`  ${join(getDocsPath(), "repi-runtime-configuration.md")}`,
			`  ${join(getDocsPath(), "model-provider-formats.md")}`,
			"",
			"Quick custom provider path:",
			"  1) write ~/.repi/agent/models.json with provider id, baseUrl, api, apiKey env reference, and models[].id",
			"  2) export the referenced API key environment variable",
			"  3) run: repi --list-models",
			"  4) run: repi --provider <provider-id> --model <model-id>",
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
