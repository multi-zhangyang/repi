// REPI: empty built-in image model catalog.

import type { ImagesApi, ImagesModel } from "./types.ts";

export const IMAGE_MODELS = {} as const satisfies Record<string, Record<string, ImagesModel<ImagesApi>>>;
