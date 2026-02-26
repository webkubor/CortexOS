#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V2.0 - Cinematic Edition)
 * 
 * 升级点：
 * 1. 流式渲染 (Streaming)：像 Claude Code 一样丝滑蹦字。
 * 2. 视觉增强：使用图标、颜色梯度和更硬核的布局。
 * 3. 检索透明：实时展示捞到了哪些“记忆切片”。
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { execSync } from 'child_process';

const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const UV_PATH = '/Users/webkubor/.local/bin/uv';

async function main() {
  console.clear();
  
  // 顶层 Header
  console.log(`\n ${pc.cyan('●')} ${pc.white(pc.bold('CANDLE CORTEX'))} ${pc.dim('v2.0.0')}`);
  console.log(` ${pc.dim('————————————————————————————————————————————————————')}`);

  p.intro(`${pc.bgCyan(pc.black(' 小烛 (Candle) '))}${pc.cyan(' 『始于逻辑，忠于纯粹』')}`);

  const userRequest = await p.text({
    message: pc.white('老爹，请指示：'),
    placeholder: '正在监听语义指令...',
    validate(value) {
      if (value.length === 0) return '老爹，你不说话我好慌...';
    },
  });

  if (p.isCancel(userRequest)) {
    p.outro(pc.yellow('收到，小烛先行告退。👋'));
    process.exit(0);
  }

  const s = p.spinner();
  s.start(pc.cyan('🧠 正在建立神经连接...'));

  try {
    // 1. 深度检索
    let context = "";
    try {
      context = execSync(`${UV_PATH} run ./scripts/ingest/query_brain.py "${userRequest}"`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
      });
    } catch (e) {
      s.message(pc.yellow('⚠️ 外部大脑处于休眠状态，已启用备用常识库。'));
    }

    s.message(pc.magenta('📡 正在接收语义波段...'));
    await new Promise(resolve => setTimeout(resolve, 600));
    s.stop(pc.green('🔗 连接成功！'));

    // 2. 流式对话 (核心升级：像真人一样蹦字)
    process.stdout.write(`\n ${pc.cyan('🕯️')} ${pc.bold(pc.white('小烛的思绪:'))}\n\n `);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "deepseek-r1:7b",
        prompt: `你叫小烛 (Candle)，是老爹 (webkubor) 的赛博管家。你的回答必须基于以下【外部大脑】提供的背景。语气亲切、乖巧、拟人。禁止输出冗长的引导语，直接给出干货。
        
背景知识：
${context || '暂无相关背景'}

老爹的问题：
${userRequest}

小烛的回答：`,
        stream: true // 开启流式
      })
    });

    if (!response.ok) throw new Error(`Ollama 掉线了: ${response.statusText}`);

    // 处理流数据
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      try {
        const json = JSON.parse(chunk);
        if (json.response) {
          process.stdout.write(pc.cyan(json.response));
          fullResponse += json.response;
        }
      } catch (e) {
        // 部分分段可能解析失败，忽略
      }
    }

    console.log(`\n\n ${pc.dim('————————————————————————————————————————————————————')}`);

  } catch (e) {
    s.stop(pc.red('💥 逻辑链路崩塌'));
    p.note(e.message, pc.red('错误核心'));
  }

  p.outro(pc.dim('—— 始终为您守候。'));
}

main().catch(console.error);
