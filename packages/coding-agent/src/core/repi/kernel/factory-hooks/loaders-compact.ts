/** Compact-resume lazy loaders for factory hooks. */
import { requireRepiModule } from "./loaders-require.ts";

function loadCompactResume(): Record<string, any> {
	try {
		return requireRepiModule("../compact-resume.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../compact-resume.js") as Record<string, any>;
	}
}
export function buildReconCompactionAutoResume(...args: any[]): any {
	return loadCompactResume().buildReconCompactionAutoResume(...args);
}
export function buildReconCompactionDetails(...args: any[]): any {
	return loadCompactResume().buildReconCompactionDetails(...args);
}
export function buildReconCompactionResumeContract(...args: any[]): any {
	return loadCompactResume().buildReconCompactionResumeContract(...args);
}
export function buildReconCompactionSummary(...args: any[]): any {
	return loadCompactResume().buildReconCompactionSummary(...args);
}
export function initialReconCompactionResumeTelemetry(...args: any[]): any {
	return loadCompactResume().initialReconCompactionResumeTelemetry(...args);
}
export function reconCompactionAutoResumePrompt(...args: any[]): any {
	return loadCompactResume().reconCompactionAutoResumePrompt(...args);
}
export function writeReconCompactionResumeTelemetry(...args: any[]): any {
	return loadCompactResume().writeReconCompactionResumeTelemetry(...args);
}
