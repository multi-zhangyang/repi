/**
 * Minimal Model fixtures for provider payload regression tests.
 * REPI ships an empty built-in catalog; tests must not rely on getModel(provider, id)
 * from models.generated.ts.
 */
import { registerModel } from "../src/models.ts";
import type { Model } from "../src/types.ts";

const zeroCost = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } as const;

export function fixtureOpenAICompletionsMini(): Model<"openai-completions"> {
	return {
		id: "gpt-4o-mini",
		name: "GPT-4o mini (fixture)",
		api: "openai-completions",
		provider: "openai",
		baseUrl: "https://api.openai.com/v1",
		reasoning: false,
		input: ["text"],
		cost: { ...zeroCost },
		contextWindow: 128000,
		maxTokens: 16384,
	};
}

export function fixtureAnthropicHaiku(): Model<"anthropic-messages"> {
	return {
		id: "claude-haiku-4-5",
		name: "Claude Haiku 4.5 (fixture)",
		api: "anthropic-messages",
		provider: "anthropic",
		baseUrl: "https://api.anthropic.com",
		reasoning: true,
		input: ["text"],
		cost: { ...zeroCost },
		contextWindow: 200000,
		maxTokens: 64000,
	};
}

export function fixtureAnthropicSonnet(): Model<"anthropic-messages"> {
	return {
		id: "claude-sonnet-4-5",
		name: "Claude Sonnet 4.5 (fixture)",
		api: "anthropic-messages",
		provider: "anthropic",
		baseUrl: "https://api.anthropic.com",
		reasoning: true,
		input: ["text", "image"],
		cost: { ...zeroCost },
		contextWindow: 200000,
		maxTokens: 64000,
	};
}

export function fixtureOpenRouterClaudeSonnet(): Model<"openai-completions"> {
	return {
		id: "anthropic/claude-sonnet-4",
		name: "OpenRouter Claude Sonnet 4 (fixture)",
		api: "openai-completions",
		provider: "openrouter",
		baseUrl: "https://openrouter.ai/api/v1",
		reasoning: true,
		input: ["text"],
		cost: { ...zeroCost },
		contextWindow: 200000,
		maxTokens: 64000,
	};
}

/** Register fixtures into the runtime model registry (idempotent enough for tests). */
export function seedProviderPayloadTestModels(): void {
	registerModel(fixtureOpenAICompletionsMini());
	registerModel(fixtureAnthropicHaiku());
	registerModel(fixtureAnthropicSonnet());
	registerModel(fixtureOpenRouterClaudeSonnet());
}
