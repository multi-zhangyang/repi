/** Autopilot output format with reverse footer. */
import { autopilotReverseCaptureFooter } from "./run-reverse.ts";

export function formatAutopilotRunOutput(params: {
	body: string;
	target?: string;
	route?: string;
	audit: string;
}): string {
	const footer = autopilotReverseCaptureFooter({
		target: params.target,
		route: params.route,
		audit: params.audit,
	});
	return footer ? `${params.body}\n${footer}` : params.body;
}
