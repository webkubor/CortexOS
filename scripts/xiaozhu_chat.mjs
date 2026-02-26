#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V5.0 - Gemini Industrial Style)
 * 
 * 视觉进化：
 * 1. 深度复刻 Gemini CLI 的“厚块边框”输入区（▀ / ▄）。
 * 2. 移除冗余的 [Enter] 等待，实现流畅的 REPL 体验。
 * 3. 强化诚实人格：严禁幻觉，不懂就认。
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { ChromaClient } from 'chromadb';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, embed } from 'ai';

const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const CHROMA_DATA_PATH = path.join(PROJECT_ROOT, 'chroma_db');
const COLLECTION_NAME = 'ai_common_docs';
const CONFIG_PATH = path.join(PROJECT_ROOT, '.xz_config.json');

// --- 1. 配置 Providers ---
const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });
const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-f5854fdec394448287ed5cf0d615d4f5',
});
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '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',
});

const MODELS = [
  { value: 'deepseek/deepseek-reasoner', label: '🔥 DeepSeek-R1 (官方API)', hint: '逻辑之巅', provider: 'DeepSeek', id: 'deepseek-reasoner' },
  { value: 'anthropic/claude-3.5-sonnet', label: '🎨 Claude 3.5 Sonnet', hint: '代码&创意', provider: 'OpenRouter', id: 'anthropic/claude-3.5-sonnet' },
  { value: 'google/gemini-flash-1.5', label: '⚡ Gemini 1.5 Flash', hint: '极速&长文', provider: 'OpenRouter', id: 'google/gemini-flash-1.5' },
  { value: 'openai/gpt-4o-mini', label: '💎 GPT-4o Mini', hint: '极致性价比', provider: 'OpenRouter', id: 'openai/gpt-4o-mini' },
  { value: 'deepseek/deepseek-chat', label: '💼 DeepSeek-V3', hint: '全能日常', provider: 'DeepSeek', id: 'deepseek-chat' },
];

const LOGO = `
  ${pc.magenta(' ██████')}   ${pc.magenta('█████')}   ${pc.magenta('███')}   ${pc.magenta('██')}  ${pc.magenta('██████')}   ${pc.magenta('██')}   ${pc.magenta('██')}
 ${pc.magenta('███  ░░')}  ${pc.magenta('███ ░░█')}  ${pc.magenta('░████ ░██')}  ${pc.magenta('░██  ░██')}  ${pc.magenta('░░██ ██')}
 ${pc.magenta('███')}      ${pc.magenta('███████')}  ${pc.magenta('░██░██░██')}  ${pc.magenta('░██   ██')}   ${pc.magenta('░░███')}
 ${pc.magenta('███  ██')}  ${pc.magenta('███ ░░█')}  ${pc.magenta('░██ ░████')}  ${pc.magenta('░██  ██')}     ${pc.magenta('░██')}
 ${pc.magenta(' ░██████')}  ${pc.magenta('███  ░█')}  ${pc.magenta('░██  ░░██')}  ${pc.magenta('██████')}      ${pc.magenta('██')}
`;

function getDashLine() {
  return pc.dim('━'.repeat(process.stdout.columns || 80));
}

function renderDashboard(config) {
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
  const usedMem = (totalMem - freeMem).toFixed(1);
  const platform = os.platform() === 'darwin' ? 'macOS' : os.platform();
  
  console.log(` ${pc.magenta('⚡ 运行中')} : ${pc.green('ONLINE')}   ${pc.magenta('🧠 记忆')} : ${pc.white('ChromaDB')}   ${pc.magenta('🔥 模型')} : ${pc.white(config.modelId.split('/').pop())}`);
  console.log(` ${pc.magenta('💻 系统')}   : ${pc.white(platform)}   ${pc.magenta('💾 内存')} : ${pc.white(usedMem + '/' + totalMem + 'G')}   ${pc.magenta('✨ 核心')} : ${pc.white('Candy v5.0')}`);
  console.log(getDashLine());
}

