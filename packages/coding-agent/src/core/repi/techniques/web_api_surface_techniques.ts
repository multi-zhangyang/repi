/** Technique catalog slice: web-api surface (prototype/graphql). */
import type { TechniqueEntry } from "./types.ts";

export const WEB_API_SURFACE_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "web-prototype-pollution",
		name: "Prototype pollution (client + server-side Node)",
		domain: "web-api",
		mitre: ["T1190", "T1059.001"],
		cwe: ["CWE-1321"],
		triggers:
			"App merges user-controlled JSON into objects recursively (lodash.merge, jQuery.extend deep, object-assign-recursive), Node backend.",
		procedure: [
			'Send JSON with `"__proto__":{"isAdmin":true}` (or `constructor.prototype`); trigger a merge/assign path.',
			"Confirm the polluted default appears on a fresh object: `({}).isAdmin === true` server-side or a client gadget fires.",
			"Find a gadget: polluted `isAdmin`, `role`, `status` checked on `o.x ?? default`; or a sink (e.g. `child_process.spawn` args via polluted `shell`/`env`/`NODE_OPTIONS`).",
			'Server-side RCE gadgets: polluted `process.mainModule`/`require`/`child_process` options; e.g. `{"__proto__":{"shell":"...","argv0":"..."}}` into a spawn.',
		],
		proofExit:
			"A control object created AFTER pollution inherits the forged property AND a privileged branch/gadget executes (captured response/proc).",
		pitfalls: [
			"`Object.create(null)` targets are immune; verify the merge target is a normal object.",
			"Modern Node blocks `__proto__` in some parsers — try `constructor.prototype`.",
			"Pollution without a sink is low impact; always chain to a real gadget.",
		],
		tools: ["curl", "python3", "node", "jq"],
	},
	{
		id: "web-graphql-introspection",
		name: "GraphQL introspection + batching/alias abuse",
		domain: "web-api",
		mitre: ["T1190", "T1046"],
		cwe: ["CWE-200", "CWE-285"],
		triggers:
			"Endpoint accepts GraphQL POST, introspection enabled (or bypassable), queries with aliases/batching for enumeration or auth bypass.",
		procedure: [
			"Introspect: `POST {query: '{__schema{types{name fields{name type{name}}}}}'}`; if disabled, try `__typename`, persisted-query bypass, or `fragment` name leaks.",
			"Map sensitive fields/types from the schema; find admin-only fields reachable without auth.",
			"Batching DoS / auth bypass: send 1000 aliases in one query to bypass per-query cost; or batch a low-priv query with a high-priv mutation.",
			"Mutation abuse: find create/update mutations that skip authz on a nested field (nested IDOR).",
		],
		proofExit:
			"Full schema exfiltrated (if introspection) OR a sensitive field/mutation successfully queried/mutated without authorization, captured.",
		pitfalls: [
			"Introspection disabled ≠ secure — test persisted queries and `__typename` leaks.",
			"Alias DoS is impact, not access; pair with a real authz bypass for a finding.",
		],
		tools: ["curl", "python3", "jq"],
	},
];
