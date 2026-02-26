#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V3.7 - Candy Persona)
 * 
 * 视觉进化：
 * 1. 采用更拟人化的英文名：CANDY (小烛的萌化版)。
 * 2. 超清块状 Logo：确保字母轮廓锐利，绝不乱码。
 * 3. 极致汉化参数：仪表盘全中文，硬核数据一览无余。
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { execSync } from 'child_process';
import os from 'os';

const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const UV_PATH = '/Users/webkubor/.local/bin/uv';

// 1. 超清晰的 CANDY Logo (工业块状字体)
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
  
  // 深度系统参数提取
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
  const usedMem = (totalMem - freeMem).toFixed(1);
  const platform = os.platform() === 'darwin' ? 'macOS' : os.platform();
  
  // 打印全汉化精致仪表盘
  console.log(` ${pc.dim('┌────────────────────────────────────────────────────────────────────────────┐')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('⚡ 运行状态')}: ${pc.green('在线')}        ${pc.dim('│')}  ${pc.magenta('🧠 记忆中枢')}: ${pc.white('ChromaDB')}    ${pc.dim('│')}  ${pc.magenta('✨ 核心版本')}: ${pc.white('v3.7')}      ${pc.dim('│')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('💻 系统架构')}: ${pc.white(platform + '/Arm64')}  ${pc.dim('│')}  ${pc.magenta('💾 内存实况')}: ${pc.white(usedMem + '/' + totalMem + 'G')}   ${pc.dim('│')}  ${pc.magenta('🔥 对话模型')}: ${pc.white('DeepSeek-R1')} ${pc.dim('│')}`);
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
    p.outro(pc.magenta('呜呜，老爹要休息了吗？那小烛先退下了，回见！👋'));
    process.exit(0);
  }

  const s = p.spinner();
  s.start(pc.magenta('🔮 正在穿透记忆维度，寻找老爹想要的答案...'));

  try {
    let context = "";
    try {
      context = execSync(`${UV_PATH} run ./scripts/ingest/query_brain.py "${userRequest}"`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
      });
    } catch (e) {}

    s.stop(pc.magenta('✨ 语义重组完成！老爹请看：'));

    // 极简流式对话
    process.stdout.write(`\n ${pc.magenta('󱐋')} ${pc.bold(pc.white('小烛的碎碎念:'))}\n`);
    process.stdout.write(` ${pc.dim('————————————————————————————————————————————————————————————————────────────')}\n\n `);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "deepseek-r1:7b",
        prompt: `你叫小烛 (Candle)，老爹喜欢叫你 Candy。你是老爹 (webkubor) 的赛博管家。
        你的回答必须基于以下背景。语气要温润、亲切、可爱，偶尔带点调皮，但核心内容要干货。
        
背景：
${context || '暂无背景'}

老爹的问题：
${userRequest}

Candy 的回答：`,
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

    console.log(`\n\n ${pc.dim('————————————————────────────────────────────────────────────────────────────')}`);

  } catch (e) {
    s.stop(pc.red('💥 哎呀，逻辑链路不小心断掉了...'));
    p.note(e.message, pc.magenta('异常追溯'));
  }

  p.outro(pc.dim('—— 始于逻辑，忠于纯粹。小烛始终守护老爹。'));
}

main().catch(console.error);
