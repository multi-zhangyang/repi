/** Mission checkpoints by reverse/pentest domain (includes reverse_proof_exit_ready). */
import { MISSION_CHECKPOINTS_NATIVE } from "./checkpoints-domain-native.ts";
import { MISSION_CHECKPOINTS_OPS } from "./checkpoints-domain-ops.ts";
import { MISSION_CHECKPOINTS_WEB_MOBILE } from "./checkpoints-domain-web-mobile.ts";

export const MISSION_CHECKPOINTS_BY_DOMAIN: Record<string, string[]> = {
	...MISSION_CHECKPOINTS_NATIVE,
	...MISSION_CHECKPOINTS_WEB_MOBILE,
	...MISSION_CHECKPOINTS_OPS,
};
