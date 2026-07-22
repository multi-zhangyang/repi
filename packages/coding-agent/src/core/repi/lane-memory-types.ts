export type MemoryOutcome = "success" | "partial" | "failure" | "blocked" | "repair";

export type MemoryReuseFeedbackReference = {
	eventId: string;
	caseSignature?: string;
	score?: number;
	commands: string[];
};
