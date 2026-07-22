/** Mission lane packs: dfir_cloud. */
import type { MissionLane } from "../types.ts";
export function lanes_memory_forensics(): MissionLane[] {
	return [
		{
			name: "image-info",
			objective: "确认内存镜像格式、hash、OS/profile 候选和 volatility 可用插件",
			next: ["file/sha256", "volatility3 windows.info/linux.banners/mac.banners", "profile fallback"],
		},
		{
			name: "process-network",
			objective: "枚举进程树、命令行、DLL/module、句柄、连接和可疑注入/隐藏进程",
			next: ["pslist/pstree/cmdline", "netscan/sockets", "malfind/dlllist/handles"],
		},
		{
			name: "credential-artifacts",
			objective: "定位凭据、token、浏览器/LSASS/registry/artifact 与可验证来源",
			next: ["hashdump/lsadump fallback", "strings/yara", "registry/browser artifacts"],
		},
		{
			name: "timeline-carve",
			objective: "建立事件时间线、filescan/dumpfiles/carving 和 IOC 证据链",
			next: ["timeliner/mftscan", "filescan/dumpfiles", "IOC/YARA"],
		},
		{
			name: "report",
			objective: "沉淀 profile、插件输出、artifact hash、IOC/timeline 和复现命令",
			next: ["evidence table", "timeline", "memory proof-exit"],
		},
	];
}
export function lanes_dfir_pcap_stego(): MissionLane[] {
	return [
		{
			name: "artifact-inventory",
			objective: "确认取证文件类型、hash、pcap/image/stego 候选和解析工具",
			next: ["file/sha256", "capinfos/exiftool", "strings/binwalk"],
		},
		{
			name: "timeline-flow",
			objective: "建立流量会话、DNS/TLS/HTTP、时间线和可疑凭据/对象索引",
			next: ["tshark conversations", "stream ranking", "secret timeline"],
		},
		{
			name: "extract-decode",
			objective: "提取 HTTP object/carve 文件并还原编码、压缩、隐写 transform chain",
			next: ["export objects", "foremost/binwalk", "base64/hex/gzip/zlib/zsteg"],
		},
		{
			name: "verify",
			objective: "验证恢复 artifact 的 hash、可读内容、flag/IOC 来源和复现命令",
			next: ["artifact hash", "decode script", "source packet/frame"],
		},
		{
			name: "report",
			objective: "整理 timeline、artifact、transform 和证据块",
			next: ["flow table", "decode chain", "field journal"],
		},
	];
}
export { lanes_cloud_container, lanes_identity_windows_ad } from "./dfir_cloud_extra.ts";
