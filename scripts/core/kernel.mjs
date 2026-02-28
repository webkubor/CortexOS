#!/usr/bin/env node

/**
 * 🧠 AI Common Kernel (大脑内核 V2.0 - Framework Edition)
 * 核心约束：Zod (协议校验) + Commander (命令路由)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { z } from 'zod';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../');

// --- 1. 定义数据协议 (Brain Schemas) ---
const ActionSchema = z.object({
  name: z.string(),
  description: z.string(),
  handler: z.function(),
  params: z.any().optional()
});

const SecretSchema = z.string().min(5, { message: "凭证长度异常" });

class BrainKernel {
  constructor() {
    this.root = PROJECT_ROOT;
    this.program = new Command();
    this.actions = new Map();
    
    this.config = {
      docsDir: path.join(PROJECT_ROOT, 'docs'),
      secretsDir: path.join(PROJECT_ROOT, 'brain/secrets'),
      logsDir: path.join(PROJECT_ROOT, 'docs/memory/logs'),
    };

    this.setupCLI();
  }

  // --- 2. 增强型凭证解析 (带容错与 Zod 校验) ---
  getSecret(fileName, keyName) {
    const fullPath = path.join(this.config.secretsDir, fileName);
    if (!fs.existsSync(fullPath)) {
      return { __status: 'MISSING', message: `需手动重建: brain/secrets/${fileName}` };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const regex = new RegExp(`(?:\\*\\*)?${keyName}(?:\\*\\*)?[\\s=:]+(["'\`]?)([^"'\n\r\\s\`]+)\\1`, 'i');
      const match = content.match(regex);
      
      let rawKey = match ? match[2] : (content.match(/(sk-[a-zA-Z0-9-]{20,})/)?.[1] || null);
      
      if (!rawKey) return { __status: 'EMPTY', message: `字段 ${keyName} 为空` };

      // 使用 Zod 强制约束 Key 的基本形态
      return SecretSchema.parse(rawKey);
    } catch (e) { 
      return { __status: 'ERROR', message: e.message };
    }
  }

  // --- 3. 插件化动作注册 (Dependency Injection) ---
  registerAction(actionDef) {
    try {
      const validated = ActionSchema.parse(actionDef);
      this.actions.set(validated.name, validated);
      
      // 同步注册到 CLI 命令树
      this.program
        .command(validated.name)
        .description(validated.description)
        .action(async (opts) => {
          await validated.handler(opts);
        });
    } catch (e) {
      console.error(`❌ Action 注册失败: ${e.message}`);
    }
  }

  // --- 4. 统一日志与执行跟踪 ---
  async execute(actionName, params = {}) {
    const action = this.actions.get(actionName);
    if (!action) throw new Error(`未定义的动作: ${actionName}`);

    console.log(`⚡  核心调度: ${action.description}...`);
    try {
      const result = await action.handler(params);
      this.logAction({ intent: actionName, success: true });
      return result;
    } catch (e) {
      this.logAction({ intent: actionName, success: false, command: e.message });
      throw e;
    }
  }

  logAction({ intent, success, command = 'internal' }) {
    const logPath = path.join(this.config.logsDir, `raw/kernel-${new Date().toISOString().split('T')[0]}.md`);
    if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const entry = `\n- [${new Date().toLocaleTimeString()}] **${intent}**: ${success ? '✅' : '❌'} (${command})`;
    fs.appendFileSync(logPath, entry);
  }

  setupCLI() {
    this.program
      .name('xiaozhu')
      .description('AI Common 大脑核心控制台')
      .version('2.0.0');
  }

  async runCLI() {
    this.program.parse(process.argv);
  }
}

export const kernel = new BrainKernel();
export default kernel;
