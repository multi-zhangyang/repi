/** Reverse evidence types and query keys. */
export type ReverseEvidenceFacts = {
	technique?: string;
	url?: string;
	route?: string;
	httpStatus?: string;
	package?: string;
	arch?: string;
	binary?: string;
	blocked?: string;
	confidence?: string;
	/** MITRE ATT&CK technique ids from technique.mitre= / summary.mitre= */
	mitre?: string;
	/** CWE ids from technique.cwe= / summary.cwe= */
	cwe?: string;
	/** proof-exit criterion from technique.proof_exit= / summary.proof_exit= */
	proofExit?: string;
	/** residual summary.* / anchor lines not mapped above */
	extra: string[];
	/** original ordered summary lines */
	lines: string[];
};

export const KEY_MAP: Array<[keyof ReverseEvidenceFacts, RegExp]> = [
	["technique", /^(?:summary\.)?technique=(.+)$/i],
	["url", /^summary\.url=(.+)$/i],
	["route", /^summary\.route=(.+)$/i],
	["httpStatus", /^summary\.http_status=(.+)$/i],
	["package", /^summary\.(?:frida_package|package|apk)=(.+)$/i],
	["arch", /^summary\.arch=(.+)$/i],
	["binary", /^summary\.(?:binary|target|so)=(.+)$/i],
	["blocked", /^summary\.blocked=(.+)$/i],
	["confidence", /^summary\.confidence=(.+)$/i],
	["mitre", /^(?:summary\.|technique\.)?mitre=(.+)$/i],
	["cwe", /^(?:summary\.|technique\.)?cwe=(.+)$/i],
	["proofExit", /^proof\.exit=(.+)$/i],
	["proofExit", /^(?:query\.|summary\.)runtime_proof_exit=(.+)$/i],
	["proofExit", /^query\.proof_exit=(.+)$/i],
];

export const REVERSE_EVIDENCE_QUERY_KEYS = [
	"technique",
	"mitre",
	"cwe",
	"proof_exit",
	"url",
	"route",
	"http_status",
	"package",
	"arch",
	"binary",
	"blocked",
	"confidence",
] as const;

/** Payload fragment for appendEvidence with queryable reverse fields. */
