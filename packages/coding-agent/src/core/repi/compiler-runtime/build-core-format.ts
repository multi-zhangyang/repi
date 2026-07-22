/** Compiler output with reverse domain next. */

/** Compiler build/write/output with reverse domain next. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildCompiler } from "./build-core-build.ts";
import { writeCompilerArtifact } from "./build-core-write.ts";
import { formatCompiler, latestCompilerArtifactPath } from "./build-format-paths.ts";

export function buildCompilerOutput(
	action: "draft" | "show" | "final" = "draft",
	options: { target?: string } = {},
): string {
	if (action === "show") {
		const path = latestCompilerArtifactPath();
		if (!path) {
			const reverseNext = reverseDomainCaptureNextCommands({
				routeOrBlob: "compiler missing reverse",
				target: options.target,
			}).slice(0, 3);
			return [
				"compiler_report:",
				"status: missing",
				"next: re_compiler draft",
				"reverse_domain_next:",
				...reverseNext.map((cmd: any) => `- next: ${cmd}`),
			].join("\n");
		}
		return truncateMiddle(readText(path), 20000);
	}
	const compiler = buildCompiler({ target: options.target, mode: action });
	const path = writeCompilerArtifact(compiler);
	const base = formatCompiler(compiler, path);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${action} ${options.target ?? ""} compiler reverse`,
		target: options.target,
	}).slice(0, 3);
	return [base, "", "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)].join("\n");
}
