/** Mission lane packs: lanes_crypto_stego. */
import type { MissionLane } from "../types.ts";

export function lanes_crypto_stego(): MissionLane[] {
	return [
		{
			name: "inventory",
			objective: "盘点密文/文件/参数/编码/大整数/metadata 与可能的 oracle 面",
			next: ["hash/format", "hex/base64/int/PEM 参数", "IV/nonce/key/signature 字段"],
		},
		{
			name: "transform",
			objective: "复原编码、压缩、异或、分组模式、隐写提取等 transform chain",
			next: ["base64/hex/gzip/zlib", "exiftool/zsteg/binwalk", "candidate plaintext scoring"],
		},
		{
			name: "solver",
			objective: "建立约束/数学/密码攻击 solver，并输出可复用脚本",
			next: ["Z3/Sage/PyCryptodome", "parameter derivation", "solve.py"],
		},
		{
			name: "verify",
			objective: "用 known-answer 或 replay 验证结果，不把猜测当结论",
			next: ["known-answer assert", "transform replay", "artifact hash"],
		},
		{
			name: "report",
			objective: "沉淀参数、脚本、验证命令和失败分支",
			next: ["solver script", "proof-exit", "field journal"],
		},
	];
}
