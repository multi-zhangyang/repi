import { IMAGE_MODELS } from "./image-models.generated.ts";
import type { ImagesApi, ImagesModel } from "./types.ts";

const imageModelRegistry: Map<string, Map<string, ImagesModel<ImagesApi>>> = new Map();

for (const [provider, models] of Object.entries(IMAGE_MODELS)) {
	const providerModels = new Map<string, ImagesModel<ImagesApi>>();
	for (const [id, model] of Object.entries(models as Record<string, ImagesModel<ImagesApi>>)) {
		providerModels.set(id, model);
	}
	imageModelRegistry.set(provider, providerModels);
}

export function getImageModel(provider: string, modelId: string): ImagesModel<ImagesApi> | undefined {
	return imageModelRegistry.get(provider)?.get(modelId);
}

export function getImageProviders(): string[] {
	return Array.from(imageModelRegistry.keys());
}

export function getImageModels(provider: string): ImagesModel<ImagesApi>[] {
	const models = imageModelRegistry.get(provider);
	return models ? Array.from(models.values()) : [];
}
