/** Profile-check critical/reverse capability markers. */
import { slug } from "../text.ts";
import { PROFILE_CHECK_CRITICAL_MARKERS, PROFILE_CHECK_REVERSE_CAPABILITY_MARKERS } from "./checks-markers-lists.ts";
import type { ProfileCheckRow, ProfileCheckStatus } from "./types.ts";

export function profileCheckCriticalMarkers(): string[] {
	return [...PROFILE_CHECK_CRITICAL_MARKERS];
}
export function profileCheckReverseCapabilityMarkers(): string[] {
	return [...PROFILE_CHECK_REVERSE_CAPABILITY_MARKERS];
}
export function profileCheckMarkerChecks(
	idPrefix: string,
	markers: string[],
	corpus: { paths: string[]; text: string },
): ProfileCheckRow[] {
	if (corpus.paths.length === 0) {
		return [
			{
				id: `${idPrefix}:source-corpus`,
				status: "warn",
				evidence: ["source_corpus=missing"],
				next: ["run from REPI repository root or install profile, then re_profile_check full"],
			},
		];
	}
	return markers.map((marker: any) => {
		const present = corpus.text.includes(marker);
		return {
			id: `${idPrefix}:${slug(marker).slice(0, 72)}`,
			status: present ? "pass" : "fail",
			evidence: [present ? `present=${marker}` : `missing=${marker}`, `source_files=${corpus.paths.length}`],
			next: present ? undefined : [`restore capability marker ${marker}`, "re_profile_check full"],
		};
	});
}
export function profileCheckVerdict(checks: ProfileCheckRow[]): ProfileCheckStatus {
	if (checks.some((check: any) => check.status === "fail")) return "fail";
	if (checks.some((check: any) => check.status === "warn")) return "warn";
	return "pass";
}
