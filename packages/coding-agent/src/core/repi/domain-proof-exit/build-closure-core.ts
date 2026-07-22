/** Domain proof-exit closure builder. */

import { readCurrentMission } from "../mission.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { interestingLines, uniqueNonEmpty } from "../text.ts";
import { buildToolchainDomainCapability } from "../toolchain-runtime.ts";
import { domainProofExitArtifactCorpus } from "./build-corpus.ts";
import {
	domainProofExitNextCommands,
	proofExitExpectedEvidence,
	proofExitRegexes,
	toolchainDomainIdForRoute,
} from "./pure.ts";
import type { DomainProofExitClosureStatus, DomainProofExitRowV1 } from "./types.ts";

function normalizeDomainProofFilter(domainFilter?: string, routeDomain?: string): string | undefined {
	const raw = domainFilter?.trim();
	if (!raw) return toolchainDomainIdForRoute(routeDomain);
	// Models sometimes pass target URLs or free text as domain=; never use those as domain ids/paths.
	if (/^https?:\/\//i.test(raw) || /[/\\:]/.test(raw) || raw.length > 48) {
		return toolchainDomainIdForRoute(routeDomain);
	}
	const lower = raw.toLowerCase();
	const aliases: Record<string, string> = {
		web: "web-api",
		"web-api": "web-api",
		web_api: "web-api",
		api: "web-api",
		"frontend-js": "frontend-js",
		js: "frontend-js",
		native: "rev-native",
		"rev-native": "rev-native",
		pwn: "pwn",
		mobile: "mobile",
	};
	if (aliases[lower]) return aliases[lower];
	// Accept known-looking domain ids; otherwise fall back to route.
	if (/^[a-z][a-z0-9-]{1,40}$/.test(lower)) return lower;
	return toolchainDomainIdForRoute(routeDomain);
}

export function buildDomainProofExitClosure(mission = readCurrentMission(), domainFilter?: string): any {
	const routeDomain = mission?.route.domain;
	const domainId = normalizeDomainProofFilter(domainFilter, routeDomain);
	const capability = domainId ? buildToolchainDomainCapability(domainId).domains[0] : undefined;
	const corpus = domainProofExitArtifactCorpus(mission);
	if (!mission || !domainId || !capability) {
		return {
			kind: "DomainProofExitClosureV1",
			schemaVersion: 1,
			generatedAt: new Date().toISOString(),
			missionId: mission?.id,
			routeDomain,
			domainId,
			status: "partial",
			toolchainStatus: capability?.status,
			artifactCorpusHash: corpus.hash,
			artifactSources: corpus.sources,
			rows: [],
			matchedProofExits: [],
			missingProofExits: [],
			blockers: mission
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
			const text = readText(path);
			return regexes.some((pattern: any) => pattern.test(text));
		});
		return {
			proofExit,
			status: matchedLines.length || matchedArtifacts.length ? "matched" : "missing",
			matchedArtifacts: matchedArtifacts.slice(0, 8),
			matchedLines: matchedLines.slice(0, 8),
			expectedEvidence: proofExitExpectedEvidence(proofExit),
			nextCommands: domainProofExitNextCommands(domainId, proofExit, mission as any),
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
			? [`toolchain critical_gap for ${domainId}: ${capability.missingRequired.join(", ") || "requiredAny missing"}`]
			: []),
		...missingProofExits.map((proofExit: any) => `domain_proof_exit_missing:${domainId}:${proofExit}`),
	];
	return {
		kind: "DomainProofExitClosureV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		missionId: mission.id,
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
				...reverseDomainCaptureNextCommands({
					routeOrBlob: `${domainId} ${routeDomain ?? ""} domain_proof_exit`,
					target: mission?.task,
					includeGates: true,
				}).slice(0, 3),
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
