// REPI: empty built-in model catalog.
// Runtime models come from REPI_* env vars, ~/.repi/agent/models.json, or extension registerProvider.
// Set REPI_KEEP_UPSTREAM_MODEL_CATALOG=1 when running this script to rebuild upstream catalog.

import type { Model } from "./types.ts";

export const MODELS = {} as const satisfies Record<string, Record<string, Model<any>>>;
