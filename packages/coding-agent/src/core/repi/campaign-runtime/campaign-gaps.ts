/** Campaign evidence gaps + pivot candidates (reverse-aware). */

import { textHasAny } from "../campaign-phases.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceRunsDir, recentMarkdownArtifacts } from "../storage.ts";

export function campaignEvidenceGaps(
	mission: any | undefined,
	map: any | undefined,
	graph: any,
	phases: any[],
): string[] {
	const gaps: string[] = [];
	if (!mission) gaps.push("no active mission");
	if (!map) gaps.push("no passive map artifact");
	if (recentMarkdownArtifacts(evidenceRunsDir(), 3).length === 0) gaps.push("no recent lane run artifact");
	for (const phase of phases) {
		if (phase.status === "ready")
			gaps.push(`phase ready but unproven: ${phase.name} requires ${phase.requiredEvidence.join(", ")}`);
		if (phase.status === "blocked") gaps.push(`phase blocked: ${phase.name}`);
	}
	for (const gap of graph?.gaps ?? []) gaps.push(`attack_graph: ${gap}`);
	const reverseOpen =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|web-authz|proof_exit|bind_ready/i.test(
			JSON.stringify({ mission, map, graph, phases }),
		);
	if (reverseOpen) {
		gaps.push("reverse runtime proof_exit capture pending");
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${mission?.route?.domain ?? ""} ${map?.target ?? ""} campaign reverse`,
			target: map?.target ?? mission?.task,
		}).slice(0, 4);
		for (const cmd of reverseNext) gaps.push(`next: ${cmd}`);
		gaps.push("next: re_domain_proof_exit show");
		gaps.push("next: re_complete audit");
	}
	return Array.from(new Set(gaps)).slice(0, 28);
}

export function campaignPivotCandidates(mission: any | undefined, phases: any[], map: any | undefined): string[] {
	const text = [
		mission?.task,
		mission?.route?.domain,
		map?.signals?.join?.("\n"),
		phases.map((phase: any) => phase.name).join(" "),
	].join("\n");
	const pivots: string[] = [];
	if (textHasAny(text, [/jwt|cookie|session|oauth|api key|token/i]))
		pivots.push(
			"web-authz → credential-identity: reuse token/cookie/API key only after scope and negative-control proof",
		);
	if (textHasAny(text, [/websocket|ws\b|graphql|api/i]))
		pivots.push(
			"web-authz → replay/state machine: capture request order, WS frames, storage and auth matrix before PoC expansion",
		);
	if (textHasAny(text, [/cloud|k8s|metadata|serviceaccount|iam|rbac/i]))
		pivots.push(
			"credential-identity → cloud-container: test serviceaccount/metadata/IAM/RBAC as a minimal privilege edge",
		);
	if (textHasAny(text, [/pwn|exploit|binary|elf|rop|crash/i]))
		pivots.push("pwn-exploit → exploit reliability: convert primitive into replay matrix and artifact bundle");
	if (textHasAny(text, [/firmware|pcap|malware|ioc|dfir/i]))
		pivots.push(
			"firmware-pcap-dfir → credential-identity: extract secrets/IOCs/flows and verify usability separately",
		);
	if (textHasAny(text, [/agent|prompt|mcp|memory|tool/i]))
		pivots.push(
			"agentsec-boundary → evidence ledger: separate untrusted content injection from trusted tool outputs",
		);
	if (pivots.length === 0) pivots.push("recon-map → active lane: prove one end-to-end path before lateral expansion");
	return Array.from(new Set(pivots)).slice(0, 12);
}
