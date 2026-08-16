import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const artifactsDir = path.join(projectRoot, ".artifacts", "e2e");
const appPort = Number(process.env.E2E_APP_PORT || "4173");
const chromePort = Number(process.env.E2E_CHROME_PORT || "9222");
const baseUrl = `http://127.0.0.1:${appPort}`;

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
          response.resume();
          if (response.statusCode && response.statusCode < 500) {
            resolve(undefined);
            return;
          }
          reject(new Error(`unexpected status ${response.statusCode}`));
        });
        request.on("error", reject);
      });
      return;
    } catch {
      await delay(500);
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function getJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        reject(new Error(`Request failed: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
    request.end();
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.consoleErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);

    await new Promise((resolve, reject) => {
      this.ws.once("open", resolve);
      this.ws.once("error", reject);
    });

    this.ws.on("message", (raw) => {
      const message = JSON.parse(String(raw));

      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) {
          return;
        }

        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message));
          return;
        }

        pending.resolve(message.result);
        return;
      }

      this.events.push(message);
      if (message.method === "Runtime.consoleAPICalled") {
        const text = (message.params.args || [])
          .map((arg) => arg.value ?? arg.description ?? "")
          .join(" ");
        if (message.params.type === "error" || /error/i.test(text)) {
          this.consoleErrors.push(text);
        }
      }

      if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
        this.consoleErrors.push(message.params.entry.text);
      }
    });
  }

  async send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }

    const response = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.ws.send(JSON.stringify(payload));
    return response;
  }

  async close() {
    if (!this.ws) {
      return;
    }

    await new Promise((resolve) => {
      this.ws.once("close", resolve);
      this.ws.close();
    });
  }
}

async function startServer() {
  const child = spawn(process.execPath, ["scripts/start.mjs"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(appPort),
      HOST: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForHttp(baseUrl);
  return child;
}

async function startChromium() {
  const userDataDir = path.join(artifactsDir, "chrome-profile");
  await fs.rm(userDataDir, { recursive: true, force: true });

  const child = spawn(
    "chromium",
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForHttp(`http://127.0.0.1:${chromePort}/json/version`);
  return child;
}

async function createPage(client) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("DOM.enable");
  await client.send("Log.enable");

  return {
    async sendCommand(method, params = {}) {
      return client.send(method, params);
    },
    async setViewport({ width, height, mobile = false, deviceScaleFactor = 1 }) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        mobile,
        deviceScaleFactor,
      });
    },
    async navigate(url) {
      await client.send("Page.navigate", { url });
      const startedAt = Date.now();
      let lastReadyState = "unknown";
      let lastUrl = "unknown";
      let bodyReady = false;

      while (Date.now() - startedAt < 20_000) {
        lastReadyState = await this.evaluate("document.readyState");
        lastUrl = await this.evaluate("location.href");
        bodyReady = await this.evaluate("Boolean(document.body)");
        if (normalizeUrl(lastUrl) === normalizeUrl(url) && bodyReady) {
          return;
        }
        await delay(100);
      }

      throw new Error(`Timed out waiting for navigation to ${url} (lastUrl=${lastUrl}, readyState=${lastReadyState}, bodyReady=${bodyReady})`);
    },
    async evaluate(expression) {
      const result = await client.send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });

      return result.result?.value;
    },
    async screenshot(name) {
      const { data } = await client.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });
      await fs.writeFile(path.join(artifactsDir, name), Buffer.from(data, "base64"));
    },
  };
}

