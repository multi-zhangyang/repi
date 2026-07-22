/** Operator feedback category parse helper. */
export function operatorFeedbackCategory(row: string): string {
	return /\bcategory=([A-Za-z0-9_-]+)/i.exec(row)?.[1] ?? "unknown";
}
