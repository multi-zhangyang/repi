/** Tool-index missing-tool fallbacks (native reverse surrogates included). */

import { fallbackMobileWebMissingTools } from "./catalog-fallback-mobile-web.ts";
import { fallbackNativeMissingTools } from "./catalog-fallback-native.ts";

export function fallbackForMissingTools(
	command: { label: string; evidence: string; command: string },
	missingTools: string[],
	pack: { target?: string },
	index: Map<string, { present: boolean; path?: string }>,
): { label: string; command: string; evidence: string } | undefined {
	return (
		fallbackNativeMissingTools(command, missingTools, pack, index) ??
		fallbackMobileWebMissingTools(command, missingTools, pack, index)
	);
}
