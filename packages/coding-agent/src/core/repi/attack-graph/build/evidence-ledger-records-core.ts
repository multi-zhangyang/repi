/** Evidence ledger record core nodes/tasks/edges. */
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { reverseEvidenceRecordNote } from "./evidence-ledger-reverse.ts";

export function appendEvidenceLedgerRecordCore(ctx: AttackGraphBuildCtx, record: any): { commandOutputId?: string } {
	const parentId = ctx.mission ? `mission:${ctx.mission.id}` : undefined;
	let commandId: string | undefined;
	let commandOutputId: string | undefined;
	ctx.addTask({
		id: record.evidenceId,
		parentId,
		kind: "evidence",
		label: record.title,
		status: `${record.kind}/P${record.priority}`,
		path: record.path,
		evidence: [record.fact, record.confidence].filter((item): item is string => Boolean(item)).slice(0, 3),
		note:
			reverseEvidenceRecordNote(
				record.title,
				`${record.kind ?? ""} ${record.fact ?? ""} ${record.command ?? ""} ${record.path ?? ""}`,
			) || record.timestamp,
	});
	if (record.command) {
		commandId = `command:${record.index}:${ctx.slug(record.command)}`;
		ctx.addNode({
			id: commandId,
			kind: "command",
			label: ctx.truncateMiddle(record.command, 160),
			status: "recorded",
			note: record.title,
		});
		ctx.addTask({
			id: commandId,
			parentId: record.evidenceId,
			kind: "command",
			label: ctx.truncateMiddle(record.command, 180),
			status: "recorded",
			command: record.command,
		});
		ctx.addEdge({ from: commandId, to: record.evidenceId, kind: "produces", label: "stdout/fact" });
		if (record.fact || record.hash || record.verify) {
			const outputSurface = [record.fact, record.hash, record.verify, record.confidence]
				.filter((item): item is string => Boolean(item))
				.join("\n");
			const outputHash = record.hash ?? ctx.sha256Text(outputSurface);
			commandOutputId = `artifact:command-output:${record.index}:${ctx.slug(record.title)}`;
			ctx.addNode({
				id: commandOutputId,
				kind: "artifact",
				label: `evidence-output sha256=${outputHash.slice(0, 16)}`,
				status: "evidence-output-hash",
				note: ctx.truncateMiddle(outputSurface.replace(/\s+/g, " "), 260),
			});
			ctx.addTask({
				id: commandOutputId,
				parentId: commandId,
				kind: "artifact",
				label: `evidence-output sha256=${outputHash.slice(0, 16)}`,
				status: "evidence-output-hash",
				evidence: [
					`output_sha256=${outputHash}`,
					record.fact ? `fact=${ctx.truncateMiddle(record.fact, 260)}` : undefined,
					record.confidence ? `confidence=${record.confidence}` : undefined,
				].filter((item): item is string => Boolean(item)),
			});
			ctx.addEdge({ from: commandId, to: commandOutputId, kind: "produces", label: "evidence-output-hash" });
			ctx.addEdge({ from: commandOutputId, to: record.evidenceId, kind: "supports", label: "command-output" });
		}
	}
	if (record.path) {
		const artifactId = `artifact:${record.index}:${ctx.slug(ctx.artifactBasename(record.path))}`;
		ctx.addNode({
			id: artifactId,
			kind: "artifact",
			label: ctx.artifactBasename(record.path),
			status: record.hash ? "hashed" : "referenced",
			path: record.path,
			note: record.hash,
		});
		ctx.addTask({
			id: artifactId,
			parentId: record.evidenceId,
			kind: "artifact",
			label: ctx.artifactBasename(record.path),
			status: record.hash ? "hashed" : "referenced",
			path: record.path,
			note: record.hash,
		});
		ctx.addEdge({ from: record.evidenceId, to: artifactId, kind: "produces", label: "artifact" });
		ctx.sourceArtifacts.push(record.path);
	}
	return { commandOutputId };
}
