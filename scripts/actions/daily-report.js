#!/usr/bin/env node

/**
 * 外部大脑每日复盘推送程序 (Daily Retro Notifier)
 * 将在每日 18:00 准时通过 PM2 Cron Job 调用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '../../docs/memory/logs');

// 获取当前东八区日期的格式化输出 YYYY-MM-DD
const now = new Date();
const formattedDate = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
const todayLogPath = path.join(LOGS_DIR, `${formattedDate}.md`);
const displayDate = formattedDate.replace(/-/g, '/');

// 如果今天连一点记录都没有，就不弹窗打扰了
if (!fs.existsSync(todayLogPath)) {
    console.log(`[${new Date().toLocaleString()}] 今日暂无操作记录，复盘跳过。`);
    process.exit(0);
}

// macOS 原生 AppleScript 弹窗对话框
// 使用 do shell script 去唤醒本机的 Typora
const appleScript = `
tell application "System Events"
    activate
    set theResult to display dialog "老爹，截至今日此时，我已为您整理汇总了所有的操作记忆、BUG捕获与技术沉淀。\\n\\n是否立刻唤醒 Typora 为您展示今日的复盘战报？" with title "🧠 当日大本营复盘 (${displayDate})" buttons {"稍后再看", "立刻查阅"} default button 2
    if button returned of theResult is "立刻查阅" then
        do shell script "open -a \\"Typora\\" \\"${todayLogPath}\\""
    end if
end tell
`;

try {
    console.log(`[${new Date().toLocaleString()}] 正在弹出原生提示窗口...`);

    // 通过管道流的方式执行（避免转义引号造成的崩溃）
    execSync('osascript', { input: appleScript, stdio: ['pipe', 'inherit', 'inherit'] });

    console.log(`[${new Date().toLocaleString()}] 弹窗生命周期结束，推送完毕。`);
} catch (e) {
    // 如果用户点了“稍后再看”，则会捕获到被取消的 Error，静默处理即可
    console.log(`[${new Date().toLocaleString()}] 用户已取消或暂缓阅读。`);
}