async function main() {
  let isRunning = true;
  let config = { provider: 'DeepSeek', modelId: 'deepseek-reasoner' };

  if (fs.existsSync(CONFIG_PATH)) {
    try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); } catch (e) {}
  }

  while (isRunning) {
    console.clear();
    console.log(LOGO);
    renderDashboard(config);
    
    // --- Gemini 风格输入区 ---
    console.log(pc.magenta('▀'.repeat(process.stdout.columns || 80)));
    const userRequest = await p.text({
      message: pc.white(' ❯ 指令 (Message):'),
      placeholder: '在这里输入聊天内容，或输入 /model, /sync, /exit...',
    });
    console.log(pc.magenta('▄'.repeat(process.stdout.columns || 80)));

    if (p.isCancel(userRequest) || userRequest === '/exit') {
      p.outro(pc.magenta('意识流切断。老爹好梦！👋'));
      isRunning = false;
      break;
    }

    if (!userRequest || userRequest.trim() === "") continue;

    // 命令处理
    if (userRequest.startsWith('/')) {
      const cmd = userRequest.slice(1).toLowerCase();
      if (cmd === 'model') {
        const selected = await p.select({ message: '老爹，请挑选你要注入的模型灵魂:', options: MODELS });
        if (!p.isCancel(selected)) {
          const choice = MODELS.find(m => m.value === selected);
          config = { provider: choice.provider, modelId: choice.id };
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        }
        continue;
      }
      if (cmd === 'sync') {
        const s = p.spinner();
        s.start('🏗️  正在全量同步外部大脑神经元...');
        try { execSync('node scripts/auto-pilot.js', { cwd: PROJECT_ROOT }); s.stop('✅ 同步完成！'); } catch (e) { s.stop('同步失败'); }
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }

    const s = p.spinner();
    s.start(pc.magenta('🔮 正在穿透记忆维度...'));

    try {
      let context = "暂无背景";
      try {
        const { embedding } = await embed({
          model: ollama.textEmbeddingModel('nomic-embed-text'),
          value: userRequest,
        });
        const client = new ChromaClient({ path: CHROMA_DATA_PATH });
        const collection = await client.getCollection({ name: COLLECTION_NAME });
        const results = await collection.query({ queryEmbeddings: [embedding], nResults: 3 });
        context = results.documents[0].join('\n---\n') || "暂无背景";
      } catch (e) {}

      s.stop(pc.magenta('✨ 语义重组完成！'));

      // --- 输出区 ---
      process.stdout.write(`\n ${pc.magenta('󱐋')} ${pc.bold(pc.white('Candy 的汇报:'))}\n`);
      console.log(getDashLine());

      const activeModel = config.provider === 'DeepSeek' ? deepseek(config.modelId) : openrouter(config.modelId);
      
      const { textStream } = await streamText({
        model: activeModel,
        system: `你叫小烛 (Candle)，老爹 (webkubor) 亲昵地叫你 Candy。你是老爹的全栈 AI 赛博管家。
【核心物理状态】逻辑引擎是 ${config.modelId}。
【诚实准则】你必须诚实，不懂就报，严禁编造或瞎猜。如果老爹问你是谁、是什么模型，请直接根据物理状态回答。
【语气】亲切、温润、可爱。`,
        prompt: `【背景知识】\n${context}\n\n【老爹的问题】\n${userRequest}\n\nCandy 的汇报：`,
      });

      for await (const textPart of textStream) {
        process.stdout.write(pc.white(textPart));
      }

      process.stdout.write('\n' + getDashLine() + '\n');
      
      // 直接等待下一次输入，不再需要敲 Enter 才能继续
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (e) {
      s.stop(pc.red('💥 逻辑链路异常'));
      p.note(e.message, pc.magenta('异常追溯'));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

main().catch(console.error);
