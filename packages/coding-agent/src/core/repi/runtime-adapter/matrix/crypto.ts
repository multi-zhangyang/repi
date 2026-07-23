/**
 * Runtime adapter execution matrix: crypto/stego.
 */

import { cryptoParamTransformCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_CRYPTO_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "crypto-param-transform-adapter",
		bridgeId: "tool-bridge-runtime",
		domainId: "crypto",
		tool: "python3",
		fallbackTool: "openssl",
		runnerKind: "shell-command",
		commandTemplate: cryptoParamTransformCommandTemplate("native"),
		fallbackCommandTemplate: cryptoParamTransformCommandTemplate("fallback"),
		parserRules: [
			{
				id: "parser-crypto-param",
				regex: "(\\[crypto-param\\]|modulus|iv=|nonce=|base64|hex|PEM)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "parameter derivation",
			},
			{
				id: "parser-crypto-transform",
				regex: "(\\[crypto-transform\\]|chain=.*->|base64|gzip|zlib)",
				evidenceRank: "process_config",
				proofExitSignal: "transform replay",
			},
			{
				id: "parser-crypto-solver",
				regex: "(\\[crypto-solver\\]|\\[crypto-known-answer\\]|z3=|verification=pass)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "solver script",
			},
			{
				id: "parser-crypto-stego",
				regex: "(\\[crypto-stego\\]|stego_lsb_plane|CAP_LSB=1|shell_cap stego=1)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "stego lsb plane",
			},
			{
				id: "parser-crypto-proof",
				regex: "(\\[crypto-proof-capture\\]|proof.exit=)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "proof.exit=partial_runtime_capture",
			},
		],
		artifactKinds: ["crypto-param", "crypto-transform", "crypto-solver", "crypto-stego"],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: [
			"REPI_RUNTIME_ADAPTER_WORKDIR",
			"REPI_RUNTIME_ADAPTER_TIMEOUT_MS",
			"REPI_KNOWN_ANSWER",
			"REPI_CANDIDATE",
		],
		proofExitSignals: [
			"parameter derivation",
			"transform replay",
			"solver script",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
			"stego lsb plane",
		],
	},
];
