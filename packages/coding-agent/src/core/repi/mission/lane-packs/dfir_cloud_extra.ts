/** Mission lane packs: cloud/identity extras. */
import type { MissionLane } from "../types.ts";

export function lanes_cloud_container(): MissionLane[] {
	return [
		{
			name: "identity",
			objective: "映射云凭据、K8s serviceaccount、运行时身份和当前 principal",
			next: ["env/config/profile", "serviceaccount token", "cloud sts/account"],
		},
		{
			name: "runtime-config",
			objective: "确认容器/K8s/IaC/云 CLI 的真实运行配置和命名空间边界",
			next: ["docker/kubectl context", "manifests/IaC", "namespace/RBAC"],
		},
		{
			name: "metadata",
			objective: "验证 metadata/instance identity 路径和 token 可用性",
			next: ["IMDS/GCP/Azure metadata", "token audience", "egress proof"],
		},
		{
			name: "privilege",
			objective: "证明最小权限边或可达资源边界",
			next: ["whoami/list scope", "RBAC/IAM edge", "least replay"],
		},
		{
			name: "report",
			objective: "整理身份链、资源边和复现命令",
			next: ["attack graph", "evidence ledger", "field journal"],
		},
	];
}

export function lanes_identity_windows_ad(): MissionLane[] {
	return [
		{
			name: "principals",
			objective: "枚举域、DC、用户、组、SPN、证书服务和可用协议面",
			next: ["LDAP/Kerberos/SMB baseline", "SPN/user/group", "ADCS"],
		},
		{
			name: "credentials",
			objective: "验证凭据/ticket/hash 的可用性和约束",
			next: ["nxc/impacket check", "Kerberos ticket", "NTLM/hash path"],
		},
		{
			name: "graph",
			objective: "构建权限图，定位可证明的最小 privilege edge",
			next: ["BloodHound/Certipy output", "edge ranking", "path proof"],
		},
		{
			name: "pivot-proof",
			objective: "证明一个最小横向/提权/访问路径",
			next: ["single command proof", "event/evidence", "rollback note"],
		},
		{
			name: "report",
			objective: "沉淀凭据可用性、图边、复现命令和证据",
			next: ["attack graph", "evidence block", "field journal"],
		},
	];
}
