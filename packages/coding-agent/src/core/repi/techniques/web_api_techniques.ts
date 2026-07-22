/**
 * Technique catalog slice: web-api.
 */
import type { TechniqueEntry } from "./types.ts";
import { WEB_API_AUTH_TECHNIQUES } from "./web_api_auth_techniques.ts";
import { WEB_API_INJECT_TECHNIQUES } from "./web_api_inject_techniques.ts";
import { WEB_API_SURFACE_TECHNIQUES } from "./web_api_surface_techniques.ts";

export const WEB_API_TECHNIQUES: readonly TechniqueEntry[] = [
	...WEB_API_AUTH_TECHNIQUES,
	...WEB_API_INJECT_TECHNIQUES,
	...WEB_API_SURFACE_TECHNIQUES,
];
