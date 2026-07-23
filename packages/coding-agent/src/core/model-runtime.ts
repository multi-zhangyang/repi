/**
 * ModelRuntime — Pi 0.80-aligned facade over AuthStorage + ModelRegistry.
 *
 * REPI still uses the legacy AuthStorage/ModelRegistry storage shape, but product
 * and SDK callers should depend on this unified surface so a full ModelRuntime
 * migration can land without rewriting call sites.
 *
 * Not a 1:1 copy of upstream Pi 0.80 ModelRuntime; it preserves REPI env-first
 * model config (REPI_* / models.json / registerProvider) while presenting a
 * single refresh/find/auth entrypoint.
 */

import { join } from "node:path";
import type { Api, Model } from "@repi/ai";
import { getAgentDir } from "../config.ts";
import { AuthStorage } from "./auth-storage.ts";
import { ModelRegistry, type ProviderConfigInput } from "./model-registry.ts";

export type ModelRuntimeCreateOptions = {
	/** Path to auth.json; defaults to agent dir auth.json. */
	authPath?: string;
	/** Path to models.json; defaults to agent dir models.json. */
	modelsJsonPath?: string;
};

export class ModelRuntime {
	readonly authStorage: AuthStorage;
	readonly modelRegistry: ModelRegistry;

	private constructor(authStorage: AuthStorage, modelRegistry: ModelRegistry) {
		this.authStorage = authStorage;
		this.modelRegistry = modelRegistry;
	}

	/** Create a disk-backed runtime (auth.json + models.json under agent dir). */
	static create(options: ModelRuntimeCreateOptions = {}): ModelRuntime {
		const auth = AuthStorage.create(options.authPath);
		const modelsJsonPath = options.modelsJsonPath ?? join(getAgentDir(), "models.json");
		const registry = ModelRegistry.create(auth, modelsJsonPath);
		return new ModelRuntime(auth, registry);
	}

	/** Wrap existing legacy instances (CLI/main already built AuthStorage/ModelRegistry). */
	static from(authStorage: AuthStorage, modelRegistry: ModelRegistry): ModelRuntime {
		return new ModelRuntime(authStorage, modelRegistry);
	}

	/** In-memory runtime for tests. */
	static inMemory(authStorage: AuthStorage = AuthStorage.inMemory()): ModelRuntime {
		return new ModelRuntime(authStorage, ModelRegistry.inMemory(authStorage));
	}

	/** Reload models.json + REPI_* env providers (Pi-style catalog refresh entry). */
	refresh(): void {
		this.modelRegistry.refresh();
	}

	/** Alias for refresh() — matches Pi "update models" wording. */
	refreshModels(): void {
		this.refresh();
	}

	getAll(): Model<Api>[] {
		return this.modelRegistry.getAll();
	}

	getAvailable(): Model<Api>[] {
		return this.modelRegistry.getAvailable();
	}

	find(provider: string, modelId: string): Model<Api> | undefined {
		return this.modelRegistry.find(provider, modelId);
	}

	hasConfiguredAuth(model: Model<Api>): boolean {
		return this.modelRegistry.hasConfiguredAuth(model);
	}

	registerProvider(providerName: string, config: ProviderConfigInput): void {
		this.modelRegistry.registerProvider(providerName, config);
	}

	unregisterProvider(providerName: string): void {
		this.modelRegistry.unregisterProvider(providerName);
	}

	getError(): string | undefined {
		return this.modelRegistry.getError();
	}

	/** Escape hatch while call sites migrate off ModelRegistry. */
	getRegistry(): ModelRegistry {
		return this.modelRegistry;
	}

	/** Escape hatch while call sites migrate off AuthStorage. */
	getAuth(): AuthStorage {
		return this.authStorage;
	}
}
