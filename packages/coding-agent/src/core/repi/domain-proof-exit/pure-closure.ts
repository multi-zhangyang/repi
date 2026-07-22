/** Build domain proof-exit closure rows/status from capability+corpus. */

import { interestingLines, uniqueNonEmpty } from "../text.ts";
import { proofExitExpectedEvidence, proofExitRegexes } from "./matchers.ts";
import { domainProofExitNextCommands } from "./next-commands.ts";
import type {
	DomainProofExitCapabilitySlice,
	DomainProofExitClosureStatus,
	DomainProofExitClosureV1,
	DomainProofExitCorpus,
	DomainProofExitRowV1,
} from "./types.ts";

export function buildDomainProofExitClosureFromParts(params: {
	missionId?: string;
	routeDomain?: string;
	domainId?: string;
	capability?: DomainProofExitCapabilitySlice;
	corpus: DomainProofExitCorpus;
	readArtifactText: (path: string) => string;
	lane?: string;
	target?: string;
}): DomainProofExitClosureV1 {
	const { missionId, routeDomain, domainId, capability, corpus, readArtifactText, lane, target } = params;
	if (!missionId || !domainId || !capability) {
		return {
			kind: "DomainProofExitClosureV1",
			schemaVersion: 1,
			generatedAt: new Date().toISOString(),
			missionId,
			routeDomain,
			domainId,
			status: "partial",
			toolchainStatus: capability?.status,
			artifactCorpusHash: corpus.hash,
			artifactSources: corpus.sources,
			rows: [],
			matchedProofExits: [],
			missingProofExits: [],
			blockers: missionId
				? ["domain proof-exit route is not mapped to a specialized toolchain domain"]
				: ["no active mission"],
			nextRuntimeCommands: ["re_mission new <task>", "re_route <task>", "re_toolchain_domain show"],
		};
	}
	const rows = capability.proofExit.map<DomainProofExitRowV1>((proofExit) => {
		const regexes = proofExitRegexes(proofExit);
		const matchedLines = uniqueNonEmpty(
			regexes.flatMap((pattern: any) => interestingLines(corpus.text, pattern, 6)),
			10,
		);
		const matchedArtifacts = corpus.sources.filter((path: any) => {
			const text = readArtifactText(path);
			return regexes.some((pattern: any) => pattern.test(text));
		});
		return {
			proofExit,
			status: matchedLines.length || matchedArtifacts.length ? "matched" : "missing",
			matchedArtifacts: matchedArtifacts.slice(0, 8),
			matchedLines: matchedLines.slice(0, 8),
			expectedEvidence: proofExitExpectedEvidence(proofExit),
			nextCommands: domainProofExitNextCommands(domainId, proofExit, { lane, target }),
		};
	});
	const missingProofExits = rows.filter((row: any) => row.status === "missing").map((row: any) => row.proofExit);
	const matchedProofExits = rows.filter((row: any) => row.status === "matched").map((row: any) => row.proofExit);
	const status: DomainProofExitClosureStatus =
		missingProofExits.length === 0
			? "passed"
			: matchedProofExits.length > 0 || corpus.sources.length > 1
				? "partial"
				: "blocked";
	const blockers = [
		...(capability.status === "blocked"
			? [
					`toolchain critical_gap for ${domainId}: ${(capability.missingRequired ?? []).join(", ") || "requiredAny missing"}`,
				]
			: []),
		...missingProofExits.map((proofExit: any) => `domain_proof_exit_missing:${domainId}:${proofExit}`),
	];
	return {
		kind: "DomainProofExitClosureV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		missionId,
		routeDomain,
		domainId,
		status,
		toolchainStatus: capability.status,
		artifactCorpusHash: corpus.hash,
		artifactSources: corpus.sources,
		rows,
		matchedProofExits,
		missingProofExits,
		blockers,
		nextRuntimeCommands: uniqueNonEmpty(
			[
				`re_toolchain_domain show ${domainId}`,
				...rows.filter((row: any) => row.status === "missing").flatMap((row: any) => row.nextCommands),
				"re_verifier matrix",
				"re_proof_loop run <target> 4 2",
				"re_complete audit",
			],
			14,
		),
	};
}
