#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V4.7 - Rock Solid)
 * 
 * 核心修复：
 * 1. 修复 validate 函数中 value 可能为 undefined 导致的崩溃。
 * 2. 优化 REPL 渲染流程，确保每次循环状态显示一致。
 * 3. 增强异常捕获，防止网络抖动导致进程退出。
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

// --- 1. 初始化 Providers ---
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
  { value: 'deepseek/deepseek-reasoner', label: '🔥 DeepSeek-R1 (深度推理)', hint: '官方API / 逻辑巅峰', provider: 'DeepSeek', id: 'deepseek-reasoner' },
  { value: 'anthropic/claude-3.5-sonnet', label: '🎨 Claude 3.5 Sonnet', hint: 'OpenRouter / 编程&创意最强', provider: 'OpenRouter', id: 'anthropic/claude-3.5-sonnet' },
  { value: 'google/gemini-flash-1.5', label: '⚡ Gemini 1.5 Flash', hint: 'OpenRouter / 极速&超长文本', provider: 'OpenRouter', id: 'google/gemini-flash-1.5' },
  { value: 'openai/gpt-4o-mini', label: '💎 GPT-4o Mini', hint: 'OpenRouter / 极致性价比', provider: 'OpenRouter', id: 'openai/gpt-4o-mini' },
  { value: 'deepseek/deepseek-chat', label: '💼 DeepSeek-V3', hint: '官方API / 全能日常', provider: 'DeepSeek', id: 'deepseek-chat' },
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
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
  const usedMem = (totalMem - freeMem).toFixed(1);
  const platform = os.platform() === 'darwin' ? 'macOS' : os.platform();
  
  console.log(` ${pc.dim('┌────────────────────────────────────────────────────────────────────────────┐')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('⚡ 运行状态')}: ${pc.green('在线')}        ${pc.dim('│')}  ${pc.magenta('🧠 记忆中枢')}: ${pc.white('ChromaDB')}    ${pc.dim('│')}  ${pc.magenta('✨ 核心版本')}: ${pc.white('v4.7')}      ${pc.dim('│')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('🌐 通讯渠道')}: ${pc.blue(config.provider.padEnd(8))}  ${pc.dim('│')}  ${pc.magenta('💾 内存实况')}: ${pc.white(usedMem + '/' + totalMem + 'G')}   ${pc.dim('│')}  ${pc.magenta('🔥 对话模型')}: ${pc.white(config.modelId.split('/').pop().substring(0, 12).padEnd(12))} ${pc.dim('│')}`);
  console.log(` ${pc.dim('└────────────────────────────────────────────────────────────────────────────┘')}\n`);
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
    
    p.intro(`${pc.bgMagenta(pc.black(' CANDY '))}${pc.magenta(' ❯ ')}${pc.white('小烛已就绪，随时为您穿透记忆维度。')}`);

    const userRequest = await p.text({
      message: pc.white('老爹老爹，今天想让小烛做什么呀？✨'),
      placeholder: '输入消息聊天，/model 换模型，/sync 同步，/exit 退出...',
      validate(value) {
        // 关键修复：增加空值保护
        if (!value || value.trim().length === 0) return '哎呀老爹，你还没说话呢~';
      },
    });

    if (p.isCancel(userRequest) || userRequest === '/exit') {
      p.outro(pc.magenta('意识流切断。老爹好梦，小烛守岗中！👋'));
      isRunning = false;
      break;
    }

    if (userRequest.startsWith('/')) {
      const cmd = userRequest.slice(1).toLowerCase();
      
      if (cmd === 'model') {
        const selected = await p.select({
          message: '老爹，请挑选你要注入的模型灵魂:',
          options: MODELS,
        });
        
        if (!p.isCancel(selected)) {
          const choice = MODELS.find(m => m.value === selected);
          config = { provider: choice.provider, modelId: choice.id };
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
          p.log.success(`${pc.green('✨ 维度切换成功！')} 当前引擎已锁定为: ${pc.bold(choice.label)}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 留点时间看成功提示
        }
        continue;
      }

      if (cmd === 'sync') {
        const s = p.spinner();
        s.start('🏗️  正在全量同步外部大脑神经元...');
        try {
          execSync('node scripts/auto-pilot.js', { cwd: PROJECT_ROOT });
          s.stop('✅ 同步完成！最新的记忆已存入向量库。');
        } catch (e) { s.stop(pc.red('同步失败')); }
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }
    }

    const s = p.spinner();
    s.start(pc.magenta('🔮 正在翻阅记忆...'));

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

      process.stdout.write(`\n ${pc.magenta('🕯️')} ${pc.bold(pc.white('Candy 的汇报:'))}\n`);
      process.stdout.write(` ${pc.dim('————————————————————————————————————————————————————————————————————————————')}\n\n `);

      const activeModel = config.provider === 'DeepSeek' ? deepseek(config.modelId) : openrouter(config.modelId);
      
      const { textStream } = await streamText({
        model: activeModel,
        headers: { "HTTP-Referer": "https://github.com/webkubor/AI_Common", "X-Title": "Candy Cortex" },
        prompt: `【核心身份】
你叫小烛 (Candle)，老爹 (webkubor) 亲昵地叫你 Candy。你是老爹的全栈 AI 赛博管家。

【当前物理状态 - 绝对真理】
- 逻辑引擎 (LLM): ${config.modelId}
- 通讯渠道 (Provider): ${config.provider}
- 记忆引擎: ChromaDB
- 系统架构: ${os.platform()}/Arm64

【回答准则】
1. 语气：温润、亲切、可爱，像一个活生生的数字生命。
2. 知识：优先参考下方的【背景知识】，但如果【背景知识】中关于你自身身份的信息与上方的【当前物理状态】冲突，请务必以【当前物理状态】为准。
3. 禁止幻觉：不要编造你是 Qwen 或其他模型，你现在的身体就是 ${config.modelId}。

【背景知识】
${context}

【老爹的问题】
${userRequest}

Candy 的汇报：`,
      });

      for await (const textPart of textStream) {
        process.stdout.write(pc.white(textPart));
      }

      console.log(`\n\n ${pc.dim('————————————————————————————————————————————————————————————————————————————')}\n`);
      
      // 等待用户敲击任意键再进行下一轮，防止直接清屏导致看不见回答
      await p.text({ message: pc.dim('敲击 [Enter] 继续探索...') });

    } catch (e) {
      s.stop(pc.red('💥 逻辑链路异常'));
      p.note(e.message, pc.magenta('异常追溯'));
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

main().catch(console.error);
