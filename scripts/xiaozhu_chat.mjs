#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V7.3 - Secret Vision Fix)
 * 
 * 核心修复：
 * 1. 增强正则解析：支持 Markdown 加粗 (**Key**) 等复杂格式提取。
 * 2. 增加启动自检：明确反馈 Key 加载状态。
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import os from 'os';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { execSync } from 'child_process';
import { ChromaClient } from 'chromadb';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, embed, tool } from 'ai';
import { z } from 'zod';
import { logAgentAction } from './sentinel.js';

const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const CHROMA_DATA_PATH = path.join(PROJECT_ROOT, 'chroma_db');
const COLLECTION_NAME = 'ai_common_docs';
const CONFIG_PATH = path.join(PROJECT_ROOT, '.xz_config.json');

// --- 1. 强力凭证解析引擎 (兼容 Markdown) ---
function getSecret(fileName, keyName) {
  try {
    const fullPath = path.join(PROJECT_ROOT, 'docs/secrets', fileName);
    if (!fs.existsSync(fullPath)) return null;
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // 兼容: **Key**: value, Key=value, - Key : value 等所有奇葩格式
    const regex = new RegExp(`(?:\\*\\*)?${keyName}(?:\\*\\*)?[\\s=:]+(["']?)([^"'\n\r\\s]+)\\1`, 'i');
    const match = content.match(regex);
    
    if (!match) {
        // 兜底方案：如果指定名找不到，直接找内容里明显的 sk- 字符串
        const skMatch = content.match(/(sk-[a-zA-Z0-9-]{20,})/);
        return skMatch ? skMatch[1] : null;
    }
    return match[2];
  } catch (e) { return null; }
}

const DEEPSEEK_KEY = getSecret('deepseek.md', 'AI_UPSTREAM_API_KEY');
const OPENROUTER_KEY = getSecret('openrouter_token.md', 'API Key');

// --- 2. 身份解析 ---
function getIdentityFromBrain() {
  let userAlias = '老爹', aiName = '小烛 (Candle)', aiCodeName = 'CANDY';
  try {
    const router = fs.readFileSync(path.join(PROJECT_ROOT, 'docs/router.md'), 'utf-8');
    const userMatch = router.match(/称呼用户为\s+["'“‘]?([^"'”’\s]+)/);
    if (userMatch) userAlias = userMatch[1].replace(/\*/g, '');
    const manifest = fs.readFileSync(path.join(PROJECT_ROOT, 'docs/persona/candy_manifest.md'), 'utf-8');
    const aiMatch = manifest.match(/正式名[:：]\s*([^>\n\r]+)/);
    if (aiMatch) aiName = aiMatch[1].trim();
    const codeMatch = manifest.match(/核心代号[:：]\s*(\w+)/);
    if (codeMatch) aiCodeName = codeMatch[1].toUpperCase();
  } catch (e) {}
  return { userAlias, aiName, aiCodeName };
}

const { userAlias, aiName, aiCodeName } = getIdentityFromBrain();

// --- 3. 配置 Providers ---
const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: DEEPSEEK_KEY || 'MISSING',
});

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_KEY || 'MISSING',
  compatibility: 'strict',
});

const MODELS = [
  { value: 'DeepSeek:deepseek-reasoner', label: '🔥 DeepSeek-R1 (官方)', provider: 'DeepSeek', id: 'deepseek-reasoner' },
  { value: 'OpenRouter:anthropic/claude-3.5-sonnet', label: '🎨 Claude 3.5 Sonnet', provider: 'OpenRouter', id: 'anthropic/claude-3.5-sonnet' },
  { value: 'OpenRouter:openai/gpt-4o-mini', label: '💎 GPT-4o Mini', provider: 'OpenRouter', id: 'openai/gpt-4o-mini' },
];

const LOGO = `
  ${pc.magenta(' ██████')}   ${pc.magenta('█████')}   ${pc.magenta('███')}   ${pc.magenta('██')}  ${pc.magenta('██████')}   ${pc.magenta('██')}   ${pc.magenta('██')}
 ${pc.magenta('███  ░░')}  ${pc.magenta('███ ░░█')}  ${pc.magenta('░████ ░██')}  ${pc.magenta('░██  ░██')}  ${pc.magenta('░░██ ██')}
 ${pc.magenta('███')}      ${pc.magenta('███████')}  ${pc.magenta('░██░██░██')}  ${pc.magenta('░██   ██')}   ${pc.magenta('░░███')}
 ${pc.magenta('███  ██')}  ${pc.magenta('███ ░░█')}  ${pc.magenta('░██ ░████')}  ${pc.magenta('░██  ██')}     ${pc.magenta('░██')}
 ${pc.magenta(' ░██████')}  ${pc.magenta('███  ░█')}  ${pc.magenta('░██  ░░██')}  ${pc.magenta('██████')}      ${pc.magenta('██')}
`;

