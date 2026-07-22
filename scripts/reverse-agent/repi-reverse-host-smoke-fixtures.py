#!/usr/bin/env python3
from pathlib import Path
import json
import socket
import struct, shutil, socket

def _build_repi_dtb():
    import struct as _st
    nul = b"\x00"
    strings = b"compatible" + nul + b"model" + nul + nul
    while len(strings) % 4:
        strings += nul
    def _align(b):
        while len(b) % 4:
            b += nul
        return b
    sb = b""
    sb += _st.pack(">I", 1) + nul
    sb = _align(sb)
    sb += _st.pack(">I", 1) + b"memory" + nul
    sb = _align(sb)
    val = b"repi,smoke" + nul
    sb += _st.pack(">III", 3, len(val), 0) + val
    sb = _align(sb)
    sb += _st.pack(">I", 2)
    sb += _st.pack(">I", 9)
    rsv = _st.pack(">QQ", 0, 0)
    off_mem_rsvmap = 40
    off_dt_struct = off_mem_rsvmap + len(rsv)
    off_dt_strings = off_dt_struct + len(sb)
    totalsize = off_dt_strings + len(strings)
    hdr = _st.pack(">IIIIIIIIII", 0xD00DFEED, totalsize, off_dt_struct, off_dt_strings, off_mem_rsvmap, 17, 16, 0, len(strings), len(sb))
    return hdr + rsv + sb + strings


def caesar_enc(s, shift):
    out = []
    for c in s:
        if "a" <= c <= "z":
            out.append(chr((ord(c) - 97 + shift) % 26 + 97))
        elif "A" <= c <= "Z":
            out.append(chr((ord(c) - 65 + shift) % 26 + 65))
        else:
            out.append(c)
    return "".join(out)

# PE with injection APIs + XOR-encoded C2 surface
dos = bytearray(128)
dos[0:2] = b"MZ"
struct.pack_into("<I", dos, 0x3C, 0x80)
pe = bytearray(b"PE\x00\x00")
pe += struct.pack("<HHIIIHH", 0x14C, 2, 0, 0, 0, 0xE0, 0x102)
opt = bytearray(0xE0)
struct.pack_into("<H", opt, 0, 0x10B)
struct.pack_into("<I", opt, 16, 0x1000)
struct.pack_into("<I", opt, 28, 0x400000)
struct.pack_into("<I", opt, 32, 0x1000)
struct.pack_into("<I", opt, 36, 0x200)
struct.pack_into("<I", opt, 56, 0x4000)
struct.pack_into("<I", opt, 60, 0x200)
struct.pack_into("<H", opt, 68, 3)
struct.pack_into("<I", opt, 92, 16)
pe += opt
sec1 = bytearray(40)
sec1[0:5] = b".text"
struct.pack_into("<I", sec1, 8, 0x200)
struct.pack_into("<I", sec1, 12, 0x1000)
struct.pack_into("<I", sec1, 16, 0x200)
struct.pack_into("<I", sec1, 20, 0x200)
struct.pack_into("<I", sec1, 36, 0x60000020)
sec2 = bytearray(40)
sec2[0:6] = b".rdata"
struct.pack_into("<I", sec2, 8, 0x100)
struct.pack_into("<I", sec2, 12, 0x2000)
struct.pack_into("<I", sec2, 16, 0x100)
struct.pack_into("<I", sec2, 20, 0x400)
struct.pack_into("<I", sec2, 36, 0x40000040)
pe += sec1 + sec2
blob = bytearray(dos) + pe
if len(blob) < 0x200:
    blob += b"\x00" * (0x200 - len(blob))
section = (
    b"VirtualAlloc\x00CreateRemoteThread\x00WriteProcessMemory\x00LoadLibraryA\x00GetProcAddress\x00VirtualProtect\x00DllMain\x00ServiceMain\x00ReflectiveLoader\x00InjectPayload\x00"
    b"https://evil.example/c2\x00cmd.exe\x00kernel32.dll\x00advapi32.dll\x00wininet.dll\x00"
    b"Global\\MutexEvil\x00User-Agent: MalwareBot/1.0\x00UPX0\x00UPX1\x00"
).ljust(0x200, b"\x00")
plain_mw = (
    b"https://xor-c2.example/beacon "
    b"password=xor-secret "
    b"User-Agent: XorBot/9 "
    b"cmd.exe /c whoami "
    b"powershell -enc AA== "
    b"token=deadbeef"
)
xored_mw = bytes(b ^ 0x41 for b in plain_mw)
_pe_path = Path("/tmp/repi-malware-sample.pe")
_pe_path.write_bytes(bytes(blob) + section + xored_mw + b"\x00\x01\x02\x03END" + b"PE_OVERLAY_MARK" + b"\x41" * 16 + __import__("os").urandom(768))
print("malware-pe", _pe_path, "bytes", _pe_path.stat().st_size)

