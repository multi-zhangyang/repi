/** Specialist pack target shape detectors. */
export type SpecialistWantsInput = {
	domain: string;
	laneName: string;
	context: string;
	task: string;
	target?: string;
};

export type SpecialistTargetLooks = {
	targetLooksPcap: boolean;
	targetLooksApk: boolean;
	targetLooksFirmware: boolean;
	targetLooksMemoryImage: boolean;
	targetLooksIpa: boolean;
};

export function detectSpecialistTargetLooks(target?: string): SpecialistTargetLooks {
	const targetLooksPcap = Boolean(target && /\.(?:pcap|pcapng|cap)$/i.test(target));
	const targetLooksApk = Boolean(target && /\.(?:apk|xapk|apks)$/i.test(target));
	const targetLooksFirmware = Boolean(target && /\.(?:bin|img|trx|chk|ubi|ubifs|squashfs|sqsh)$/i.test(target));
	const targetLooksMemoryImage = Boolean(
		target && /\.(?:raw|vmem|mem|dmp|lime|core|crash|hiberfil|pagefile)(?:\..*)?$/i.test(target),
	);
	const targetLooksIpa = Boolean(target && /\.(?:ipa)$/i.test(target));
	return {
		targetLooksPcap,
		targetLooksApk,
		targetLooksFirmware,
		targetLooksMemoryImage,
		targetLooksIpa,
	};
}
