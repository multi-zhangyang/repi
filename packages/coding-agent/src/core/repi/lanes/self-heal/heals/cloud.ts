import { packHasSpecialistSignal } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendCloudHeals(ctx: SelfHealCtx): void {
	const {
		pack,
		result: _result,
		findings: _findings,
		deficits: _deficits,
		route,
		combined: _combined,
		target: _target,
		add,
		toolNames: _toolNames,
	} = ctx;
	if (
		/cloud|container|k8s|kubernetes/.test(route) ||
		packHasSpecialistSignal(pack, /cloud-identity|Cloud\/K8s identity|cloud-runtime|cloud-metadata/i)
	) {
		add(
			"heal-cloud-identity-map",
			"env | grep -Ei 'AWS_|AZURE_|GOOGLE_|KUBE|KUBERNETES' | sort; find ~/.aws ~/.azure ~/.config/gcloud ~/.kube /var/run/secrets/kubernetes.io/serviceaccount -maxdepth 2 -type f 2>/dev/null | head -120",
			"specialist cloud identity/config fallback",
		);
		add(
			"heal-cloud-runtime-config",
			"[ -f /tmp/repi-cloud-runtime.sh ] && /tmp/repi-cloud-runtime.sh || find . -maxdepth 5 -type f \\( -name 'Dockerfile*' -o -name 'docker-compose*.yml' -o -name '*.tf' -o -name '*deployment*.yml' -o -name '*rbac*.yml' \\) -print | head -240",
			"specialist cloud/K8s runtime config fallback",
		);
		add(
			"heal-cloud-metadata-probe",
			"[ -f /tmp/repi-cloud-metadata-probe.py ] && python3 /tmp/repi-cloud-metadata-probe.py || printf '%s\n' 'rerun cloud-metadata-probe-scaffold to regenerate bounded metadata probe'",
			"specialist cloud metadata probe fallback",
		);
	}
}
