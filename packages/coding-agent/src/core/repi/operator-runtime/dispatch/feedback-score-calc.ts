/** Dispatcher feedback score calculation. */
export function dispatcherFeedbackScore(_command: any, status: any, category: any): number {
	if (status === "passed") return 90;
	if (status === "failed") return 25;
	if (String(category ?? "").includes("strong")) return 80;
	return 50;
}
