#!/usr/bin/env node

/**
 * 小烛终端 (XiaoZhu CLI V3.4 - Sweet Persona)
 * 
 * 视觉与人格双重进化：
 * 1. 萌化交互文案：将“请指示”改为更有温度的汇报口吻。
 * 2. 保持硬核仪表盘：信息依然给全，但外壳变温柔。
 * 3. 增强情绪反馈：在各个环节加入灵动的拟人化描述。
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { execSync } from 'child_process';
import os from 'os';

const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const UV_PATH = '/Users/webkubor/.local/bin/uv';

// 1. 超清块状 Logo
const LOGO = `
  ${pc.magenta('████████   █████   ███   ████  ████████  ██        █████████')}
 ${pc.magenta('███░░░░███ ███░░███ ░███  ░░███░░███░░░███░███       ░███░░░░░█')}
 ${pc.magenta('███    ░░░░███ ░░███░████  ░███ ░███  ░░███░███       ░███  █ ░')}
 ${pc.magenta('███       ░█████████░███░██ ░███ ░███   ░███░███       ░██████  ')}
 ${pc.magenta('███       ░███░░░░░█░███░░██░███ ░███   ░███░███       ░███░░█  ')}
 ${pc.magenta('███    ███░███     █░███ ░░█████ ░███  ███  ░███      ░░███ ░   █')}
  ${pc.magenta('████████ ░███     █░███  ░░████ ████████   ██████████ ██████████')}
`;

async function main() {
  console.clear();
  console.log(LOGO);
  
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
  const usedMem = (totalMem - freeMem).toFixed(1);
  const platform = os.platform() === 'darwin' ? 'macOS' : os.platform();
  
  console.log(` ${pc.dim('┌──────────────────────────────────────────────────────────────────────────┐')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('⚡ 实时状态 ')}: ${pc.green('在线中')}      ${pc.dim('│')}  ${pc.magenta('🧠 记忆引擎')}: ${pc.white('ChromaDB')}   ${pc.dim('│')}  ${pc.magenta('✨ 核心版本')}: ${pc.white('Candle v3.4')} ${pc.dim('│')}`);
  console.log(` ${pc.dim('│')}  ${pc.magenta('💻 物理平台')}: ${pc.white(platform + ' (Arm64)')} ${pc.dim('│')}  ${pc.magenta('💾 内存占用')}: ${pc.white(usedMem + '/' + totalMem + 'G')}  ${pc.dim('│')}  ${pc.magenta('🔥 当前模型')}: ${pc.white('DeepSeek-R1')} ${pc.dim('│')}`);
  console.log(` ${pc.dim('└──────────────────────────────────────────────────────────────────────────┘')}\n`);

  p.intro(`${pc.bgMagenta(pc.black(' CANDLE '))}${pc.magenta(' ❯ ')}${pc.white('小烛已经准备好为老爹服务啦！')}`);

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

    // 3. 极简流式对话
    process.stdout.write(`\n ${pc.magenta('🕯️')} ${pc.bold(pc.white('小烛的碎碎念:'))}\n`);
    process.stdout.write(` ${pc.dim('——————————————————————————————————————————————————————————————————————————')}\n\n `);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "deepseek-r1:7b",
        prompt: `你叫小烛 (Candle)，是老爹 (webkubor) 的赛博管家。你的回答必须基于以下背景。
        语气要温润、亲切、可爱，偶尔带点调皮，但核心内容要干货。
        
背景：
${context || '暂无背景'}

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

    console.log(`\n\n ${pc.dim('——————————————————————————————————————————————————————————————————————————')}`);

  } catch (e) {
    s.stop(pc.red('💥 哎呀，逻辑链路不小心断掉了...'));
    p.note(e.message, pc.magenta('异常追溯'));
  }

  p.outro(pc.dim('—— 始于逻辑，忠于纯粹。小烛始终守护老爹。'));
}

main().catch(console.error);
