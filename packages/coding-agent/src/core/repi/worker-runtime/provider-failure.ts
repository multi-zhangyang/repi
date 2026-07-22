/** Provider failure injection + repair rollback verification. */
import type { RepiProviderFailureInjectionReportV1, RepiRepairRollbackPolicyV1 } from "./types.ts";

export function verifyProviderFailureInjectionReportV1(report: RepiProviderFailureInjectionReportV1): {
	ok: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	if (report.kind !== "ProviderFailureInjectionReportV1") errors.push("provider_failure_injection_kind_invalid");
	if ((report as any).schemaVersion !== 1 && (report as any).schemaVersion !== undefined)
		errors.push("provider_failure_injection_schema_version_invalid");
	if (!report.cases?.length) errors.push("provider_failure_injection_cases_missing");
	if (!report.isolatedHome?.includes(".repi") || report.isolatedHome.includes("/.pi/"))
		errors.push("provider_failure_injection_isolated_home_invalid");
	for (const item of report.cases ?? []) {
		const caseId = (item as any).caseId ?? "unknown";
		if ((item as any).kind !== "ProviderFailureInjectionCaseV1")
			errors.push(`provider_failure_injection_case_kind_invalid:${caseId}`);
		if (!(item as any).failureId || !(item as any).repairId)
			errors.push(`provider_failure_injection_link_missing:${caseId}`);
		const assertions = (item as any).assertions ?? {};
		if (!assertions.requestSeen) errors.push(`provider_failure_injection_request_missing:${caseId}`);
		if (!assertions.exitNonZero) errors.push(`provider_failure_injection_exit_zero:${caseId}`);
		if (!assertions.failureTextCaptured) errors.push(`provider_failure_injection_failure_text_missing:${caseId}`);
		if (!assertions.failureRepairLinked) errors.push(`provider_failure_injection_repair_unlinked:${caseId}`);
		if (!assertions.noLiteralSecrets) errors.push(`provider_failure_injection_literal_secret:${caseId}`);
		if (!assertions.noPiHomeImport) errors.push(`provider_failure_injection_pi_home_import:${caseId}`);
		if (!assertions.noUpdateBanner) errors.push(`provider_failure_injection_update_banner:${caseId}`);
	}
	if (!report.failureRepairValidation?.ok) errors.push("provider_failure_injection_validation_failed");
	if (report.writebackProbe?.status !== "pass" || !report.writebackProbe?.validation?.ok)
		errors.push("provider_failure_injection_writeback_failed");
	return { ok: errors.length === 0, errors };
}

export function verifyRepairRollbackPolicyV1(report: RepiRepairRollbackPolicyV1): { ok: boolean; errors: string[] } {
	const errors: string[] = [];
	if (report.kind !== "RepairRollbackPolicyV1") errors.push("repair_rollback_policy_kind_invalid");
	if ((report as any).schemaVersion !== 1 && (report as any).schemaVersion !== undefined)
		errors.push("repair_rollback_policy_schema_version_invalid");
	const assertions = report.assertions ?? ({} as any);
	if (!assertions.baselineCaptured) errors.push("repair_rollback_baseline_missing");
	if (!assertions.allowlistEnforced) errors.push("repair_rollback_allowlist_missing");
	if (!assertions.rollbackRestored) errors.push("repair_rollback_not_restored");
	if (!assertions.regressionChecksPassed) errors.push("repair_rollback_regression_failed");
	if (!assertions.noUnrelatedFileChanges) errors.push("repair_rollback_unrelated_changes");
	if (!assertions.failureRepairLinked) errors.push("repair_rollback_failure_unlinked");
	if (!report.failureRepairValidation?.ok) errors.push("repair_rollback_validation_failed");
	if ((report as any).rollback?.required && !(report as any).rollback?.restored)
		errors.push("repair_rollback_required_not_restored");
	return { ok: errors.length === 0, errors };
}
