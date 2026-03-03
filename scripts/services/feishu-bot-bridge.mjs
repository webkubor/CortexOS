#!/usr/bin/env node

import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const secretHome = process.env.CORTEXOS_SECRET_HOME || path.join(process.env.HOME || "", "Documents", "memory", "secrets");
const configPath = path.join(secretHome, "feishu_bot.env");

function loadConfig() {
  const env = {};
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      env[key] = value;
    }
  }
  return {
    appId: process.env.FEISHU_APP_ID || env.FEISHU_APP_ID || "",
    appSecret: process.env.FEISHU_APP_SECRET || env.FEISHU_APP_SECRET || "",
    verificationToken: process.env.FEISHU_VERIFICATION_TOKEN || env.FEISHU_VERIFICATION_TOKEN || "",
    port: Number(process.env.FEISHU_BOT_PORT || env.FEISHU_BOT_PORT || "8788"),
    brainEndpoint: process.env.BRAIN_CHAT_ENDPOINT || env.BRAIN_CHAT_ENDPOINT || "",
  };
}

const cfg = loadConfig();
if (!cfg.appId || !cfg.appSecret) {
  console.error("Missing FEISHU_APP_ID / FEISHU_APP_SECRET.");
  console.error(`Please configure: ${configPath}`);
  process.exit(1);
}

let tokenCache = { token: "", expiresAt: 0 };

async function getTenantToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.token;
  }
  const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: cfg.appId,
      app_secret: cfg.appSecret,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 0) {
    throw new Error(`tenant token failed: ${JSON.stringify(json)}`);
  }
  tokenCache = {
    token: json.tenant_access_token,
    expiresAt: now + (json.expire - 60) * 1000,
  };
  return tokenCache.token;
}

async function sendTextToChat(chatId, text) {
  const token = await getTenantToken();
  const res = await fetch("https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: "text",
      content: JSON.stringify({ text }),
    }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 0) {
    throw new Error(`send message failed: ${JSON.stringify(json)}`);
  }
}

function parseIncomingText(event) {
  try {
    if (event.message?.message_type !== "text") return "";
    const raw = event.message?.content || "";
    const payload = JSON.parse(raw);
    return String(payload.text || "").trim();
  } catch {
    return "";
  }
}

async function callBrain(userText, event) {
  if (!cfg.brainEndpoint) {
    return `已收到: ${userText}\n\n提示: 未配置 BRAIN_CHAT_ENDPOINT，当前为回声模式。`;
  }
  const res = await fetch(cfg.brainEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: userText,
      source: "feishu",
      event,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`brain endpoint failed: ${res.status}`);
  }
  return String(json.reply || json.text || "已收到。");
}

async function handleEvent(body) {
  const event = body?.event || {};
  const type = body?.event?.type || body?.header?.event_type;
  if (type !== "im.message.receive_v1") return;

  const userText = parseIncomingText(event);
  if (!userText) return;

  const chatId = event.message?.chat_id;
  if (!chatId) return;

  const reply = await callBrain(userText, event);
  await sendTextToChat(chatId, reply.slice(0, 4000));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/feishu/events") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  try {
    const body = await readJson(req);

    if (body?.type === "url_verification" && body?.challenge) {
      if (cfg.verificationToken && body.token && body.token !== cfg.verificationToken) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid verification token" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ challenge: body.challenge }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 0 }));

    handleEvent(body).catch((err) => {
      console.error("[event] handle failed:", err.message);
    });
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(cfg.port, () => {
  console.log(`Feishu bot bridge listening on :${cfg.port}`);
  console.log("POST /feishu/events");
  console.log("GET  /healthz");
});
