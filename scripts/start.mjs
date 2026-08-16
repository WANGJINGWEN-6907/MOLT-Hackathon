import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Load .env file into process.env before any env checks.
// Vite auto-loads .env at runtime, but this Node script runs before Vite,
// so we need to load it manually here to get accurate env values.
function loadDotEnv() {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    // Only set if not already in environment (system env takes precedence)
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || "5173";
// isLocalDemoMode: true unless a real Supabase project URL+key is configured.
// VITE_LLM_BASE_URL/VITE_LLM_API_KEY are for the LLM proxy only — not Supabase.
const isLocalDemoMode =
  process.env.VITE_FORCE_LOCAL_DEMO === "1" ||
  !(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY);
const disableRemotePlugins = process.env.MOLT_ENABLE_REMOTE_PLUGINS === "1" ? "0" : "1";

const viteBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite.cmd" : "vite",
);

if (!fs.existsSync(viteBin)) {
  console.error("启动失败：未找到 Vite 可执行文件。请先安装依赖：npm install");
  process.exit(1);
}

console.log(`[MOLT] starting dev server on http://${host}:${port}`);
if (isLocalDemoMode) {
  console.log("[MOLT] running in local demo mode (Supabase 未配置，数据将保存在浏览器 localStorage)");
}
if (disableRemotePlugins === "1") {
  console.log("[MOLT] remote injected plugins disabled for local stability");
}

const child = spawn(
  viteBin,
  ["--config", "vite.config.dev.ts", "--host", host, "--port", port],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      MOLT_DISABLE_REMOTE_PLUGINS: disableRemotePlugins,
      VITE_FORCE_LOCAL_DEMO: isLocalDemoMode ? "1" : process.env.VITE_FORCE_LOCAL_DEMO,
    },
    stdio: "inherit",
    shell: false,
  },
);

child.on("error", (error) => {
  console.error("启动失败，请先安装依赖：npm i 或 pnpm install");
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
