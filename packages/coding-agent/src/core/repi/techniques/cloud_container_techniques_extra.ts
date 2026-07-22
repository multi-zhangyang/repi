/**
 * Technique catalog slice: cloud-container extra (k8s SA / deep).
 */
import type { TechniqueEntry } from "./types.ts";
export const CLOUD_CONTAINER_TECHNIQUES_EXTRA: readonly TechniqueEntry[] = [
	{
		id: "cloud-imds-ssrf-chain",
		name: "Cloud IMDS SSRF to temporary credentials",
		domain: "cloud-container",
		mitre: ["T1552", "T1078"],
		cwe: ["CWE-918", "CWE-441"],
		triggers:
			"Server-side URL fetch/PDF/preview/webhook to attacker-influenced URL on AWS/GCP/Azure workload identity.",
		procedure: [
			"Confirm SSRF primitive (http/https only? redirects? DNS rebinding?).",
			"Hit link-local IMDS: AWS 169.254.169.254 (IMDSv1 vs required token header), GCP metadata.google.internal, Azure 169.254.169.254/metadata.",
			"For AWS IMDSv2: first PUT token then GET role credentials; record AccessKeyId/Secret/Token lifetimes.",
			"Enumerate role policies with temporary creds; least-privilege check before lateral moves.",
			"If blocked, try IPv6, encoded IP, redirect bounce, or alternate metadata paths.",
		],
		proofExit:
			"Valid cloud temporary credentials or instance identity document retrieved via SSRF; usage proof is read-only identity call (sts:GetCallerIdentity / equivalent).",
		pitfalls: [
			"IMDSv2 hop-limit and missing X-aws-ec2-metadata-token header false negatives.",
			"Leaking secrets into chat/logs — redact evidence stores.",
		],
		tools: ["curl", "httpx", "aws", "gcloud", "python3"],
	},
	{
		id: "cloud-k8s-sa-token-abuse",
		name: "Kubernetes service account token abuse path",
		domain: "cloud-container",
		mitre: ["T1552", "T1078"],
		cwe: ["CWE-538", "CWE-269"],
		triggers: "Pod/exec access or SSRF to kubelet/API; mounted SA token under /var/run/secrets/kubernetes.io.",
		procedure: [
			"Locate token+CA+namespace mounts; `cat /var/run/secrets/kubernetes.io/serviceaccount/token`.",
			'Query API: `curl -k -H "Authorization: Bearer $TOKEN" https://kubernetes.default/api` and self subjectaccessreviews.',
			"List secrets/pods/nodes only if RBAC allows; prefer get/list before create.",
			"If node filesystem reachable, check cloud instance credentials and docker.sock.",
			"Record API server responses and RBAC verbs as proof; avoid destructive creates.",
		],
		proofExit:
			"Demonstrated SA identity with concrete allowed API verbs and at least one sensitive object read (secret/name) within engagement scope.",
		pitfalls: [
			"Impersonation can break cluster policy — stay least privilege.",
			"Tokens expire — capture time-bounded evidence.",
		],
		tools: ["kubectl", "curl", "jq", "python3"],
	},
];
