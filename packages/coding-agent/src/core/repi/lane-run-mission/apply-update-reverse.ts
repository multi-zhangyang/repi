/** Lane run mission reverse next annotation. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function laneRunMissionReverseNext(params: {
	pack: any;
	analysis: any;
	mission?: any;
	target?: string;
}): string[] {
	return reverseDomainCaptureNextCommands({
		routeOrBlob: `${params.pack?.lane ?? ""} ${params.analysis?.nextLane ?? ""} ${params.mission?.route?.domain ?? ""}`,
		target: params.target,
	}).slice(0, 2);
}
