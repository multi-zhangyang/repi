/** Runtime adapter target profile inspect. */
import { existsSync, statSync } from "node:fs";
import { hasRootfsMarkers, pushSignal, uniqueAdapterIds, uniqueTargetKinds } from "./target-inspect-helpers.ts";
import { appendLexicalTargetSignals } from "./target-inspect-lexical.ts";
import { appendFilesystemTargetSignals } from "./target-inspect-magic.ts";
import type { RuntimeAdapterTargetKind, RuntimeAdapterTargetProfileV1, RuntimeAdapterTargetSignalV1 } from "./types.ts";

export function inspectRuntimeAdapterTarget(target?: string): RuntimeAdapterTargetProfileV1 {
	const text = target?.trim() ?? "";
	const signals: RuntimeAdapterTargetSignalV1[] = [];
	const add = (
		adapterId: string,
		targetKind: RuntimeAdapterTargetKind,
		reason: string,
		evidenceRank: RuntimeAdapterTargetSignalV1["evidenceRank"],
	) => pushSignal(signals, { adapterId, targetKind, reason, evidenceRank });
	if (!text) {
		return {
			kind: "RuntimeAdapterTargetProfileV1",
			schemaVersion: 1,
			target: "",
			exists: false,
			targetKinds: ["unknown"],
			adapterIds: [],
			signals: [],
			reasons: [],
		};
	}
	const lower = text.toLowerCase();
	let targetKind: "file" | "directory" | undefined;
	let exists = false;
	if (existsSync(text)) {
		try {
			const stat = statSync(text);
			exists = true;
			if (stat.isDirectory()) {
				targetKind = "directory";
				if (hasRootfsMarkers(text)) {
					add(
						"firmware-rootfs-service-map-adapter",
						"firmware-rootfs",
						"rootfs markers on existing directory",
						"process_config",
					);
				}
			} else if (stat.isFile()) {
				targetKind = "file";
			}
		} catch {
			// Best-effort target sniffing only; lexical detection below remains authoritative.
		}
	}

	appendLexicalTargetSignals(text, lower, targetKind, add);
	const magic = appendFilesystemTargetSignals(text, targetKind, add);

	const targetKinds = uniqueTargetKinds(signals);
	return {
		kind: "RuntimeAdapterTargetProfileV1",
		schemaVersion: 1,
		target: text,
		exists,
		pathKind: targetKind,
		magic,
		targetKinds: targetKinds.length ? targetKinds : ["unknown"],
		adapterIds: uniqueAdapterIds(signals),
		signals,
		reasons: Array.from(new Set(signals.map((signal: any) => signal.reason))),
	};
}
