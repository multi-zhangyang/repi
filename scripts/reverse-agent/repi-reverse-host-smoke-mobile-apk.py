#!/usr/bin/env python3
"""Build a real mobile smoke APK (apktool) with package/ssl/root + native SO markers."""
from __future__ import annotations

import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

OUT = Path("/tmp/repi-mobile-smoke.apk")
APKTOOL = shutil.which("apktool") or "apktool"


def write_src(root: Path) -> None:
    (root / "smali/com/repi/smoke").mkdir(parents=True, exist_ok=True)
    (root / "res/values").mkdir(parents=True, exist_ok=True)
    (root / "assets").mkdir(parents=True, exist_ok=True)
    (root / "res/xml").mkdir(parents=True, exist_ok=True)
    (root / "lib/arm64-v8a").mkdir(parents=True, exist_ok=True)
    (root / "AndroidManifest.xml").write_text(
        """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.repi.smoke">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <application android:label="RepiSmoke" android:allowBackup="true" android:usesCleartextTraffic="true" android:networkSecurityConfig="@xml/network_security_config">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
    )
    (root / "apktool.yml").write_text(
        """version: 2.9.3
apkFileName: repi-mobile-smoke.apk
isFrameworkApk: false
usesFramework:
  ids:
  - 1
sdkInfo:
  minSdkVersion: '21'
  targetSdkVersion: '30'
packageInfo:
  forcedPackageId: '127'
versionInfo:
  versionCode: '1'
  versionName: '1.0'
doNotCompress:
- resources.arsc
- so
"""
    )
    (root / "res/values/strings.xml").write_text(
        """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">RepiSmoke</string>
    <string name="secret">repi-mobile-secret</string>
</resources>
"""
    )
    (root / "res/xml/network_security_config.xml").write_text(
        """<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system"/>
      <certificates src="user"/>
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">evil.example</domain>
  </domain-config>
</network-security-config>
"""
    )
    (root / "assets/markers.txt").write_text(
        "package=com.repi.smoke\n"
        "activity=com.repi.smoke.MainActivity\n"
        "TrustManager\nCertificatePinner\nisDebuggerConnected\nmagisk\nfrida\nssl pinning\n"
        "OkHttpClient\nnetwork_security_config\nrepi-mobile-secret\nandroid.intent.action.VIEW\nBROWSABLE\nandroid:exported\nrepi://smoke\n"
    )
    # native stub with interesting symbol strings for mobile-so-symbol
    (root / "lib/arm64-v8a/libnative.so").write_bytes(
        b"\x7fELF"
        + (b"\x00" * 48)
        + b"JNI_OnLoad strcmp strncmp memcmp pthread_create SSL_read crypto Java_com_repi_smoke_native"
    )
    (root / "smali/com/repi/smoke/MainActivity.smali").write_text(
        """.class public Lcom/repi/smoke/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 2
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V
    const-string v0, "repi-mobile-secret"
    const-string v1, "CertificatePinner TrustManager OkHttpClient ssl-pinning isDebuggerConnected magisk xposed frida TracerPid"
    const-string v0, "method:onCreate(Landroid/os/Bundle;)V"
    const-string v1, "javax.crypto.Cipher AES MessageDigest Mac"
    return-void
.end method

.method public encryptPayload([B)[B
    .locals 2
    const-string v0, "method:encryptPayload([B)[B"
    const-string v1, "Cipher.doFinal AES/CBC/PKCS5Padding"
    return-object p1
.end method

.method public decryptPayload([B)[B
    .locals 1
    const-string v0, "method:decryptPayload([B)[B"
    return-object p1
.end method

.method protected onResume()V
    .locals 1
    invoke-super {p0}, Landroid/app/Activity;->onResume()V
    const-string v0, "method:onResume()V"
    return-void
.end method
"""
    )


def sign_apk_v1(apk_path: Path) -> None:
    """Add META-INF signing surface (v1) for offline CAP without Play signing."""
    import os
    keystore = Path("/tmp/repi-mobile-smoke.keystore")
    if not keystore.exists():
        # generate once
        subprocess.run(
            [
                "keytool",
                "-genkeypair",
                "-v",
                "-keystore",
                str(keystore),
                "-storepass",
                "repi-smoke",
                "-keypass",
                "repi-smoke",
                "-alias",
                "repi",
                "-keyalg",
                "RSA",
                "-keysize",
                "2048",
                "-validity",
                "3650",
                "-dname",
                "CN=REPI Smoke,OU=RE,O=REPI,L=Local,ST=Dev,C=US",
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=60,
        )
    jarsigner = shutil.which("jarsigner")
    if jarsigner and keystore.exists():
        r = subprocess.run(
            [
                jarsigner,
                "-keystore",
                str(keystore),
                "-storepass",
                "repi-smoke",
                "-keypass",
                "repi-smoke",
                "-signedjar",
                str(apk_path),
                str(apk_path),
                "repi",
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if r.returncode != 0:
            # fallback: inject synthetic META-INF markers (still honest offline CAP)
            _inject_meta_inf_markers(apk_path)
        return
    _inject_meta_inf_markers(apk_path)


def _inject_meta_inf_markers(apk_path: Path) -> None:
    """Synthetic META-INF entries when jarsigner/keytool unavailable."""
    mf = "\n".join([
        "Manifest-Version: 1.0",
        "Created-By: REPI-Smoke",
        "",
        "Name: AndroidManifest.xml",
        "SHA-256-Digest: YWJjZGVmZ2hpamtsbW5vcA==",
        "",
        "Name: classes.dex",
        "SHA-256-Digest: cXdlcnR5dWlvcGFzZGZnaA==",
        "",
    ])
    sf = "\n".join([
        "Signature-Version: 1.0",
        "Created-By: REPI-Smoke",
        "SHA-256-Digest-Manifest: bWFuaWZlc3Q=",
        "",
        "Name: AndroidManifest.xml",
        "SHA-256-Digest: YWJjZGVmZ2hpamtsbW5vcA==",
        "",
    ])
    rsa = b"\x30\x82" + b"REPI-SMOKE-CERT" + b"\x00" * 64  # not a real X509; labeled synthetic
    tmp = apk_path.with_suffix(".signed.tmp.apk")
    with zipfile.ZipFile(apk_path, "r") as zin, zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            if item.filename.startswith("META-INF/"):
                continue
            zout.writestr(item, zin.read(item.filename))
        zout.writestr("META-INF/MANIFEST.MF", mf)
        zout.writestr("META-INF/REPI.SF", sf)
        zout.writestr("META-INF/REPI.RSA", rsa)
        zout.writestr("META-INF/CERT.SF", sf)
    tmp.replace(apk_path)


def inject_native_so(apk_path: Path) -> None:
    """Ensure lib/arm64-v8a/libnative.so exists even if apktool drops unknown dirs."""
    so_name = "lib/arm64-v8a/libnative.so"
    so_bytes = (
        b"\x7fELF"
        + (b"\x00" * 48)
        + b"JNI_OnLoad strcmp strncmp memcmp pthread_create SSL_read crypto Java_com_repi_smoke_native"
    )
    tmp = apk_path.with_suffix(".tmp.apk")
    with zipfile.ZipFile(apk_path, "r") as zin, zipfile.ZipFile(tmp, "w") as zout:
        for item in zin.infolist():
            if item.filename == so_name:
                continue
            zout.writestr(item, zin.read(item.filename))
        zout.writestr(so_name, so_bytes)
    tmp.replace(apk_path)


def main() -> int:
    td = Path(tempfile.mkdtemp(prefix="repi-apk-src-"))
    try:
        write_src(td)
        out = Path("/tmp/repi-mobile-smoke-built.apk")
        if out.exists():
            out.unlink()
        r = subprocess.run(
            [APKTOOL, "b", str(td), "-o", str(out), "-f"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if r.returncode != 0 or not out.exists():
            print(r.stdout)
            print(r.stderr)
            raise SystemExit(f"apktool build failed rc={r.returncode}")
        inject_native_so(out)
        sign_apk_v1(out)
        shutil.copyfile(out, OUT)
        shutil.copyfile(out, "/tmp/repi-mobile-sample.apk")
        print(OUT)
        return 0
    finally:
        shutil.rmtree(td, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
