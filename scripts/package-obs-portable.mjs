// OBS Studio (Windows portable zip) + このアプリの dist + ランチャーを束ねて
// release/obs-restream-portable-<obsver>.zip を作る。
//
// 使い方: pnpm package:obs [--obs-version 32.2.2] [--skip-build] [--refresh]
//   OBS_VERSION 環境変数でも版を固定できる。未指定なら GitHub の latest。
//   GITHUB_TOKEN があれば API のレート制限回避に使う。
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(repo, ".cache", "obs");
const releaseDir = join(repo, "release");
const stageName = "obs-restream-portable";
const stageDir = join(releaseDir, stageName);

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const wantedVersion = argValue("--obs-version") ?? process.env.OBS_VERSION;
const skipBuild = args.includes("--skip-build");
const refresh = args.includes("--refresh");

if (process.platform !== "win32") {
  throw new Error(
    "このスクリプトは Windows 専用です（tar.exe で zip を扱います）。",
  );
}
// Git Bash 等の GNU tar ではなく Windows 標準の bsdtar を使う（zip を扱える）。
const tar = join(
  process.env.SystemRoot ?? "C:\\Windows",
  "System32",
  "tar.exe",
);

const run = (cmd, cmdArgs, opts = {}) => {
  const r = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${cmdArgs.join(" ")} failed (exit ${r.status})`);
  }
};

const userAgent = "obs-restream-tool-packager";
const ghHeaders = {
  "User-Agent": userAgent,
  Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

const fetchRelease = async () => {
  const url = wantedVersion
    ? `https://api.github.com/repos/obsproject/obs-studio/releases/tags/${wantedVersion}`
    : "https://api.github.com/repos/obsproject/obs-studio/releases/latest";
  const res = await fetch(url, { headers: ghHeaders });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  return res.json();
};

const sha256 = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

const download = async (url, dest, expectedSize) => {
  const res = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (!res.ok || !res.body) {
    throw new Error(`download failed ${res.status}: ${url}`);
  }
  const total = Number(res.headers.get("content-length") ?? expectedSize ?? 0);
  let done = 0;
  let lastPct = -1;
  const part = `${dest}.part`;
  const body = Readable.fromWeb(res.body);
  body.on("data", (chunk) => {
    done += chunk.length;
    if (total) {
      const pct = Math.floor((done / total) * 100);
      if (pct !== lastPct && pct % 10 === 0) {
        lastPct = pct;
        console.log(`  ${pct}% (${(done / 1048576).toFixed(0)} MB)`);
      }
    }
  });
  await pipeline(body, createWriteStream(part));
  renameSync(part, dest);
};

// 1) アプリをビルド
if (!skipBuild) {
  console.log("== pnpm build");
  run("pnpm build", [], { cwd: repo, shell: true });
}
if (!existsSync(join(repo, "dist", "index.html"))) {
  throw new Error(
    "dist/index.html がありません。pnpm build を先に実行してください。",
  );
}

// 2) OBS zip を取得（キャッシュ）
console.log("== OBS release lookup");
const release = await fetchRelease();
const tag = release.tag_name;
const asset = release.assets.find((a) =>
  /^OBS-Studio-.*-Windows-x64\.zip$/.test(a.name),
);
if (!asset) throw new Error(`Windows x64 zip asset not found in ${tag}`);
console.log(
  `   ${tag}: ${asset.name} (${(asset.size / 1048576).toFixed(0)} MB)`,
);

mkdirSync(cacheDir, { recursive: true });
const zipPath = join(cacheDir, asset.name);
if (refresh && existsSync(zipPath)) rmSync(zipPath);
if (existsSync(zipPath) && statSync(zipPath).size !== asset.size) {
  console.log("   cached file size mismatch; re-downloading");
  rmSync(zipPath);
}
if (existsSync(zipPath)) {
  console.log("   using cached zip");
} else {
  console.log("== downloading");
  await download(asset.browser_download_url, zipPath, asset.size);
}
if (typeof asset.digest === "string" && asset.digest.startsWith("sha256:")) {
  const expected = asset.digest.slice("sha256:".length);
  if (sha256(zipPath) !== expected) {
    rmSync(zipPath);
    throw new Error(`sha256 mismatch for ${asset.name}; removed cache, rerun.`);
  }
  console.log("   sha256 OK");
}

