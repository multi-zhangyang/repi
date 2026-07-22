/** Reverse install surface: techniques. */
/**
 * Reverse/pentest tool registration (techniques + runtime tools).
 * Builders/runners stay in profile-runtime; this module only registers tools.
 */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import {
	ADVANCED_TECHNIQUES,
	formatTechniqueIndex,
	formatTechniquePlaybook,
	resolveTechniqueDomain,
	techniqueById,
	techniquesForDomain,
} from "../../techniques.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiTechniqueTool(registerTool: ToolRegistrar): void {
	registerTool({
		name: "re_techniques",
		label: "RE Advanced Techniques",
		description:
			"Pull concrete top-tier offensive-technique playbooks (pwn heap/web/crypto/reverse/mobile/identity-AD/cloud/malware/agent) with MITRE ATT&CK + CWE tags, triggers, ordered procedure, falsifiable proof-exit, pitfalls, and required tools. Use after re_route to ground execution in real high-skill methodology instead of tool-running.",
		promptSnippet:
			"Call re_techniques(domain=<domain>) for the playbook of advanced techniques in a routed domain, or re_techniques(id=<id>) for a single technique, before executing the technique.",
		promptGuidelines: [
			"After re_route resolves a domain, call re_techniques(domain=...) to load the concrete advanced-technique playbooks (not just names) with MITRE ATT&CK + CWE tags.",
			"Use re_techniques(id=<id>) to pull a single technique's full procedure + proof-exit + pitfalls when the decision core selects that technique.",
		],
		parameters: Type.Object({
			domain: Type.Optional(Type.String()),
			id: Type.Optional(Type.String()),
			intent: Type.Optional(Type.String()),
			format: Type.Optional(Type.Union([Type.Literal("index"), Type.Literal("playbook")])),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const format = params.format ?? (params.id || params.domain ? "playbook" : "index");
			if (format === "index" && !params.id && !params.domain) {
				return {
					content: [{ type: "text" as const, text: formatTechniqueIndex() }],
					details: { format: "index", count: ADVANCED_TECHNIQUES.length } as Record<string, unknown>,
				};
			}
			const entries: (typeof ADVANCED_TECHNIQUES)[number][] = [];
			if (params.id) {
				const entry = techniqueById(params.id);
				if (entry) entries.push(entry);
			} else if (params.domain) {
				const domain = resolveTechniqueDomain(params.domain);
				const domainEntries = domain ? techniquesForDomain(domain) : [];
				if (params.intent) {
					const needle = params.intent.toLowerCase();
					const filtered = domainEntries.filter(
						(entry: any) =>
							entry.name.toLowerCase().includes(needle) ||
							entry.triggers.toLowerCase().includes(needle) ||
							entry.procedure.some((step: any) => step.toLowerCase().includes(needle)),
					);
					entries.push(...(filtered.length > 0 ? filtered : domainEntries));
				} else {
					entries.push(...domainEntries);
				}
			}
			const text = formatTechniquePlaybook(entries);
			return {
				content: [{ type: "text" as const, text }],
				details: {
					format: "playbook",
					domain: params.domain,
					id: params.id,
					intent: params.intent,
					resolvedDomain: params.domain ? resolveTechniqueDomain(params.domain) : undefined,
					matched: entries.length,
				} as Record<string, unknown>,
			};
		},
	});
}
