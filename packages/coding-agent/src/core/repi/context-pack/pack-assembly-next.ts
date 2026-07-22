/** Context-pack reverse-front nextCommands merge. */
import { contextPackReverseNextCommands } from "./pack-assembly-reverse.ts";

export function mergeContextPackAssemblyNextCommands(params: {
	route?: string;
	target?: string;
	mission?: any;
	repairQueue?: any;
	rawNextCommands?: string[];
}): string[] {
	const reverseNext = contextPackReverseNextCommands({
		route: params.route,
		target: params.target,
		mission: params.mission,
		repairQueue: params.repairQueue,
	});
	return Array.from(new Set([...(reverseNext ?? []), ...(params.rawNextCommands ?? [])])).slice(0, 24);
}
