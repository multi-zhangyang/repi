/** Operator reverse domain next seeding. */
import { readCurrentMission } from "../mission.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

function reverseGateReady(): boolean {
	try {
		const mission = readCurrentMission();
		// Stop reverse_next thrash once reverse proof binds — do not wait for full optional
		// orchestration audit.ready (soft-fill pending must not re-queue adapters).
		return Boolean(
			mission?.checkpoints?.some(
				(c: { name?: string; status?: string }) =>
					(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven") && c.status === "done",
			),
		);
	} catch {
		return false;
	}
}

export function operatorReverseNextActions(target?: string, route?: string): string[] {
	if (reverseGateReady()) return ["write HARNESS_BUGS/PROOF only"];
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready|crypto|stego|dfir|cloud|agent|memory|identity|ad/i.test(
			`${target ?? ""} ${route ?? ""}`,
		)
	) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: `${target ?? ""} ${route ?? ""} operator`,
		target,
		includeGates: true,
	}).slice(0, 4);
}
