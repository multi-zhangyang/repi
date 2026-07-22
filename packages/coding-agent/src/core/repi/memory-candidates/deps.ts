/** Memory candidates DI deps and product stubs (memory surface lean/off). */
export function configureMemoryCandidates(_deps: Record<string, never> = {}): void {}

export function searchMemoryEvents(..._args: any[]): any[] {
	return [];
}

export function latestCaseMemoryBySignature(..._args: any[]): any {
	return undefined;
}

export function buildMemorySemanticIndex(..._args: any[]): { injectionPacket: { entries: any[] } } {
	return { injectionPacket: { entries: [] } };
}

export function latestDispatcherFeedbackBoard(..._args: any[]): { hints: string[]; lines: string[]; path: string } {
	return { hints: [], lines: [], path: "" };
}