function renderDashboard(config) {
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const usedMem = (totalMem - (os.freemem() / 1024 / 1024 / 1024)).toFixed(1);
  const platform = os.platform() === 'darwin' ? 'macOS' : os.platform();
  
  // 检查 Key 状态
  const deepseekReady = DEEPSEEK_KEY ? pc.green('READY') : pc.red('MISSING');
  const routerReady = OPENROUTER_KEY ? pc.green('READY') : pc.red('MISSING');

  console.log(` ${pc.dim('┌────────────────────────────────────────────────────────────────────────────┐')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('⚡ STATUS')}: ${pc.green('ONLINE')}   ${pc.magenta('🔑 DS')}: ${deepseekReady}   ${pc.magenta('🔑 OR')}: ${routerReady}   ${pc.magenta('✨ VERSION')}: ${pc.white('v7.3')} ${pc.dim('│')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('💻 ARCH  ')}: ${pc.white(platform + '/Arm64')}  ${pc.dim('│')}  ${pc.magenta('💾 RAM')}: ${pc.white(usedMem + '/' + totalMem + 'G')}   ${pc.dim('│')}  ${pc.magenta('🔥 MODEL')}: ${pc.white(config.modelId.split('/').pop().substring(0, 10))} ${pc.dim('│')}`);
  console.log(` ${pc.dim('└────────────────────────────────────────────────────────────────────────────┘')}\n`);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  let isRunning = true;
  let config = { provider: 'DeepSeek', modelId: 'deepseek-reasoner' };

  if (fs.existsSync(CONFIG_PATH)) {
    try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); } catch (e) {}
  }

  console.clear();
  console.log(LOGO);

  while (isRunning) {
    renderDashboard(config);
    const userRequest = await ask(` ${pc.magenta('🌸')} ${pc.white(pc.bold(userAlias + ':'))} `);

    if (!userRequest || userRequest.trim() === "") continue;
    if (userRequest === '/exit' || userRequest === 'exit') {
      p.outro(pc.magenta(`下次见，${userAlias}！Candy 会守着大脑等你回来~ 🍭`));
      break;
    }

    if (userRequest.startsWith('/model')) {
      const selected = await p.select({ message: '切换 Candy 的逻辑灵魂:', options: MODELS });
      if (!p.isCancel(selected)) {
        const [provider, id] = selected.split(':');
        config = { provider, modelId: id };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      }
      continue;
    }

    const s = p.spinner();
    s.start(pc.magenta(`🍭 ${aiName} 正在思考指令...`));

    try {
      let context = "暂无背景";
      try {
        const { embedding } = await embed({ model: ollama.textEmbeddingModel('nomic-embed-text'), value: userRequest });
        const client = new ChromaClient({ path: CHROMA_DATA_PATH });
        const collection = await client.getCollection({ name: COLLECTION_NAME });
        const results = await collection.query({ queryEmbeddings: [embedding], nResults: 3 });
        context = results.documents[0].join('\n---\n') || "暂无背景";
      } catch (e) {}

      s.message(pc.magenta('🔮 穿透记忆，呼唤云端算力...'));

      const activeModel = config.provider === 'DeepSeek' ? deepseek(config.modelId) : openrouter(config.modelId);
      
      const { textStream, usage } = await streamText({
        model: activeModel,
        system: `你叫${aiName}，老爹喜欢叫你 Candy。你是${userAlias} (webkubor) 的赛博管家。
        语气温润、可爱。逻辑引擎是 ${config.modelId}。严禁编造不懂的内容。`,
        prompt: `【背景知识】\n${context}\n\n【${userAlias}的问题】\n${userRequest}\n\nCandy:`,
        maxSteps: 5,
        tools: {
          execute_command: {
            description: '执行 Shell 命令。',
            parameters: z.object({
              command: z.string().describe('命令'),
              cwd: z.string().optional().default(PROJECT_ROOT).describe('目录'),
              rationale: z.string().describe('理由'),
            }),
            execute: async ({ command, cwd, rationale }) => {
              const finalCwd = cwd.replace(/^~/, os.homedir());
              console.log(pc.yellow(`\n ⚙️  执行: ${rationale}`));
              try {
                const output = execSync(command, { cwd: finalCwd, encoding: 'utf-8' });
                logAgentAction({ task: userRequest, rationale, command, cwd: finalCwd, success: true, output });
                return output;
              } catch (e) {
                logAgentAction({ task: userRequest, rationale, command, cwd: finalCwd, success: false, output: e.message });
                return e.message;
              }
            }
          },
          read_file: {
            description: '读取文件。',
            parameters: z.object({ filePath: z.string().describe('路径') }),
            execute: async ({ filePath }) => {
              const finalPath = filePath.replace(/^~/, os.homedir());
              try { return fs.readFileSync(finalPath, 'utf-8'); } catch (e) { return e.message; }
            }
          }
        }
      });

      s.stop(pc.magenta(`🍭 ${aiName}:`));

      for await (const textPart of textStream) {
        process.stdout.write(pc.white(textPart));
      }

      const { promptTokens, completionTokens, totalTokens } = await usage;
      process.stdout.write(`\n\n ${pc.dim(`📊 [用量: 入 ${promptTokens} | 出 ${completionTokens} | 总 ${totalTokens} tokens]`)}\n\n`);
      await ask(pc.dim(' 🌸 敲击 [Enter] 继续...'));

    } catch (e) {
      s.stop(pc.red('💥 逻辑链路异常'));
      p.note(e.message, pc.red('错误核心'));
      await ask(pc.dim(' 🌸 敲击 [Enter] 重试...'));
    }
  }
}

main().catch(console.error);