async function waitFor(page, predicate, description, timeoutMs = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await page.evaluate(predicate);
    if (result) {
      return result;
    }
    await delay(150);
  }

  throw new Error(`Timed out waiting for ${description}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function clearClientState(page) {
  await page.evaluate(`
    (() => {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    })()
  `);
}

async function clickByText(page, selector, text) {
  const clicked = await page.evaluate(`
    (() => {
      const elements = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      const target = elements.find((element) => element.textContent?.trim().includes(${JSON.stringify(text)}));
      if (!target) return false;
      target.click();
      return true;
    })()
  `);
  assert(clicked, `Could not click ${text}`);
}

async function setConversationAnswerValue(page, value) {
  const updated = await page.evaluate(`
    (() => {
      const bridge = window.__MOLT_E2E__?.conversation;
      if (!bridge) return false;
      bridge.setAnswer(${JSON.stringify(value)});
      return true;
    })()
  `);
  assert(updated, "Could not update textarea");
}

async function setDomTextareaValue(page, value) {
  const updated = await page.evaluate(`
    (() => {
      const textarea = document.querySelector('textarea');
      if (!textarea) return false;
      textarea.focus();
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      descriptor?.set?.call(textarea, '');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `);
  assert(updated, "Could not update DOM textarea");
  await page.sendCommand("Input.insertText", { text: value });
}

async function ensureNoHorizontalOverflow(page, label) {
  const noOverflow = await page.evaluate(`
    (() => {
      const width = window.innerWidth;
      return document.documentElement.scrollWidth <= width + 1 && document.body.scrollWidth <= width + 1;
    })()
  `);
  assert(noOverflow, `${label} has horizontal overflow`);
}

async function waitForButtonEnabled(page, label) {
  await waitFor(
    page,
    `(() => {
      if (${JSON.stringify(label)} === '发送' && window.__MOLT_E2E__?.conversation) {
        return window.__MOLT_E2E__.conversation.currentAnswer.trim().length > 0;
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((button) => button.textContent?.trim().includes(${JSON.stringify(label)}) && !button.disabled);
    })()`,
    `${label} button enabled`
  );
}

async function sendConversationAnswer(page, answer) {
  await waitFor(
    page,
    `Boolean(window.__MOLT_E2E__?.conversation)`,
    "conversation bridge"
  );
  await setConversationAnswerValue(page, answer);
  await waitForButtonEnabled(page, "发送");
  const sent = await page.evaluate(`
    (() => {
      const bridge = window.__MOLT_E2E__?.conversation;
      if (!bridge) return false;
      return bridge.send().then(() => true);
    })()
  `);
  assert(sent, "Could not send conversation answer");
}

async function runPathAFlow(page) {
  await page.setViewport({ width: 390, height: 844, mobile: true, deviceScaleFactor: 2 });
  await page.navigate(`${baseUrl}/`);
  await clearClientState(page);
  await page.navigate(`${baseUrl}/`);
  await waitFor(
    page,
    `document.body.innerText.includes('开始脱壳') && document.body.innerText.includes('你不是被时代') && document.body.innerText.includes('淘汰的人。') && document.body.innerText.includes('你是正在换壳')`,
    "landing page"
  );
  await ensureNoHorizontalOverflow(page, "Landing mobile");
  await page.screenshot("landing-mobile-final.png");
  await clickByText(page, "button", "开始脱壳");

  await waitFor(page, `location.pathname === '/onboarding'`, "onboarding route");
  await waitFor(page, `document.body.innerText.includes('认出你现在的状态')`, "onboarding content");
  await ensureNoHorizontalOverflow(page, "Onboarding mobile");
  await page.screenshot("onboarding-mobile-final.png");
  await clickByText(page, "button", "我有点像这个");

  await waitFor(page, `location.pathname === '/conversation/A'`, "conversation A route");
  await waitFor(page, `document.body.innerText.includes('第 1 / 4 幕')`, "conversation header");
  await ensureNoHorizontalOverflow(page, "Conversation mobile");
  await page.screenshot("conversation-a-mobile-final.png");

  const answers = [
    "公司开始裁员那周，我第一次明确觉得自己会被替代。",
    "我卡在不知道过去的经验还能不能迁移，也不知道先学什么。",
    "我最想把原来的行业经验转成新的可用能力，而不是被迫清零。",
    "我现在还能先整理自己的项目经验，然后找三个真实岗位对照差距。",
  ];

  for (const answer of answers) {
    await sendConversationAnswer(page, answer);
  }

  await waitFor(page, `location.pathname === '/mirror/A'`, "mirror A route");
  await waitFor(page, `document.body.innerText.includes('这是你的镜像')`, "mirror content");
  await page.screenshot("mirror-a-final.png");
  await clickByText(page, "button", "是的，继续");

  await waitFor(page, `location.pathname === '/result/A'`, "result A route");
  await waitFor(page, `document.body.innerText.includes('你的置换压力区间')`, "result content");
  await page.setViewport({ width: 1440, height: 1400, mobile: false, deviceScaleFactor: 1 });
  await page.screenshot("result-a-desktop-final.png");
  await clickByText(page, "button", "我想听她说的那句话");

  await waitFor(page, `location.pathname === '/map'`, "map route from result");
}

async function runMapSignalFlow(page) {
  await waitFor(page, `document.body.innerText.includes('换壳地图')`, "map title");
  await page.setViewport({ width: 1440, height: 1200, mobile: false, deviceScaleFactor: 1 });
  await page.screenshot("map-desktop-final.png");

  const dialogOpened = await page.evaluate(`
    (() => {
      const circle = document.querySelector('svg circle');
      if (!circle) return false;
      circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    })()
  `);
  assert(dialogOpened, "Could not click map node");

  await waitFor(page, `document.body.innerText.includes('灯塔轨迹') || document.body.innerText.includes('探索者')`, "node dialog");
  const signalAreaVisible = await waitFor(
    page,
    `document.body.innerText.includes('发送信号给 TA')`,
    "signal composer"
  );
  assert(signalAreaVisible, "Signal composer did not appear");
  await setDomTextareaValue(page, "谢谢你，我也准备开始把旧经验重新整理成新路径。");
  await clickByText(page, "button", "发送信号");
  await waitFor(page, `document.body.innerText.includes('✓ 信号已发送')`, "signal sent state");
  await page.screenshot("map-signal-dialog-final.png");
}

async function runPathCFlow(page) {
  await page.setViewport({ width: 390, height: 844, mobile: true, deviceScaleFactor: 2 });
  await page.navigate(`${baseUrl}/onboarding`);
  await waitFor(page, `document.body.innerText.includes('认出你现在的状态')`, "onboarding content");

  const clicked = await page.evaluate(`
    (() => {
      const cards = Array.from(document.querySelectorAll('button'));
      const target = cards.find((element) => element.textContent?.trim().includes('我有点像这个') && element.closest('[data-path-card="C"]'));
      if (target) {
        target.click();
        return true;
      }

      const all = Array.from(document.querySelectorAll('button'));
      const third = all.filter((element) => element.textContent?.trim().includes('我有点像这个'))[2];
      if (!third) return false;
      third.click();
      return true;
    })()
  `);
  assert(clicked, "Could not select Path C");

  await waitFor(page, `location.pathname === '/conversation/C'`, "conversation C route");
  const answers = [
    "我在上一家公司业务收缩时，意识到必须重新定义自己的职业方向。",
    "最难的时候，是以前带过我的前辈一直提醒我别急着否定自己。",
    "那段经历让我更会拆解问题，也更知道自己适合带团队和做判断。",
    "别把短期的失序，当成你整个人都不行。",
    "我愿意把自己的转型过程写清楚，给后来的人一个能参考的路标。",
  ];

  for (const answer of answers) {
    await waitFor(page, `document.querySelector('textarea') !== null`, "conversation textarea");
    await sendConversationAnswer(page, answer);
  }

  await waitFor(page, `location.pathname === '/mirror/C'`, "mirror C route");
  await clickByText(page, "button", "是的，继续");
  await waitFor(page, `location.pathname === '/archive'`, "archive route");
  await waitFor(page, `document.body.innerText.includes('成为灯塔')`, "archive content");
  await clickByText(page, "button", "完成建档");
  await waitFor(page, `location.pathname === '/map'`, "map route from archive");

  const archiveCount = await page.evaluate(`
    (() => {
      const raw = localStorage.getItem('molt_local_database');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.archives) ? parsed.archives.length : 0;
    })()
  `);
  assert(archiveCount >= 1, "Archive was not persisted in local demo mode");
}

async function main() {
  await ensureDir(artifactsDir);

  let server;
  let browser;
  let client;

  try {
    server = await startServer();
    browser = await startChromium();
    const pageTarget = await getJson(
      `http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent("about:blank")}`,
      "PUT"
    );
    client = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    const page = await createPage(client);
    await runPathAFlow(page);
    await runMapSignalFlow(page);
    await runPathCFlow(page);

    const meaningfulErrors = client.consoleErrors.filter(
      (entry) => !entry.includes("Failed to load resource") && !entry.includes("favicon")
    );
    assert(meaningfulErrors.length === 0, `Browser console errors detected:\n${meaningfulErrors.join("\n")}`);

    console.log("[e2e] Passed: Path A, map signal, and Path C archive flows completed.");
    console.log(`[e2e] Screenshots saved to ${artifactsDir}`);
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }

    if (browser && !browser.killed) {
      browser.kill("SIGTERM");
    }

    if (server && !server.killed) {
      server.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error("[e2e] Failed:", error.message);
  process.exit(1);
});
