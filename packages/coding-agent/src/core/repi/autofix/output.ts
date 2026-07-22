/** Autofix plan/show/apply output with reverse domain next. */

import { formatAutofix } from "../autofix-format.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildAutofix } from "./build-core.ts";
import { latestAutofixArtifactPath } from "./helpers.ts";
import { writeAutofixArtifact } from "./write.ts";

export function buildAutofixOutput(
	action: "plan" | "show" | "apply" = "plan",
	options: { target?: string } = {},
): string {
	if (action === "show") {
		const path = latestAutofixArtifactPath();
		if (!path) return "autofix_plan:\nstatus: missing\nnext: re_autofix plan";
		return truncateMiddle(readText(path), 20000);
	}
	const autofix = buildAutofix({ target: options.target, mode: action === "apply" ? "apply" : "plan" });
	const path = writeAutofixArtifact(autofix);
	const __out = formatAutofix(autofix, path);
	const blob = `${String(__out)}\n${options.target ?? ""}`;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|proof_exit|bind_ready|frontend|js|browser|authz|web/i.test(
			blob,
		);
	if (reverseHeavy && !/partial_runtime_capture|runtime_capture_strong/.test(String(__out))) {
		const next = reverseDomainCaptureNextCommands({
			routeOrBlob: blob,
			target: options.target,
			includeGates: true,
		}).map((cmd: any) => (cmd.startsWith("reverse_runtime_capture_gate:") ? `- ${cmd}` : `- next: ${cmd}`));
		return [String(__out), "", "reverse_runtime_capture_gate:", ...next].join("\n");
	}
	return __out;
}
