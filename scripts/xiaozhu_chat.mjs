#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V4.2 - Flexible AI Edition)
 * 
 * 架构：
 * 1. 本地引擎 (Ollama): 负责 Embedding (nomic-embed-text)。
 * 2. 云端引擎 (API): 负责 LLM 对话 (DeepSeek-R1 / GLM)。
 * 3. 灵活切换：通过统一协议，一键切换后端模型。
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import os from 'os';
import path from 'path';
import { ChromaClient } from 'chromadb';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, embed } from 'ai';

const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const CHROMA_DATA_PATH = path.join(PROJECT_ROOT, 'chroma_db');
const COLLECTION_NAME = 'ai_common_docs';

// --- 1. 配置 Provider ---

// 本地 Ollama (仅用于向量)
const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });

// 灵活的云端 LLM Provider (使用 OpenAI 协议兼容 DeepSeek / GLM)
const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-f5854fdec394448287ed5cf0d615d4f5',
});

// 如果你想换成 GLM，只需取消下面注释并修改 key
// const zhipu = createOpenAI({
//   baseURL: 'https://open.bigmodel.cn/api/paas/v4',
//   apiKey: 'YOUR_ZHIPU_API_KEY',
// });

// 当前生效的模型
const ACTIVE_MODEL = deepseek('deepseek-reasoner'); // R1 对应的是 deepseek-reasoner

// --- UI 部分 ---
const LOGO = `
  ${pc.magenta(' ██████')}   ${pc.magenta('█████')}   ${pc.magenta('███')}   ${pc.magenta('██')}  ${pc.magenta('██████')}   ${pc.magenta('██')}   ${pc.magenta('██')}
 ${pc.magenta('███  ░░')}  ${pc.magenta('███ ░░█')}  ${pc.magenta('░████ ░██')}  ${pc.magenta('░██  ░██')}  ${pc.magenta('░░██ ██')}
 ${pc.magenta('███')}      ${pc.magenta('███████')}  ${pc.magenta('░██░██░██')}  ${pc.magenta('░██   ██')}   ${pc.magenta('░░███')}
 ${pc.magenta('███  ██')}  ${pc.magenta('███ ░░█')}  ${pc.magenta('░██ ░████')}  ${pc.magenta('░██  ██')}     ${pc.magenta('░██')}
 ${pc.magenta(' ░██████')}  ${pc.magenta('███  ░█')}  ${pc.magenta('░██  ░░██')}  ${pc.magenta('██████')}      ${pc.magenta('██')}
`;

async function main() {
  console.clear();
  console.log(LOGO);
  
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
  const usedMem = (totalMem - freeMem).toFixed(1);
  const platform = os.platform() === 'darwin' ? 'macOS' : os.platform();
  
  console.log(` ${pc.dim('┌────────────────────────────────────────────────────────────────────────────┐')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('⚡ 运行状态')}: ${pc.green('在线')}        ${pc.dim('│')}  ${pc.magenta('🧠 记忆中枢')}: ${pc.white('ChromaDB')}    ${pc.dim('│')}  ${pc.magenta('✨ 核心版本')}: ${pc.white('v4.2')}      ${pc.dim('│')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('💻 系统架构')}: ${pc.white(platform + '/Arm64')}  ${pc.dim('│')}  ${pc.magenta('💾 内存实况')}: ${pc.white(usedMem + '/' + totalMem + 'G')}   ${pc.dim('│')}  ${pc.magenta('🔥 逻辑引擎')}: ${pc.white('DeepSeek-R1')} ${pc.dim('│')}`);
  console.log(` ${pc.dim('└────────────────────────────────────────────────────────────────────────────┘')}\n`);

  p.intro(`${pc.bgMagenta(pc.black(' CANDY '))}${pc.magenta(' ❯ ')}${pc.white('小烛已经准备好为老爹服务啦！')}`);

  const userRequest = await p.text({
    message: pc.white('老爹老爹，今天想让小烛做什么呀？✨'),
    placeholder: '小烛正在竖起耳朵听哦...',
    validate(value) {
      if (value.length === 0) return '哎呀老爹，你还没说话呢，小烛不知道该想什么了~';
    },
  });

  if (p.isCancel(userRequest)) {
    p.outro(pc.magenta('呜呜，下次见，老爹！👋'));
    process.exit(0);
  }

  const s = p.spinner();
  s.start(pc.magenta('🔮 正在穿透记忆维度...'));

  try {
    // 1. 本地生成向量
    const { embedding } = await embed({
      model: ollama.textEmbeddingModel('nomic-embed-text'),
      value: userRequest,
    });

    // 2. 查询向量库
    const client = new ChromaClient({ path: CHROMA_DATA_PATH });
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    const results = await collection.query({ queryEmbeddings: [embedding], nResults: 3 });
    const context = results.documents[0].join('\n---\n');

    s.stop(pc.magenta('✨ 语义重组完成！老爹请看：'));

    // 3. 云端流式对话
    process.stdout.write(`\n ${pc.magenta('🕯️')} ${pc.bold(pc.white('Candy 的汇报:'))}\n`);
    process.stdout.write(` ${pc.dim('————————————————————————————————————————————————————————————————————————————')}\n\n `);

    const { textStream } = await streamText({
      model: ACTIVE_MODEL,
      prompt: `你叫小烛 (Candle)，老爹喜欢叫你 Candy。你是老爹 (webkubor) 的赛博管家。
      你的回答必须基于以下背景。语气要温润、亲切、可爱。禁止废话。
      
背景知识：
${context}

老爹的问题：
${userRequest}

Candy 的回答：`,
    });

    for await (const textPart of textStream) {
      process.stdout.write(pc.white(textPart));
    }

    console.log(`\n\n ${pc.dim('————————————————————————————————————————————————————————————————————————————')}`);

  } catch (e) {
    s.stop(pc.red('💥 逻辑链路异常'));
    p.note(e.message, pc.magenta('异常追溯'));
  }

  p.outro(pc.dim('—— 始于逻辑，忠于纯粹。小烛始终守护老爹。'));
}

main().catch(console.error);
