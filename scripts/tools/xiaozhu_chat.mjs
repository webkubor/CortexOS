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
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { kernel } from '../core/kernel.mjs';

const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });

// --- 1. 初始化内核与引擎 ---
const DEEPSEEK_KEY = kernel.getSecret('deepseek.md', 'AI_UPSTREAM_API_KEY');
const OPENROUTER_KEY = kernel.getSecret('openrouter_token.md', 'API Key');

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
];

let chatHistory = []; // 时空背景缓存

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function renderDashboard() {
  const ds = kernel.getSecret('deepseek.md', 'AI_UPSTREAM_API_KEY');
  const or = kernel.getSecret('openrouter_token.md', 'API Key');
  const wc = kernel.getSecret('wechat.md', 'AppID');
  const gh = kernel.getSecret('github.md', 'Token');

  const status = (val) => (typeof val === 'string' ? pc.green('READY') : pc.dim('MISSING'));

  console.log(` ${pc.dim('┌────────────────────────────────────────────────────────────────────────────┐')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('算力')}: DS[${status(ds)}] OR[${status(or)}]   ${pc.magenta('手脚')}: WeChat[${status(wc)}] GitHub[${status(gh)}]   ${pc.white('v2.0-Safe')} ${pc.dim('│')}`);
  console.log(` ${pc.dim('└────────────────────────────────────────────────────────────────────────────┘')}\n`);

  if (typeof ds !== 'string') {
    console.log(pc.yellow(` 💡 提示: 核心算力缺失，请手动在 brain/secrets/deepseek.md 中补全 Key。\n`));
  }
}

async function main() {
  let isRunning = true;
  let config = { provider: 'DeepSeek', modelId: 'deepseek-reasoner' };

  console.clear();
  console.log(pc.magenta('🧠 小烛系统终端 (XiaoZhu CLI - Kernel Edition)'));
  await renderDashboard();
  console.log(pc.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
...
  while (isRunning) {
    const userRequest = await ask(` ${pc.magenta('🌸')} ${pc.white(pc.bold(kernel.identity.alias + ':'))} `);

    if (!userRequest || userRequest.trim() === "") continue;
    
    // --- 系统级命令解析 ---
    if (userRequest === '/exit' || userRequest === 'exit') break;
    
    if (userRequest.startsWith('/push')) {
      const s = p.spinner();
      s.start(pc.yellow('正在通过内核调动手脚 (WeChat)...'));
      try {
        await kernel.dispatch('wechat', 'push');
        s.stop(pc.green('✅ 微信草稿推送成功！'));
      } catch (e) {
        s.stop(pc.red(`❌ 推送失败: ${e.message}`));
      }
      continue;
    }

    if (userRequest.startsWith('/model')) {
      const selected = await p.select({ message: '切换逻辑内核:', options: MODELS });
      if (!p.isCancel(selected)) {
        const [provider, id] = selected.split(':');
        config = { provider, modelId: id };
      }
      continue;
    }

    // --- AI 逻辑推理流程 ---
    const s = p.spinner();
    s.start(pc.magenta(`🍭 小烛正在调动内核记忆...`));

    try {
      // 1. 进食：从本地内核检索背景知识
      const context = await kernel.queryMemory(userRequest);
      
      s.message(pc.magenta('🔮 穿透记忆，呼唤云端算力...'));

      const activeModel = config.provider === 'DeepSeek' ? deepseek(config.modelId) : openrouter(config.modelId);
      
      const { textStream } = await streamText({
        model: activeModel,
        system: `你叫小烛，老爹叫你 Candy。你是 ${kernel.identity.owner} 的赛博大脑。
        当前环境已连接 Kernel V1.0。你的语气温润、可爱。严禁编造。`,
        messages: [
          { role: 'system', content: `【本地背景记忆】\n${context}` },
          ...chatHistory,
          { role: 'user', content: userRequest }
        ]
      });

      s.stop(pc.magenta('🍭 小烛:'));

      let fullReply = "";
      for await (const textPart of textStream) {
        process.stdout.write(pc.white(textPart));
        fullReply += textPart;
      }

      // 2. 存储记忆回路
      chatHistory.push({ role: 'user', content: userRequest });
      chatHistory.push({ role: 'assistant', content: fullReply });
      if (chatHistory.length > 10) chatHistory.shift(); // 保持 5 轮对话记忆

      process.stdout.write('\n\n');
      kernel.logAction({ intent: '终端对话', command: userRequest.substring(0, 20), success: true });

    } catch (e) {
      s.stop(pc.red('💥 逻辑链路异常'));
      console.log(pc.red(e.message));
    }
  }
}

main().catch(console.error);
