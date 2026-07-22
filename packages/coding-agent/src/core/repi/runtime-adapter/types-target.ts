/** Runtime adapter target/parser summary types. */
import type { RuntimeAdapterParserRuleV1, RuntimeAdapterTargetKind } from "./types-base.ts";

export type RuntimeAdapterTargetSignalV1 = {
	adapterId: string;
	targetKind: RuntimeAdapterTargetKind;
	reason: string;
	evidenceRank: "runtime_artifact" | "network" | "served_asset" | "process_config";
};

export type RuntimeAdapterTargetProfileV1 = {
	kind: "RuntimeAdapterTargetProfileV1";
	schemaVersion: 1;
	target: string;
	exists: boolean;
	pathKind?: "file" | "directory";
	magic?: string;
	targetKinds: RuntimeAdapterTargetKind[];
	adapterIds: string[];
	signals: RuntimeAdapterTargetSignalV1[];
	reasons: string[];
};

export type RuntimeAdapterParserSignalSummaryV1 = {
	matchedRules: number;
	totalRules: number;
	matchCount: number;
	evidenceRanks: Array<RuntimeAdapterParserRuleV1["evidenceRank"]>;
	matchedProofExitSignals: string[];
	missingProofExitSignals: string[];
};

export type RuntimeAdapterToolPresence = (tool: string) => boolean | undefined;
