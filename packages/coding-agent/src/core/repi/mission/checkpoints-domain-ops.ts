/** Mission checkpoints: crypto/dfir/cloud/identity/general. */
export const MISSION_CHECKPOINTS_OPS: Record<string, string[]> = {
	"Crypto / stego": ["verifier_matrix_ready", "compiler_ready", "replay_ready", "proof_loop_ready"],
	"Memory forensics": ["attack_graph_ready", "verifier_matrix_ready", "compiler_ready", "replay_ready"],
	"DFIR / PCAP / stego": ["attack_graph_ready", "verifier_matrix_ready", "compiler_ready", "replay_ready"],
	"Cloud / container": [
		"attack_graph_ready",
		"operation_queue_ready",
		"verifier_matrix_ready",
		"compiler_ready",
		"replay_ready",
	],
	"Identity / Windows / AD": [
		"attack_graph_ready",
		"operation_queue_ready",
		"verifier_matrix_ready",
		"compiler_ready",
		"replay_ready",
	],
	"Reverse/Pentest general": [
		"reverse_proof_exit_ready",
		"attack_graph_ready",
		"operation_queue_ready",
		"context_pack_ready",
		"operator_queue_ready",
		"verifier_matrix_ready",
		"compiler_ready",
		"replay_ready",
		"proof_loop_ready",
		"knowledge_graph_ready",
	],
};
