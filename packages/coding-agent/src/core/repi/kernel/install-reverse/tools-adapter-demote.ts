/** Mission-lexical demote notes for runtime adapter runs. */
export function buildRuntimeAdapterDemoteNote(params: { requested?: string; adapter?: string }): {
	demoted: boolean;
	note: string;
} {
	const demoted =
		Boolean(params.requested) && Boolean(params.adapter) && String(params.requested) !== String(params.adapter);
	if (!demoted) return { demoted: false, note: "" };
	const nl = "\n";
	return {
		demoted: true,
		note: [
			"runtime_adapter:",
			"status: mission_lexical_demote",
			`requested: ${params.requested}`,
			`adapter: ${params.adapter}`,
			"note: mission task/intent overrides model-forced native adapter",
			"",
			"",
		].join(nl),
	};
}
