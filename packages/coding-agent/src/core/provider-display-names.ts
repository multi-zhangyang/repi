/**
 * REPI ships no built-in third-party provider display catalog.
 * Names come from models.json / REPI_PROVIDER_NAME / extension registration.
 */
export const BUILT_IN_PROVIDER_DISPLAY_NAMES: Record<string, string> = {
	"repi-env": "REPI environment model",
};

export function getProviderDisplayName(providerId: string): string {
	return BUILT_IN_PROVIDER_DISPLAY_NAMES[providerId] ?? providerId;
}
