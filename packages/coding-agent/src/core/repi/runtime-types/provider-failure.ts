/** Runtime types: provider failure injection. */
import type { RepairQueueItemV1 } from "../failure-repair/types.ts";
import type { FailureLedgerEventV1 } from "./failure.ts";

export type ProviderFailureInjectionCaseV1 = {
	kind: "ProviderFailureInjectionCaseV1";
	schemaVersion: 1;
	caseId: string;
	providerName: string;
	api: "openai-completions" | "anthropic-messages";
	modelId: string;
	failureMode: "http_500" | "malformed_sse" | "anthropic_error_event" | "timeout" | "connection_reset";
	status: "pass" | "blocked";
	exitCode: number | null;
	signal: string | null;
	request: {
		method?: string;
		path?: string;
		model?: string;
		stream?: boolean;
		bodySha256?: string;
	};
	stdoutSha256: string;
	stderrSha256: string;
	requestLogSha256: string;
	transcriptSha256: string;
	failureId: string;
	repairId: string;
	assertions: {
		requestSeen: boolean;
		exitNonZero: boolean;
		failureTextCaptured: boolean;
		failureRepairLinked: boolean;
		noLiteralSecrets: boolean;
		noPiHomeImport: boolean;
		noUpdateBanner: boolean;
	};
};

export type ProviderFailureInjectionReportV1 = {
	kind: "ProviderFailureInjectionReportV1";
	schemaVersion: 1;
	generatedAt: string;
	isolatedHome: string;
	workspace: string;
	cases: ProviderFailureInjectionCaseV1[];
	failureLedgerEvents: FailureLedgerEventV1[];
	repairQueue: RepairQueueItemV1[];
	failureRepairValidation: {
		ok: boolean;
		failureCount: number;
		repairCount: number;
	};
	writebackProbe: {
		status: "pass" | "blocked";
		writeback: {
			failurePath: string;
			repairPath: string;
		};
		validation: {
			ok: boolean;
			failureCount: number;
			repairCount: number;
		};
	};
};
