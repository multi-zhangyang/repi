/** Process-local capture thrash lock for concurrent/session reverse bind. */
import { readCurrentMission } from "../../mission.ts";

const inflight = new Set<string>();
const reverseBoundMissionIds = new Set<string>();
/** Session-level reverse bind: survives mission-id churn within one print/agent process. */
let reverseBoundSession = false;

function missionId(): string {
	try {
		return String(readCurrentMission()?.id ?? "none");
	} catch {
		return "none";
	}
}

function missionKey(kind: string): string {
	return `${missionId()}::${kind}`;
}

/** Returns true if this caller owns the capture slot; false if another run is already in flight. */
export function tryAcquireCaptureSlot(kind: string): boolean {
	const key = missionKey(kind);
	if (inflight.has(key)) return false;
	// Session reverse already bound: no new capture owner.
	if (reverseBoundSession) return false;
	inflight.add(key);
	return true;
}

export function releaseCaptureSlot(kind: string): void {
	inflight.delete(missionKey(kind));
}

export function markMissionReverseBound(id?: string): void {
	reverseBoundSession = true;
	const mid = id ?? missionId();
	if (mid) reverseBoundMissionIds.add(mid);
}

export function isMissionReverseBound(id?: string): boolean {
	if (reverseBoundSession) return true;
	const mid = id ?? missionId();
	return Boolean(mid && reverseBoundMissionIds.has(mid));
}

/** Clear on genuine new-mission re_route (domain change / fresh blackboard). */
export function clearMissionReverseBound(): void {
	reverseBoundSession = false;
	reverseBoundMissionIds.clear();
	inflight.clear();
}
