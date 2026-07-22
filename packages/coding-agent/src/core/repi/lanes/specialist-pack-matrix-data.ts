/** Specialist lane command pack matrix data. */

import { RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX_EARLY } from "./specialist-pack-matrix-data-early.ts";
import { RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX_LATE } from "./specialist-pack-matrix-data-late.ts";
import type { ReLaneSpecialistDomainPackV1 } from "./specialist-pack-matrix-types.ts";

export const RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX: ReLaneSpecialistDomainPackV1[] = [
	...RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX_EARLY,
	...RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX_LATE,
];
