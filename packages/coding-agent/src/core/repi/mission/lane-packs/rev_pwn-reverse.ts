/** Reverse-capture next seeds for reverse-heavy mission lane packs. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { MissionLane } from "../types.ts";

export function withReverseLaneNext(lanes: MissionLane[], routeBlob: string): MissionLane[] {
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: routeBlob,
		includeGates: true,
	}).slice(0, 2);
	if (!reverseNext.length) return lanes;
	return lanes.map((lane: any) => {
		if (!/proof|exploit|primitive|verify|runtime|behavior|emulate|replay|bundle|report/i.test(lane.name)) {
			return lane;
		}
		const extras = reverseNext.filter((cmd: any) => !lane.next.includes(cmd));
		return extras.length ? { ...lane, next: [...lane.next, ...extras] } : lane;
	});
}
