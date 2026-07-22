/** Web authz pure build inventory/matrix strings. */
export function webAuthzPlanMatrices(
	url: string | undefined,
	timeoutMs: number,
): {
	routeInventory: string[];
	principalMatrix: string[];
	objectProbes: string[];
	stateMachine: string[];
	sequenceReplay: string[];
	ownershipChecks: string[];
	rollbackChecks: string[];
	replayCommands: string[];
} {
	const routeInventory = [
		url ? `target=${url}: route/principal state baseline` : "target=<missing>: pass URL or run re_live_browser first",
		"reuse browser route graph/auth matrix when present; otherwise probe target URL directly",
	];
	const principalMatrix = [
		"principals default to anon,A,B; set COOKIE_A/COOKIE_B or AUTH_A/AUTH_B and REPI_AUTHZ_PRINCIPALS",
		"record per-principal status/body hash and flag same-status/different-body transitions",
	];
	const objectProbes = [
		"set REPI_OBJECT_A and REPI_OBJECT_B to compare owner/cross-principal/alternate object responses",
		"potential BOLA/IDOR requires controlled positive and negative principal checks before impact claim",
	];
	const stateMachine = [
		"direct state probe: anon/A/B -> status, bytes, body hash for each protected route",
		"state diff binds route, principal, auth material, and response hash into artifact JSON",
	];
	const sequenceReplay = [
		"set REPI_AUTHZ_SEQUENCE=url1,url2,... to replay ordered request sequence for each principal",
		"compare statuses/hashes across principals and rerun via re_replayer before final report",
	];
	const ownershipChecks = [
		"object ownership checks compare A reading own object, B reading A object, and A reading alternate object",
		"evidence must include route, object identifiers, principals, status and body-hash deltas",
	];
	const rollbackChecks = [
		"mutating rollback is skipped by default; enable with REPI_AUTHZ_MUTATE=1 and REPI_MUTATION_URL/BODY/RESTORE_BODY",
		"rollback proof records before/mutate/restore/after hashes and restored verdict",
	];
	const replayCommands = [
		`re_web_authz_state run ${url ?? "<url>"} ${timeoutMs}`,
		"COOKIE_A=... COOKIE_B=... AUTH_A=... AUTH_B=... re_web_authz_state run <url>",
		"REPI_OBJECT_A=https://target/api/objects/1 REPI_OBJECT_B=https://target/api/objects/2 re_web_authz_state run <url>",
		"cat ${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/web}/web-authz-state.json",
	];
	return {
		routeInventory,
		principalMatrix,
		objectProbes,
		stateMachine,
		sequenceReplay,
		ownershipChecks,
		rollbackChecks,
		replayCommands,
	};
}
