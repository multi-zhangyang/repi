/** Kernel artifact output builder. */

import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildKernelArtifact } from "./artifact-build.ts";
import { formatKernelArtifact, writeKernelArtifact } from "./artifact-format.ts";
import { latestKernelArtifactPath } from "./criteria.ts";

export function buildKernelOutput(
	action: "build" | "show" | "audit" = "build",
	options: { target?: string } = {},
): string {
	if (action === "show") {
		const path = latestKernelArtifactPath();
		if (!path) return "execution_kernel:\nstatus: missing\nnext: re_kernel build";
		return truncateMiddle(readText(path), 22000);
	}
	const kernel = buildKernelArtifact({ target: options.target, mode: action === "audit" ? "audit" : "build" });
	const path = writeKernelArtifact(kernel);
	return formatKernelArtifact(kernel, path);
}
