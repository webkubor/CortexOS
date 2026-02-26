#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V3.1 - Hyper-Clear Purple)
 * 
 * 视觉进化：
 * 1. 深度学习 Gemini 字体结构：使用高清晰度的块状 ASCII Art。
 * 2. 极致紫调：采用单色渐变，主打清爽与耐看。
 * 3. 结构重组：确保在任何分辨率下字母都清晰可辨。
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { execSync } from 'child_process';
import os from 'os';

const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const UV_PATH = '/Users/webkubor/.local/bin/uv';

// 1. 像素级清晰的 CANDLE Logo (基于 Gemini 骨架)
const LOGO = `
  ${pc.magenta('████████   █████   ███   ████  ████████  ██        █████████')}
 ${pc.magenta('███░░░░███ ███░░███ ░███  ░░███░░███░░░███░███       ░███░░░░░█')}
 ${pc.magenta('███    ░░░░███ ░░███░████  ░███ ░███  ░░███░███       ░███  █ ░')}
 ${pc.magenta('███       ░█████████░███░██ ░███ ░███   ░███░███       ░██████  ')}
 ${pc.magenta('███       ░███░░░░░█░███░░██░███ ░███   ░███░███       ░███░░█  ')}
 ${pc.magenta('███    ███░███     █░███ ░░█████ ░███  ███  ░███      ░░███ ░   █')}
  ${pc.magenta('████████ ░███     █░███  ░░████ ████████   ██████████ ██████████')}
  ${pc.dim('░░░░░░░░  ░░░     ░ ░░░    ░░░ ░░░░░░░░    ░░░░░░░░░░ ░░░░░░░░░░')}
`;

async function main() {
  console.clear();
  
  // 打印超清紫 Logo
  console.log(`\n${LOGO}`);
  
  // 2. 极简身份行 (对齐 Gemini 风格)
  const username = os.userInfo().username;
  console.log(` ${pc.white('Authenticated as:')} ${pc.magenta(username)} ${pc.dim('/ cortex-v3')}`);
  console.log(` ${pc.white('Memory Engine   :')} ${pc.magenta('ChromaDB + Ollama (nomic-embed)')}\n`);

  p.intro(`${pc.bgMagenta(pc.black(' CANDLE '))}${pc.magenta(' ❯ ')}${pc.white('Neural Link Established')}`);

  const userRequest = await p.text({
    message: pc.white('老爹，请下达指令:'),
    placeholder: '输入你想检索或对话的内容...',
    validate(value) {
      if (value.length === 0) return '请给小烛一个思考的起点。';
    },
  });

  if (p.isCancel(userRequest)) {
    p.outro(pc.magenta('逻辑断开。下次见，老爹！👋'));
    process.exit(0);
  }

  const s = p.spinner();
  s.start(pc.magenta('🔮 正在穿透记忆维度...'));

  try {
    let context = "";
    try {
      context = execSync(`${UV_PATH} run ./scripts/ingest/query_brain.py "${userRequest}"`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
      });
    } catch (e) {
      s.message(pc.dim('ℹ️ 正在提取底层意识...'));
    }

    s.stop(pc.magenta('✨ 语义重组完成'));

    // 3. 极简流式对话
    process.stdout.write(`\n ${pc.magenta('󱐋')} ${pc.bold(pc.white('小烛汇报:'))}\n`);
    process.stdout.write(` ${pc.dim('————————————————————————————————————————————————————')}\n\n `);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "deepseek-r1:7b",
        prompt: `你叫小烛 (Candle)，是老爹 (webkubor) 的赛博管家。你的回答必须基于以下背景。
        
背景：
${context || '暂无相关背景'}

问题：
${userRequest}

小烛的回答：`,
        stream: true
      })
    });

    if (!response.ok) throw new Error(`神经连接异常`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      try {
        const json = JSON.parse(chunk);
        if (json.response) {
          process.stdout.write(pc.white(json.response));
        }
      } catch (e) {}
    }

    console.log(`\n\n ${pc.dim('————————————————————————————————————————————————————')}`);

  } catch (e) {
    s.stop(pc.red('💥 逻辑链路崩塌'));
    p.note(e.message, pc.magenta('核心溯源'));
  }

  p.outro(pc.dim('—— 始于逻辑，忠于纯粹。'));
}

main().catch(console.error);
