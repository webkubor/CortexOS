#!/usr/bin/env node

/**
 * 大脑自动运转系统 - Node.js 原生版本
 *
 * 不需要任何外部依赖，直接启动即可
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  autoPilotScript: path.join(__dirname, 'auto-pilot-native.js'),
  autoPilotLog: path.join(__dirname, '../logs/auto-pilot.log'),
  autoStart: true
};

// 日志目录
const LOG_DIR = path.dirname(CONFIG.autoPilotLog);

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 启动自动运转系统
function startAutoPilot() {
  console.log('🚀 启动大脑自动运转系统...\n');

  const autopilot = spawn('node', [CONFIG.autoPilotScript], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // 重定向输出到日志文件
  autopilot.stdout.pipe(fs.createWriteStream(CONFIG.autoPilotLog, { flags: 'a' }));
  autopilot.stderr.pipe(fs.createWriteStream(CONFIG.autoPilotLog, { flags: 'a' }));

  // 让进程独立运行
  autopilot.unref();

  console.log('✅ 大脑自动运转系统已启动');
  console.log(`📋 日志文件: ${CONFIG.autoPilotLog}`);
  console.log('💡 按 Ctrl+C 不会停止后台进程\n');
}

// 查看运行状态
function checkStatus() {
  const logs = fs.readFileSync(CONFIG.autoPilotLog, 'utf-8');
  const lines = logs.trim().split('\n');
  const recent = lines.slice(-10).join('\n');

  console.log('📊 最近运行记录:');
  console.log(recent || '暂无记录\n');
}

// 停止自动运转
function stopAutoPilot() {
  // 终止所有 node 脚本进程
  const exec = require('child_process').execSync;

  try {
    exec('pkill -f "node.*auto-pilot"');
    console.log('✅ 已停止自动运转系统\n');
  } catch (error) {
    console.log('⚠️ 未找到运行中的进程\n');
  }
}

// 显示菜单
function showMenu() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧠 AI Common 大脑自动运转管理');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n1. 启动自动运转系统');
  console.log('2. 查看运行状态');
  console.log('3. 停止自动运转系统');
  console.log('4. 查看日志');
  console.log('5. 退出\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 主程序
function main() {
  // 检查参数
  const args = process.argv.slice(2);

  if (args.includes('--stop')) {
    stopAutoPilot();
    return;
  }

  if (args.includes('--status')) {
    checkStatus();
    return;
  }

  if (args.includes('--start')) {
    startAutoPilot();
    return;
  }

  // 如果没有参数，显示菜单
  showMenu();

  // 交互式启动
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('请选择操作 (1-5): ', (answer) => {
    switch (answer.trim()) {
      case '1':
        startAutoPilot();
        break;
      case '2':
        checkStatus();
        break;
      case '3':
        stopAutoPilot();
        break;
      case '4':
        if (fs.existsSync(CONFIG.autoPilotLog)) {
          const logs = fs.readFileSync(CONFIG.autoPilotLog, 'utf-8');
          console.log(logs);
        } else {
          console.log('⚠️ 暂无日志\n');
        }
        break;
      case '5':
        console.log('👋 再见！\n');
        process.exit(0);
      default:
        console.log('❌ 无效选项\n');
    }
    readline.close();
  });
}

main();