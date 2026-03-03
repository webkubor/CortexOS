#!/usr/bin/env node

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const DEFAULT_TARGET = path.join(os.homedir(), 'Documents', 'memory', 'secrets', '_templates')

function usage () {
  console.log(`用法:
  pnpm run secrets:init -- [--target <目录>] [--force]

说明:
  --target  模板输出目录（默认: ${DEFAULT_TARGET}）
  --force   覆盖已存在模板
`)
}

function parseArgs (argv) {
  const args = { target: DEFAULT_TARGET, force: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }
    if (arg === '--force') {
      args.force = true
      continue
    }
    if (arg === '--target') {
      args.target = argv[i + 1] || ''
      i++
      continue
    }
  }
  return args
}

async function exists (target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

const templates = {
  'github.md': `# GitHub 凭证模板

- GITHUB_TOKEN: "ghp_xxxxxxxxxxxx"
- GITHUB_USERNAME: "your-name"
- GITHUB_EMAIL: "you@example.com"
- 说明: 最小权限建议仅开启 repo / workflow / read:org（按需）
`,
  'gitlab.md': `# GitLab 凭证模板

- GITLAB_TOKEN: "glpat-xxxxxxxxxxxx"
- GITLAB_HOST: "https://gitlab.com"
- GITLAB_USERNAME: "your-name"
- 说明: 建议使用 Personal Access Token + 到期策略
`,
  'deepseek.md': `# DeepSeek 凭证模板

- AI_UPSTREAM_API_KEY: "sk-xxxxxxxxxxxxxxxx"
- BASE_URL: "https://api.deepseek.com"
`,
  'openrouter_token.md': `# OpenRouter 凭证模板

- API Key: "sk-or-v1-xxxxxxxxxxxxxxxx"
- BASE_URL: "https://openrouter.ai/api/v1"
`,
  'wechat.md': `# WeChat 凭证模板

- AppID: "wx1234567890"
- AppSecret: "xxxxxxxxxxxxxxxx"
`,
  'lark.env': `# 飞书机器人 Webhook
LARK_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/your-token
`,
  'feishu_bot.env': `# 飞书双向机器人配置
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_VERIFICATION_TOKEN=xxx
FEISHU_BOT_PORT=8788
BRAIN_CHAT_ENDPOINT=http://127.0.0.1:9000/chat
`,
  'hosting_credentials.md': `# 图床与分发凭证模板

### ☁️ Cloudflare R2 Config
- R2_UPLOAD_URL: "https://your-worker.workers.dev"
- R2_AUTH_TOKEN: "your-secret-token"

### 🐙 GitHub Hosting Config
- GH_REPO: "webkubor/assets-hosting"
- GH_TOKEN: "ghp_xxxxxxxxxxxx"
`
}

async function main () {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  if (!args.target.trim()) {
    throw new Error('参数错误：--target 不能为空')
  }

  await fs.mkdir(args.target, { recursive: true })

  const created = []
  const skipped = []

  for (const [name, content] of Object.entries(templates)) {
    const fullPath = path.join(args.target, name)
    const already = await exists(fullPath)
    if (already && !args.force) {
      skipped.push(fullPath)
      continue
    }
    await fs.writeFile(fullPath, content, 'utf8')
    await fs.chmod(fullPath, 0o600)
    created.push(fullPath)
  }

  console.log(`✅ 模板目录: ${args.target}`)
  console.log(`🆕 新建/覆盖: ${created.length}`)
  for (const file of created) console.log(`  - ${file}`)
  console.log(`⏭️ 已跳过: ${skipped.length}`)
  for (const file of skipped) console.log(`  - ${file}`)
}

main().catch((error) => {
  console.error(`❌ 生成失败: ${error.message}`)
  process.exit(1)
})
