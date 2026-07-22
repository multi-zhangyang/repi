/** Context-pack: buildContextOutput. */

import { formatContextPack } from "../context-format.ts";
import { buildContextPack, writeContextPackArtifact } from "../kernel/factory-hooks/loaders-context.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildExactResumeContextPack } from "./build.ts";
import { buildCompactResumeLedgerV2Report, formatCompactResumeLedgerV2 } from "./deps.ts";
import { contextRefLooksExplicit, latestContextPackArtifactPath } from "./index.ts";

export function buildContextOutput(
	action: "pack" | "show" | "resume" | "resume-ledger" = "pack",
	options: { target?: string; contextRef?: string } = {},
): string {
	if (action === "resume-ledger")
		return formatCompactResumeLedgerV2(buildCompactResumeLedgerV2Report({ write: true }));
	if (action === "show") {
		const path = latestContextPackArtifactPath();
		if (!path) return "context_pack:\nstatus: missing\nnext: re_context pack";
		return truncateMiddle(readText(path), 18000);
	}
	const contextRef =
		options.contextRef ??
		(action === "resume" && contextRefLooksExplicit(options.target) ? options.target : undefined);
	const pack =
		action === "resume" && contextRef
			? buildExactResumeContextPack(contextRef, options.target === contextRef ? undefined : options.target)
			: buildContextPack({ target: options.target, mode: action === "resume" ? "resume" : "pack" });
	const path = writeContextPackArtifact(pack);
	return formatContextPack(pack, path);
}