# memory image with process paths + ISO timestamps for path_hits/iso_hits CAP
mem = bytearray(16384)
# minimal PE-ish header at start (pe_timestamp probe) + malfind PE/API markers at high offset
import struct as _st
mem[0:2] = b"MZ"
_st.pack_into("<I", mem, 0x3C, 0x80)
mem[0x80:0x84] = b"PE\x00\x00"
_st.pack_into("<I", mem, 0x88, 0x64000000)  # TimeDateStamp-ish
blob = (
    b"C:\\Windows\\System32\\lsass.exe "
    b"C:\\Windows\\System32\\cmd.exe "
    b"C:\\Windows\\System32\\powershell.exe "
    b"C:\\Windows\\explorer.exe "
    b"/usr/bin/bash "
    b"/usr/sbin/sshd "
    b"/bin/busybox "
    b"/usr/bin/python3 "
    b"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run "
    b"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run "
    b"PATH=/usr/bin:/bin "
    b"APPDATA=C:\\Users\\repi\\AppData\\Roaming "
    b"TEMP=C:\\Windows\\Temp "
    b"/home/repi/.ssh/id_rsa "
    b"/tmp/repi-mem-artifact.bin "
    b"https://c2.example/beacon "
    b"password=secret "
    b"2024-07-21T10:15:30 "
    b"2024-07-21 11:22:33 "
    b"2025-01-02T03:04:05 "
    b"mimikatz sekurlsa wdigest "
)
mem[128:128+len(blob)] = blob
# PE-in-memory + inject API strings AFTER path blob so malfind CAP is not clobbered
_pe2 = 0x1800
mem[_pe2:_pe2+2] = b"MZ"
_st.pack_into("<I", mem, _pe2 + 0x3C, 0x80)
mem[_pe2+0x80:_pe2+0x84] = b"PE\x00\x00"
_malf = b"PAGE_EXECUTE_READWRITE\x00VirtualAllocEx\x00WriteProcessMemory\x00CreateRemoteThread\x00"
mem[0x1A00:0x1A00+len(_malf)] = _malf
Path("/tmp/repi-mem-smoke.bin").write_bytes(bytes(mem))

# crypto: plaintext + hex XOR blob + caesar classical word
plain_c = b"password=secret flag{repi-crypto} http://c2.example/"
xor_hex = bytes(b ^ 0x37 for b in plain_c).hex()
classical = caesar_enc("passwordsecret", 5)  # ufxxbtwixjhwjy
crypto_body = (
    "AES RSA password=secret flag{demo} iv=00112233445566778899aabbccddeeff https://c.example/a MD5=\n"
    f"xor_hex={xor_hex}\n"
    f"classical_word={classical}\n"
)
Path("/tmp/repi-crypto-smoke.bin").write_text(crypto_body)