// 3) 展開（毎回まっさらな場所へ）
const extractDir = join(cacheDir, `extract-${tag}`);
rmSync(extractDir, { recursive: true, force: true });
mkdirSync(extractDir, { recursive: true });
console.log("== extracting");
run(tar, ["-xf", zipPath, "-C", extractDir]);

// 4) 組み立て
console.log("== assembling");
rmSync(stageDir, { recursive: true, force: true });
mkdirSync(stageDir, { recursive: true });
// zip 直下に bin/ があるはずだが、念のため 1 階層下にある場合にも対応する。
let obsRoot = extractDir;
if (!existsSync(join(obsRoot, "bin"))) {
  const sub = readdirSync(extractDir).find((n) =>
    existsSync(join(extractDir, n, "bin")),
  );
  if (!sub) throw new Error("bin/ が展開結果に見つかりません");
  obsRoot = join(extractDir, sub);
}
cpSync(obsRoot, stageDir, { recursive: true });
if (!existsSync(join(stageDir, "bin", "64bit", "obs64.exe"))) {
  throw new Error("bin/64bit/obs64.exe がありません");
}

writeFileSync(join(stageDir, "portable_mode.txt"), "");
cpSync(join(repo, "dist"), join(stageDir, "app"), { recursive: true });
cpSync(join(repo, "packaging", "templates"), join(stageDir, "templates"), {
  recursive: true,
});
for (const f of ["Start-OBS-Restream.bat", "README.txt"]) {
  copyFileSync(join(repo, "packaging", f), join(stageDir, f));
}
// PowerShell 5.1 は BOM なしの UTF-8 を ANSI として読むので BOM を保証する。
{
  const ps1 = readFileSync(join(repo, "packaging", "Start-OBS-Restream.ps1"));
  const hasBom = ps1[0] === 0xef && ps1[1] === 0xbb && ps1[2] === 0xbf;
  writeFileSync(
    join(stageDir, "Start-OBS-Restream.ps1"),
    hasBom ? ps1 : Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), ps1]),
  );
}
writeFileSync(
  join(stageDir, "OBS-VERSION.txt"),
  [
    `OBS Studio ${tag}`,
    asset.browser_download_url,
    `Source: https://github.com/obsproject/obs-studio/tree/${tag}`,
    "License: GPL-2.0-or-later (license files from the official zip are kept as-is)",
    "",
  ].join("\n"),
);

// ライセンス文書が公式 zip に含まれているか確認（無ければ警告）
const licenseHits = [];
const walk = (dir, depth) => {
  if (depth > 4) return;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, depth + 1);
    else if (/(license|copying|gpl)/i.test(ent.name)) licenseHits.push(p);
  }
};
walk(stageDir, 0);
const obsLicenses = licenseHits.filter(
  (p) => !p.startsWith(join(stageDir, "app")),
);
console.log(`   license files from OBS zip: ${obsLicenses.length}`);
for (const p of obsLicenses.slice(0, 8)) {
  console.log(`     ${p.slice(stageDir.length + 1)}`);
}
if (obsLicenses.length === 0) {
  console.warn("   WARNING: OBS zip 内にライセンスファイルが見つかりません");
}

// 5) zip 化
const outZip = join(releaseDir, `${stageName}-${tag}.zip`);
rmSync(outZip, { force: true });
console.log("== zipping");
run(tar, ["-a", "-c", "-f", outZip, "-C", releaseDir, stageName]);
console.log(
  `\nDone: ${outZip} (${(statSync(outZip).size / 1048576).toFixed(0)} MB)`,
);
