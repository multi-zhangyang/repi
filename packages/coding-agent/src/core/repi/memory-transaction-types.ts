export type MemoryEventInput = {
	task?: string;
	route?: string;
	target?: string;
	source?: string;
	domainTags?: string[];
	artifactPaths?: string[];
	artifacts?: Array<{ path?: string; [key: string]: unknown }>;
	commands?: string[];
	title?: string;
	body?: string;
	[key: string]: unknown;
};

export type MemoryEventV1 = {
	kind: "MemoryEventV1";
	schemaVersion: 1;
	timestamp: string;
	task: string;
	route?: string;
	target?: string;
	source?: string;
	domainTags: string[];
	artifactPaths: string[];
	commands: string[];
	title?: string;
	body?: string;
	stub: true;
};

export type CaseMemoryV1 = {
	kind: "CaseMemoryV1";
	schemaVersion: 1;
	timestamp: string;
	task: string;
	route?: string;
	target?: string;
	stub: true;
};

export type MemoryAppendTransactionV1 = {
	kind: "MemoryAppendTransactionV1";
	schemaVersion: 1;
	timestamp: string;
	status: "stubbed";
	reason: string;
};

/** Configure hook retained for kernel DI symmetry; no runtime deps required. */
export type MemoryDepositionRuntimeInputV7 = {
	task?: string;
	route?: string;
	target?: string;
	command?: string;
	commands?: string[];
	stage?: string;
	status?: string;
	outcome?: string;
	reason?: string;
	lessons?: string[];
	failurePatterns?: string[];
	reuseRules?: string[];
	artifactPaths?: string[];
	artifacts?: Array<{ path?: string; [key: string]: unknown }>;
	memoryEventId?: string;
	caseSignature?: string;
	[key: string]: unknown;
};

export type MemoryDepositionRuntimeEventV7 = {
	kind: "MemoryDepositionRuntimeEventV7";
	schemaVersion: 1;
	timestamp: string;
	task: string;
	route?: string;
	target?: string;
	status: "stubbed";
	reason: string;
	stub: true;
};

/** Product-default deposition: no bus write; keeps swarm/runtime call sites green. */
