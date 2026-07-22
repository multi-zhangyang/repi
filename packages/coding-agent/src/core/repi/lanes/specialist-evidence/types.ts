/**
 * Specialist evidence analysis types.
 */
import type { LaneCommand } from "../../lane-commands/types.ts";

export type { LaneCommand } from "../../lane-commands/types.ts";

export type SpecialistEvidenceAnalysis = {
	findings: string[];
	followups: LaneCommand[];
	nextLane?: string;
};

export type EvidenceCritic = {
	score: number;
	verdict: "strong" | "partial" | "weak";
	deficits: string[];
	selfHeal: LaneCommand[];
};

export type LaneRunAnalysis = {
	findings: string[];
	followups: LaneCommand[];
	critic: EvidenceCritic;
	nextLane?: string;
};