# pcap: multi-protocol ethernet (DNS + HTTP auth + TLS ClientHello SNI)
def _ip_checksum(data: bytes) -> int:
    if len(data) % 2:
        data += b"\x00"
    s = sum(struct.unpack("!%dH" % (len(data) // 2), data))
    s = (s >> 16) + (s & 0xFFFF)
    s += s >> 16
    return (~s) & 0xFFFF


def _eth_ip(proto: int, src: str, dst: str, l4: bytes, ident: int = 0x1337) -> bytes:
    eth = b"\x00" * 6 + b"\x11" * 6 + struct.pack("!H", 0x0800)
    total = 20 + len(l4)
    ip_hdr = struct.pack(
        "!BBHHHBBH4s4s",
        0x45,
        0,
        total,
        ident,
        0x4000,
        64,
        proto,
        0,
        socket.inet_aton(src),
        socket.inet_aton(dst),
    )
    csum = _ip_checksum(ip_hdr)
    ip_hdr = struct.pack(
        "!BBHHHBBH4s4s",
        0x45,
        0,
        total,
        ident,
        0x4000,
        64,
        proto,
        csum,
        socket.inet_aton(src),
        socket.inet_aton(dst),
    )
    return eth + ip_hdr + l4


def _udp(src: str, dst: str, sport: int, dport: int, payload: bytes) -> bytes:
    udp = struct.pack("!HHHH", sport, dport, 8 + len(payload), 0) + payload
    return _eth_ip(17, src, dst, udp, 0x5301)


def _tcp(src: str, dst: str, sport: int, dport: int, payload: bytes, seq: int = 1) -> bytes:
    tcp_off = 5 << 4
    tcp = struct.pack("!HHIIBBHHH", sport, dport, seq, 0, tcp_off, 0x18, 8192, 0, 0) + payload
    return _eth_ip(6, src, dst, tcp, 0x5001)


pcap = Path("/tmp/repi-dfir-smoke.pcap")
# Always rebuild multi-protocol capture so DNS/HTTP/TLS CAP stay reproducible.
dns_q = (
    b"\x12\x34\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00"
    b"\x07example\x03com\x00\x00\x01\x00\x01"
)
http = (
    b"GET /api/v1 HTTP/1.1\r\n"
    b"Host: api.example.com\r\n"
    b"Authorization: Bearer secret-token\r\n"
    b"Cookie: sid=abc123\r\n"
    b"\r\n"
)
host = b"cdn.example.com"
server_name_list = struct.pack("!BH", 0, len(host)) + host
server_name_list = struct.pack("!H", len(server_name_list)) + server_name_list
sni_ext = struct.pack("!HH", 0x0000, len(server_name_list)) + server_name_list
ciphers = struct.pack("!HH", 2, 0x002F)
ch_body = b"\x03\x03" + b"R" * 32 + b"\x00" + ciphers + b"\x01\x00" + struct.pack("!H", len(sni_ext)) + sni_ext
handshake = b"\x01" + struct.pack("!I", len(ch_body))[1:] + ch_body
tls = b"\x16\x03\x01" + struct.pack("!H", len(handshake)) + handshake
# ARP request who-has 10.0.0.1 tell 10.0.0.2
arp = (
    b"\xff\xff\xff\xff\xff\xff"  # dst broadcast
    + b"\x02\x00\x00\x00\x00\x02"  # src mac
    + struct.pack("!H", 0x0806)  # ethertype ARP
    + struct.pack("!HHBBH", 1, 0x0800, 6, 4, 1)  # hw/proto sizes, op=request
    + b"\x02\x00\x00\x00\x00\x02"
    + socket.inet_aton("10.0.0.2")
    + b"\x00\x00\x00\x00\x00\x00"
    + socket.inet_aton("10.0.0.1")
)
# ICMP echo request
icmp_payload = b"REPI-ICMP-ECHO"
icmp = struct.pack("!BBH", 8, 0, 0) + struct.pack("!HH", 0x1337, 1) + icmp_payload
# zero checksum then recompute
def _icmp_csum(data: bytes) -> bytes:
    if len(data) % 2:
        data += b"\x00"
    s = sum(struct.unpack("!%dH" % (len(data)//2), data))
    s = (s >> 16) + (s & 0xFFFF)
    s = ~s & 0xFFFF
    return struct.pack("!H", s)
icmp = icmp[:2] + _icmp_csum(icmp) + icmp[4:]
icmp_frame = _eth_ip(1, "10.0.0.4", "10.0.0.1", icmp, 0x1C01)
# DHCP discover-ish UDP 68->67 with magic cookie
dhcp_opts = b"\x35\x01\x01\xff"  # option 53 DHCP Discover + end
dhcp = (
    b"\x01\x01\x06\x00"  # op/htype/hlen/hops
    + b"\x12\x34\x56\x78"  # xid
    + b"\x00\x00\x00\x00"  # secs/flags
    + b"\x00" * 16  # ci/yi/si/gi
    + b"\x02\x00\x00\x00\x00\x02" + b"\x00" * 10  # chaddr padded
    + b"\x00" * 64 + b"\x00" * 128  # sname/file
    + b"\x63\x82\x53\x63"  # magic cookie
    + dhcp_opts
)
dhcp_frame = _udp("0.0.0.0", "255.255.255.255", 68, 67, dhcp)
frames = [
    arp,
    icmp_frame,
    dhcp_frame,
    _udp("10.0.0.1", "8.8.8.8", 53000, 53, dns_q),
    _tcp("10.0.0.2", "93.184.216.34", 40000, 80, http),
    _tcp("10.0.0.3", "1.1.1.1", 41000, 443, tls),
]
gh = struct.pack("<IHHIIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, 1)  # DLT_EN10MB
body = b""
for i, frame in enumerate(frames):
    body += struct.pack("<IIII", i, 0, len(frame), len(frame)) + frame
pcap.write_bytes(gh + body + b"PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n"); print("http2_preface", 1)
print("pcap", pcap, "packets", len(frames), "bytes", pcap.stat().st_size, "protos=arp,icmp,dhcp,dns,http,tls")

# firmware image: pad + version/service banner strings + squashfs if present
fw_banner = (
    b"OpenWrt 22.03.5 Linux version 5.10.176 "
    b"BusyBox v1.35.0 multi-call binary "
    b"U-Boot 2022.01 dropbear_2022.83 "
    b"httpd uhttpd dropbear telnetd dnsmasq hostapd\n"
)
src = Path("/tmp/repi-firmware-image.bin")
# Minimal ELF64 for CAP_ELF on image second-pass (not a runnable firmware, but honest ELF magic+header)
_mini_elf = (
    b"\x7fELF"
    + bytes([2, 1, 1, 0])  # class=64 LE version
    + b"\x00" * 8
    + struct.pack("<HHIQQQIHHHHHH", 2, 0x3E, 1, 0x401000, 64, 0, 0, 64, 56, 1, 0, 0, 0)
    + b"busybox_stub\x00"
)
if src.exists() and src.stat().st_size > 100:
    raw = src.read_bytes()
    # prepend banner if not already present
    if b"BusyBox v" not in raw and b"OpenWrt" not in raw:
        raw = fw_banner + raw
    if b"\x7fELF" not in raw:
        raw = raw + b"\x00" * 64 + _mini_elf + _build_repi_dtb()
    src.write_bytes(raw)
else:
    src.write_bytes(fw_banner + b"\x00" * 512 + _mini_elf + b"\x00" * 256 + b"hsqs" + b"\x00" * 200)
src.write_bytes(src.read_bytes() + _build_repi_dtb()); print("repi_dtb_mark", len(_build_repi_dtb()), "fw", src.stat().st_size)

# firmware rootfs directory with nested image + version files
root = Path("/tmp/repi-firmware-rootfs-dir")
if root.exists():
    shutil.rmtree(root)
for d in ["bin", "sbin", "etc/init.d", "images", "etc"]:
    (root / d).mkdir(parents=True, exist_ok=True)
(root / "etc/passwd").write_text("root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\n")
(root / "etc/shadow").write_text("root:*:1:0:99999:7:::\n")
(root / "etc/openwrt_release").write_text('DISTRIB_ID="OpenWrt"\nDISTRIB_RELEASE="22.03.5"\nDISTRIB_DESCRIPTION="OpenWrt 22.03.5"\n')
(root / "etc/banner").write_text("BusyBox v1.35.0 (OpenWrt)\nLinux version 5.10.176\n")
(root / "etc/init.d/dropbear").write_text("#!/bin/sh\n# dropbear_2022.83\n")
(root / "etc/init.d/httpd").write_text("#!/bin/sh\n# uhttpd\n")
for name, body in [
    ("bin/busybox", b"\x7fELF" + b"\x00" * 80 + b"BusyBox v1.35.0"),
    ("sbin/dropbear", b"\x7fELF" + b"\x00" * 40 + b"dropbear_2022.83"),
    ("sbin/httpd", b"\x7fELF" + b"\x00" * 40 + b"uhttpd"),
]:
    (root / name).write_bytes(body)
(root / "images/fw.bin").write_bytes(src.read_bytes())
print("fixtures-ok")

# synthetic kubeconfig for cloud identity CAP (no live cluster required)
kube = Path("/tmp/repi-kubeconfig")
kube.write_text("""apiVersion: v1
kind: Config
clusters:
- cluster:
    server: https://127.0.0.1:6443
  name: repi-smoke
contexts:
- context:
    cluster: repi-smoke
    user: repi-user
  name: repi-smoke
current-context: repi-smoke
users:
- name: repi-user
  user:
    token: repi-smoke-token
""")
print("kubeconfig", kube)

# synthetic k8s serviceaccount surface for cloud CAP (no live cluster)
sa = Path("/tmp/repi-k8s-sa")
if sa.exists():
    import shutil as _sh
    _sh.rmtree(sa)
(sa / "namespace").parent.mkdir(parents=True, exist_ok=True)
# mirror projected SA layout under a smoke path; templates also check real /var/run path
(sa / "namespace").write_text("repi-smoke\n")
(sa / "token").write_text('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2t1YmVybmV0ZXMuZGVmYXVsdC5zdmMuY2x1c3Rlci5sb2NhbCIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpyZXBpLXNtb2tlOnJlcGktc2EiLCJhdWQiOlsiaHR0cHM6Ly9rdWJlcm5ldGVzLmRlZmF1bHQuc3ZjLmNsdXN0ZXIubG9jYWwiXSwiZXhwIjoyMDAwMDAwMDAwLCJpYXQiOjE3MDAwMDAwMDAsImt1YmVybmV0ZXMuaW8iOnsibmFtZXNwYWNlIjoicmVwaS1zbW9rZSIsInNlcnZpY2VhY2NvdW50Ijp7Im5hbWUiOiJyZXBpLXNhIiwidWlkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIn19fQ.repi-smoke-sig' + "\n")
(sa / "ca.crt").write_text("-----BEGIN CERTIFICATE-----\nMIIBsmoke\n-----END CERTIFICATE-----\n")
print("k8s-sa", sa)

# synthetic AWS STS get-caller-identity fixture (no live AWS)
sts = Path("/tmp/repi-aws-sts-fixture.json")
sts.write_text(json.dumps({
  "UserId": "AIDAEXAMPLE",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/repi-smoke",
}, indent=2) + "\n")
print("aws-sts-fixture", sts)
