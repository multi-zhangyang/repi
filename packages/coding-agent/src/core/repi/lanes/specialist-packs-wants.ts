/** Specialist pack enablement detectors. */

import { detectSpecialistDfirWants } from "./specialist-packs-wants-dfir.ts";
import { detectSpecialistNativeWants } from "./specialist-packs-wants-native.ts";
import { detectSpecialistTargetLooks } from "./specialist-packs-wants-target.ts";
import type { SpecialistWants } from "./specialist-packs-wants-types.ts";
import { detectSpecialistWebWants } from "./specialist-packs-wants-web.ts";

export type { SpecialistWants } from "./specialist-packs-wants-types.ts";

export function detectSpecialistWants(input: {
	domain: string;
	laneName: string;
	context: string;
	task: string;
	target?: string;
}): SpecialistWants {
	const { domain, laneName, context, task, target } = input;
	const looks = detectSpecialistTargetLooks(target);
	const web = detectSpecialistWebWants({ domain, laneName, context, task });
	const native = detectSpecialistNativeWants({
		domain,
		laneName,
		context,
		task,
		targetLooksApk: looks.targetLooksApk,
		targetLooksIpa: looks.targetLooksIpa,
	});
	const dfir = detectSpecialistDfirWants({
		domain,
		laneName,
		context,
		task,
		targetLooksPcap: looks.targetLooksPcap,
		targetLooksFirmware: looks.targetLooksFirmware,
		targetLooksMemoryImage: looks.targetLooksMemoryImage,
	});
	return {
		...web,
		...native,
		...dfir,
		...looks,
	};
}
