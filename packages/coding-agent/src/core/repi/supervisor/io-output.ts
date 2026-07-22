/** Build supervisor output with reverse domain next. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { envBoolean, truncateMiddle } from "../text.ts";
import { buildSupervisor } from "./build.ts";
import { formatSupervisor } from "./format.ts";
import { writeSupervisorArtifact } from "./io-write.ts";
import { latestSupervisorArtifactPath } from "./paths.ts";
import { buildSupervisorLlmCritique } from "./review.ts";

export async function buildSupervisorOutput(
	action: "review" | "show" | "repair" = "review",
	options: { target?: string; task?: string; reasoning?: "rules" | "llm"; cwd?: string } = {},
): Promise<string> {
	if (action === "show") {
		const path = latestSupervisorArtifactPath();
		if (!path) return "supervisor_review:\nstatus: missing\nnext: re_supervisor review";
		return truncateMiddle(readText(path), 16000);
	}
	const supervisor = buildSupervisor({ ...options, mode: action === "repair" ? "repair" : "review" });
	if (options.reasoning === "llm" && !envBoolean("REPI_AGENT_THREAD")) {
		try {
			supervisor.llmCritique = await buildSupervisorLlmCritique(supervisor, {
				cwd: options.cwd,
				target: options.target,
				task: options.task,
			});
		} catch (error) {
			supervisor.llmCritique = `llm-supervisor: blocked (${truncateMiddle(String((error as Error).message ?? error), 200)})`;
		}
	}
	const path = writeSupervisorArtifact(supervisor);
	const body = formatSupervisor(supervisor, path);
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${options.target ?? ""} ${options.task ?? ""} ${body}`,
		);
	if (!reverseHeavy) return body;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `supervisor ${options.target ?? ""} ${options.task ?? ""}`,
		target: options.target,
		includeGates: true,
	}).slice(0, 2);
	if (!reverseNext.length) return body;
	return [body, "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)].join("\n");
}
