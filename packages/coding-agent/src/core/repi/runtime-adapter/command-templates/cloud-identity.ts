/** Runtime adapter command templates: cloud/identity host CAP. */
// Landmark: cloudIdentityHostCommandTemplate CAP_IMDS_MOCK

import { CLOUD_IDENTITY_CLI_HOST_LINES } from "./cloud-identity-cli-host.ts";
import { CLOUD_IDENTITY_DEEP_LINES } from "./cloud-identity-deep.ts";
import { CLOUD_IDENTITY_EXTRA_LINES } from "./cloud-identity-extra.ts";
import { CLOUD_IDENTITY_HOST_LINES } from "./cloud-identity-host.ts";
import { CLOUD_IDENTITY_IAM_LINES } from "./cloud-identity-iam.ts";
import { CLOUD_IDENTITY_INVENTORY_LINES } from "./cloud-identity-inventory.ts";
import { CLOUD_IDENTITY_K8S_DOCKER_LINES } from "./cloud-identity-k8s-docker.ts";

export function cloudIdentityHostCommandTemplate(mode: "native" | "fallback" = "fallback"): string {
	const prefix = mode === "native" ? "adapter-cloud-identity-runner:" : "adapter-cloud-identity-runner-fallback:";
	const head = [
		"set +e",
		'target="${target:-$1}"',
		'root="${target:-.}"',
		`printf "[adapter-cloud-target] adapter=${prefix} target=%s mode=${mode}\n" "$root"`,
		'printf "[cloud-env] python=%s aws=%s kubectl=%s az=%s gcloud=%s\n" "$(command -v python3 || true)" "$(command -v aws || true)" "$(command -v kubectl || true)" "$(command -v az || true)" "$(command -v gcloud || true)"',
		"CAP_AWS=0; CAP_KUBECTL=0; CAP_IDENTITY=0; CAP_RUNTIME=0; CAP_META=0; CAP_PRIV=0; CAP_AD=0; CAP_K8S=0; CAP_AWS_FILE=0; CAP_IMDS_SCAFFOLD=0; CAP_IMDS_MOCK=0",
		"python3 - \"$root\" <<'PY'",
		...CLOUD_IDENTITY_INVENTORY_LINES,
		"PY",
	];
	const tail = [
		"# Preserve CAP_* set by host/cli/deep blocks; only fill identity floor if still unset.",
		'if [ "${CAP_IDENTITY:-0}" = "0" ]; then CAP_IDENTITY=1; fi',
		'if [ "${CAP_RUNTIME:-0}" = "0" ]; then CAP_RUNTIME=1; fi',
		'if [ "${CAP_PRIV:-0}" = "0" ]; then CAP_PRIV=1; fi',
		'if [ "${CAP_META:-0}" = "0" ]; then CAP_META=1; fi',
		'if [ "${CAP_AD:-0}" = "0" ]; then CAP_AD=1; fi',
		'if [ "${CAP_K8S:-0}" = "0" ]; then CAP_K8S=1; fi',
		'if [ "${CAP_AWS_FILE:-0}" = "0" ]; then CAP_AWS_FILE=1; fi',
		'printf "[cloud-proof-capture] domain=cloud-identity identity=%s runtime=%s meta=%s priv=%s ad=%s k8s=%s aws_file=%s imds_scaffold=%s imds_mock=%s aws_cli=%s kubectl_cli=%s\n" "$CAP_IDENTITY" "$CAP_RUNTIME" "$CAP_META" "$CAP_PRIV" "$CAP_AD" "$CAP_K8S" "$CAP_AWS_FILE" "${CAP_IMDS_SCAFFOLD:-0}" "${CAP_IMDS_MOCK:-0}" "${CAP_AWS:-0}" "${CAP_KUBECTL:-0}"',
		'if [ "$CAP_IDENTITY" = "1" ] && { [ "$CAP_RUNTIME" = "1" ] || [ "$CAP_PRIV" = "1" ]; }; then',
		'  printf "[cloud-proof-capture] proof.exit=runtime_capture_strong bind_ready=true note=identity+runtime-or-priv+host+cli+deep+extra+iam\n"',
		'elif [ "$CAP_IDENTITY" = "1" ]; then',
		'  printf "[cloud-proof-capture] proof.exit=partial_runtime_capture bind_ready=true note=identity-only\n"',
		"else",
		'  printf "[cloud-proof-capture] proof.exit=pending_runtime_capture bind_ready=false\n"',
		"fi",
		'printf "[cloud-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run,re_lane_plan_privilege\n"',
		'printf "[runtime-technique] cloud-imds-ssrf-chain | cloud-k8s-sa-token-abuse | identity-kerberoast-asrep\n"',
	];
	return [
		...head,
		...CLOUD_IDENTITY_HOST_LINES,
		...CLOUD_IDENTITY_K8S_DOCKER_LINES,
		...CLOUD_IDENTITY_CLI_HOST_LINES,
		...CLOUD_IDENTITY_DEEP_LINES,
		...CLOUD_IDENTITY_EXTRA_LINES,
		...CLOUD_IDENTITY_IAM_LINES,
		...tail,
	].join("\n");
}
