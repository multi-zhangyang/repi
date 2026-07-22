/** Narrative tool: re_note. */
import { Type } from "typebox";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiNoteTool(registerTool: ToolRegistrar, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_note",
		label: "RE Project Note",
		description:
			"Project-scoped memory notes (Claude-Code-style: one file per fact + MEMORY.md index). Keep durable project facts that should persist across sessions in THIS project only — user/role, feedback/guidance, project goals/constraints, reference pointers. Actions: write (create/replace a named note), list (index), read (full body), delete. Notes are isolated to the current project cwd (no cross-project pollution). Use for concise durable facts; use re_note for detailed reverse/pentest experience distillation.",
		promptSnippet:
			"Persist durable project-scoped facts (user/feedback/project/reference) with re_note; they survive across sessions in this project only.",
		promptGuidelines: [
			"One fact per note; name is a lowercase dash-separated slug (e.g. user-prefers-quiet-tools).",
			"Use type=user (who the user is), feedback (how to work), project (goals/constraints), reference (external pointers/URLs).",
		],
		parameters: Type.Object({
			action: Type.Union([
				Type.Literal("write"),
				Type.Literal("list"),
				Type.Literal("read"),
				Type.Literal("delete"),
			]),
			name: Type.Optional(Type.String()),
			description: Type.Optional(Type.String()),
			type: Type.Optional(
				Type.Union([
					Type.Literal("user"),
					Type.Literal("feedback"),
					Type.Literal("project"),
					Type.Literal("reference"),
				]),
			),
			body: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			if (params.action === "list") {
				const entries = deps.listNotes();
				if (entries.length === 0) {
					return {
						content: [
							{
								type: "text" as const,
								text: "re_note list: no project notes yet. Use re_note action=write to create one.",
							},
						],
						details: { action: "list", count: 0 } as Record<string, unknown>,
					};
				}
				const text = [
					"re_note list:",
					...entries.map(
						(e: { type: string; name: string; description: string }) =>
							`- [${e.type}] ${e.name} — ${e.description}`,
					),
				].join("\n");
				return {
					content: [{ type: "text" as const, text }],
					details: { action: "list", count: entries.length, notes: entries } as Record<string, unknown>,
				};
			}
			if (params.action === "read") {
				if (!params.name) {
					return {
						content: [{ type: "text" as const, text: "re_note read: missing required param `name`." }],
						details: { action: "read", error: true } as Record<string, unknown>,
					};
				}
				const note = deps.readNote(params.name);
				if (!note) {
					return {
						content: [{ type: "text" as const, text: `re_note read: note "${params.name}" not found.` }],
						details: { action: "read", error: true, name: params.name } as Record<string, unknown>,
					};
				}
				return {
					content: [
						{
							type: "text" as const,
							text: `# ${note.name}\ntype: ${note.type}\ndescription: ${note.description}\n\n${note.body}`,
						},
					],
					details: { action: "read", name: note.name, type: note.type } as Record<string, unknown>,
				};
			}
			if (params.action === "delete") {
				if (!params.name) {
					return {
						content: [{ type: "text" as const, text: "re_note delete: missing required param `name`." }],
						details: { action: "delete", error: true } as Record<string, unknown>,
					};
				}
				const res = deps.deleteNote(params.name);
				return {
					content: [
						{
							type: "text" as const,
							text: res.ok ? `re_note delete: removed "${params.name}".` : `re_note delete: ${res.error}`,
						},
					],
					details: { action: "delete", ok: res.ok } as Record<string, unknown>,
				};
			}
			// action === "write"
			if (!params.name || !params.description || !params.body) {
				return {
					content: [{ type: "text" as const, text: "re_note write: requires `name`, `description`, and `body`." }],
					details: { action: "write", error: true } as Record<string, unknown>,
				};
			}
			const res = deps.writeNote({
				name: params.name,
				description: params.description,
				type: (params.type ?? "project") as "user" | "feedback" | "project" | "reference",
				body: params.body,
			});
			if (!res.ok) {
				return {
					content: [{ type: "text" as const, text: `re_note write: ${res.error}` }],
					details: { action: "write", error: true } as Record<string, unknown>,
				};
			}
			return {
				content: [{ type: "text" as const, text: `re_note write: saved "${params.name}" -> ${res.path}` }],
				details: { action: "write", name: params.name, path: res.path } as Record<string, unknown>,
			};
		},
	});
}
