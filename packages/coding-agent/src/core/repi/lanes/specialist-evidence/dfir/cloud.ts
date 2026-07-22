/** Specialist evidence analyzer: cloud-id. */
import type { LaneCommand, LaneCommandPack } from "../../../lane-commands/types.ts";
import { interestingLines, truncateMiddle } from "../../../text.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";

export function analyzeCloudIdentityEvidence(pack: LaneCommandPack, combined: string): SpecialistEvidenceAnalysis {
	const targetArg = pack.target ?? "<target>";
	const enabled =
		/cloud|container|k8s|kubernetes/.test(pack.route.toLowerCase()) ||
		packHasSpecialistSignal(pack, /cloud-identity|Cloud\/K8s identity|cloud-runtime|cloud-metadata/i);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const identityLines = interestingLines(combined, /\[cloud-identity\]|\[k8s-serviceaccount\]/i, 18);
	if (identityLines.length > 0) {
		findings.push(
			`Cloud identity anchors: ${identityLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const runtimeLines = interestingLines(
		combined,
		/\[cloud-runtime-config\]|\[k8s-context\]|\[k8s-rbac\]|\[k8s-resource\]/i,
		24,
	);
	if (runtimeLines.length > 0) {
		findings.push(
			`Cloud/K8s runtime config anchors: ${runtimeLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const metadataLines = interestingLines(combined, /\[cloud-metadata\]/i, 18);
	if (metadataLines.length > 0) {
		findings.push(
			`Cloud metadata probe anchors: ${metadataLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const privilegeLines = interestingLines(
		combined,
		/\[cloud-privilege-edge\]|ClusterRoleBinding|RoleBinding|iam\.gserviceaccount|arn:aws/i,
		18,
	);
	if (privilegeLines.length > 0) {
		findings.push(
			`Cloud privilege edge anchors: ${privilegeLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	if (identityLines.length > 0 || runtimeLines.length > 0 || metadataLines.length > 0 || privilegeLines.length > 0) {
		followups.push({
			label: "cloud-identity-rerun",
			command:
				"python3 - <<'PY'\nimport pathlib\np=pathlib.Path('/tmp/repi-cloud-runtime.sh')\nprint('[cloud-identity-rerun]', 'runtime_scaffold=' + str(p.exists()))\nPY\n[ -f /tmp/repi-cloud-runtime.sh ] && /tmp/repi-cloud-runtime.sh || env | grep -Ei 'AWS_|AZURE_|GOOGLE_|KUBE|KUBERNETES' | sort",
			evidence: "rerun cloud/K8s identity and runtime config map",
		});
		followups.push({
			label: "cloud-runtime-config-rerun",
			command:
				"[ -f /tmp/repi-cloud-runtime.sh ] && /tmp/repi-cloud-runtime.sh || find . -maxdepth 5 -type f \\( -name 'Dockerfile*' -o -name '*.tf' -o -name '*deployment*.yml' -o -name '*rbac*.yml' \\) -print | head -240",
			evidence: "rerun container/K8s/IaC runtime configuration map",
		});
		followups.push({
			label: "cloud-metadata-probe-rerun",
			command:
				"[ -f /tmp/repi-cloud-metadata-probe.py ] && python3 /tmp/repi-cloud-metadata-probe.py || printf '%s\n' 'rerun cloud-metadata-probe-scaffold from re_lane plan'",
			evidence: "rerun bounded cloud metadata identity probe",
		});
		followups.push({
			label: "cloud-privilege-report-scaffold",
			command:
				"python3 - <<'PY'\nimport pathlib\nprint('[cloud-privilege-report] inputs=cloud identity/runtime/metadata/privilege anchors')\nfor path in ['/tmp/repi-cloud-runtime.sh','/tmp/repi-cloud-metadata-probe.py']:\n    print('[cloud-privilege-report]', path, 'exists=' + str(pathlib.Path(path).exists()))\nprint('Next: bind one principal, one resource scope, and one minimal allowed/denied action; record request/CLI output in evidence ledger.')\nPY",
			evidence: "consolidated cloud privilege edge report scaffold",
		});
	}

	// reverse runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[cloud-id-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(
			{
				label: `cloud-id-domain-proof-exit`,
				command: `re_domain_proof_exit show`,
				evidence: "reverse runtime capture gate",
			} as any,
			{
				label: `cloud-id-complete-audit`,
				command: `re_complete audit`,
				evidence: "reverse completion audit",
			} as any,
			{
				label: `cloud-id-runtime-adapter`,
				command: `re_runtime_adapter run ${targetArg}`,
				evidence: "runtime adapter capture",
			} as any,
		);
	}
	return {
		findings,
		followups,
		nextLane:
			privilegeLines.length > 0
				? "privilege/report"
				: metadataLines.length > 0 || runtimeLines.length > 0
					? "metadata/privilege"
					: identityLines.length > 0
						? "runtime-config/metadata"
						: undefined,
	};
}
