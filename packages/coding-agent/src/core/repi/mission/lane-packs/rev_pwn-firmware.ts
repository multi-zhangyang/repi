/** Mission lane packs: lanes_firmware_iot. */
import type { MissionLane } from "../types.ts";

export function lanes_firmware_iot(): MissionLane[] {
	return [
		{
			name: "inventory",
			objective: "确认固件封装、hash、架构、压缩/文件系统和候选 rootfs",
			next: ["file/hash/binwalk", "magic/entropy", "architecture/rootfs hints"],
		},
		{
			name: "extract",
			objective: "提取 rootfs、kernel、web 资源、配置层和嵌入 payload",
			next: ["binwalk/unblob", "squashfs/ubifs/cpio", "artifact inventory"],
		},
		{
			name: "filesystem",
			objective: "映射账号、密钥、配置、NVRAM、Web/API/CGI 和启动脚本",
			next: ["passwd/shadow/keys", "nvram/config", "www/cgi/init"],
		},
		{
			name: "services",
			objective: "枚举暴露服务、默认凭据、管理端点和本地攻击面",
			next: ["httpd/dropbear/telnetd", "cgi endpoints", "credential reuse"],
		},
		{
			name: "emulate",
			objective: "构造 QEMU/chroot/用户态复现脚手架并绑定可验证服务路径",
			next: ["arch/qemu-user", "chroot/env", "service smoke"],
		},
		{
			name: "report",
			objective: "沉淀固件图谱、rootfs 路径、凭据/端点/服务和复现命令",
			next: ["evidence graph", "IOC/config table", "field journal"],
		},
	];
}
