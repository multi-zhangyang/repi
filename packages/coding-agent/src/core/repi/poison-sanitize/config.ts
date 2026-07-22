/** Poison sanitize configure + deps bus. */
export type PoisonSanitizeDeps = {
	[key: string]: any;
	buildMemoryStoreVerificationUnlocked: (...args: any[]) => any;
	caseMemoryPath: (...args: any[]) => any;
	containsRepiPoison: (...args: any[]) => any;
	invalidateDepositionChainCache: (...args: any[]) => any;
	memoryDepositionEventBusPath: (...args: any[]) => any;
	memoryDepositionEventHash: (...args: any[]) => any;
	memoryEventHash: (...args: any[]) => any;
	memoryEventsPath: (...args: any[]) => any;
	memoryPath: (...args: any[]) => any;
	normalizeHistoricalCommand: (...args: any[]) => any;
	readMemoryDepositionEvents: (...args: any[]) => any;
	readMemoryEvents: (...args: any[]) => any;
	rebuildCaseMemoryFromEvents: (...args: any[]) => any;
	sanitizeTargetForCommand: (...args: any[]) => any;
	writeFileAtomic: (...args: any[]) => any;

	redactRepiPoisonText?: (...args: any[]) => any;
	sanitizeMemoryCaseSignature?: (...args: any[]) => any;
	sanitizeMemoryCommands?: (...args: any[]) => any;
	sanitizeMemoryList?: (...args: any[]) => any;
	sanitizeMemoryRoute?: (...args: any[]) => any;
	sanitizeMemoryText?: (...args: any[]) => any;
};

let poisonSanitizeDeps: PoisonSanitizeDeps | null = null;

export function configurePoisonSanitize(deps: PoisonSanitizeDeps): void {
	poisonSanitizeDeps = deps;
}

function d(): PoisonSanitizeDeps {
	if (!poisonSanitizeDeps) {
		throw new Error("poison-sanitize not configured; call configurePoisonSanitize() from REPI kernel init");
	}
	return poisonSanitizeDeps;
}

export function buildMemoryStoreVerificationUnlocked(...args: any[]): any {
	return d().buildMemoryStoreVerificationUnlocked(...args);
}
export function caseMemoryPath(...args: any[]): any {
	return d().caseMemoryPath(...args);
}
export function containsRepiPoison(...args: any[]): any {
	return d().containsRepiPoison(...args);
}
export function invalidateDepositionChainCache(...args: any[]): any {
	return d().invalidateDepositionChainCache(...args);
}
export function memoryDepositionEventBusPath(...args: any[]): any {
	return d().memoryDepositionEventBusPath(...args);
}
export function memoryDepositionEventHash(...args: any[]): any {
	return d().memoryDepositionEventHash(...args);
}
export function memoryEventHash(...args: any[]): any {
	return d().memoryEventHash(...args);
}
export function memoryEventsPath(...args: any[]): any {
	return d().memoryEventsPath(...args);
}
export function memoryPath(...args: any[]): any {
	return d().memoryPath(...args);
}
export function normalizeHistoricalCommand(...args: any[]): any {
	return d().normalizeHistoricalCommand(...args);
}
export function readMemoryDepositionEvents(...args: any[]): any {
	return d().readMemoryDepositionEvents(...args);
}
export function readMemoryEvents(...args: any[]): any {
	return d().readMemoryEvents(...args);
}
export function rebuildCaseMemoryFromEvents(...args: any[]): any {
	return d().rebuildCaseMemoryFromEvents(...args);
}
export function sanitizeTargetForCommand(...args: any[]): any {
	return d().sanitizeTargetForCommand(...args);
}
export function writeFileAtomic(...args: any[]): any {
	return d().writeFileAtomic(...args);
}
