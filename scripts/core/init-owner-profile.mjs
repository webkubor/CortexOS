#!/usr/bin/env node
/**
 * CortexOS 首次初始化向导
 * 用途：建立本机私有 owner_profile.md，将最小运行配置与可选助手形象分层保存。
 * 运行：pnpm run init:profile
 */

import * as p from '@clack/prompts'
import chalk from 'chalk'
import fs from 'fs'
import os from 'os'
import path from 'path'

const MEMORY_HOME = process.env.CORTEXOS_MEMORY_HOME || path.join(os.homedir(), 'Documents', 'memory')
const PROFILE_DIR = path.join(MEMORY_HOME, 'identity')
const PROFILE_PATH = path.join(PROFILE_DIR, 'owner_profile.md')

function buildProfile(answers) {
  const now = new Date().toISOString().slice(0, 10)
  return `# Owner Profile（私有主人定义）

> **存放位置**: \`~/Documents/memory/identity/owner_profile.md\`
> **作用**: 开源仓库不存储主人私人资料；运行时从此文件读取用户称呼、最小运行配置和可选偏好。
> **由初始化向导自动生成**: ${now}

## 1. 最小运行配置（必需）

- **GitHub ID / 用户名**: ${answers.githubId}
- **用户称呼**: ${answers.userTitle}
- **回复语言**: ${answers.language}
- **代码注释语言**: ${answers.commentLang}
- **通知时段**: ${answers.notifyStart}:00 - ${answers.notifyEnd}:00
- **大脑根目录**: ${answers.cortexRoot}
- **用户记忆库**: ${MEMORY_HOME}
- **私钥与凭证**: ${path.join(MEMORY_HOME, 'secrets')}

## 2. 工作偏好（推荐）

- **工程风格**: ${answers.engineStyle}
- **代码风格**: ${answers.codeStyle}
- **常用编辑器**: ${answers.editor}

## 3. 助手形象（可选）

- **是否启用助手昵称**: ${answers.enablePersona}
- **助手名称**: ${answers.assistantName || '未设置'}
- **助手形象**: ${answers.assistantStyle || '未设置'}
- **对用户的称呼方式**: ${answers.assistantUserCall || answers.userTitle}

## 4. 额外备注

${answers.extraNote || '（暂无）'}

*此文件仅在本机生效，不进入 Git 仓库。*
*Last Updated: ${now}*
`
}

async function main() {
  console.log()
  p.intro(chalk.bgMagenta.white.bold(' CortexOS 初始化向导 '))
  console.log(chalk.dim(`  个人档案将保存至: ${PROFILE_PATH}`))
  console.log(chalk.dim('  最小运行配置是必需项；助手形象只是可选偏好。\n'))

  if (fs.existsSync(PROFILE_PATH)) {
    const overwrite = await p.confirm({
      message: chalk.yellow('检测到已存在的档案，是否重新配置？'),
      initialValue: false
    })
    if (p.isCancel(overwrite) || !overwrite) {
      p.outro(chalk.green('已保留现有配置，无需变更。'))
      process.exit(0)
    }
    console.log()
  }

  const answers = await p.group({
    _id: () => p.note('最小运行配置'),
    githubId: () => p.text({
      message: 'GitHub ID 或用户名',
      placeholder: os.userInfo().username,
      defaultValue: os.userInfo().username
    }),
    userTitle: () => p.text({
      message: 'AI 如何称呼你？',
      placeholder: '用户',
      defaultValue: '用户'
    }),
    language: () => p.select({
      message: '回复使用哪种语言？',
      options: [
        { value: '中文', label: '中文（默认）', hint: '推荐' },
        { value: 'English', label: 'English' },
        { value: '中英混合', label: '中英混合' }
      ],
      initialValue: '中文'
    }),
    commentLang: () => p.select({
      message: '代码注释使用哪种语言？',
      options: [
        { value: '中文', label: '中文' },
        { value: 'English', label: 'English' }
      ],
      initialValue: '中文'
    }),
    notifyStart: () => p.text({
      message: '通知开始时间（24h）',
      placeholder: '10',
      defaultValue: '10',
      validate: v => isNaN(Number(v)) ? '请输入数字（0-23）' : undefined
    }),
    notifyEnd: () => p.text({
      message: '通知结束时间（24h）',
      placeholder: '20',
      defaultValue: '20',
      validate: v => isNaN(Number(v)) ? '请输入数字（0-23）' : undefined
    }),
    cortexRoot: () => p.text({
      message: 'CortexOS 根目录（绝对路径）',
      placeholder: path.join(os.homedir(), 'Documents', 'CortexOS'),
      defaultValue: path.join(os.homedir(), 'Documents', 'CortexOS')
    }),

    _work: () => p.note('工作偏好（推荐）'),
    engineStyle: () => p.select({
      message: '工程风格偏好？',
      options: [
        { value: '大道至简，去 AI 味，拒绝废话', label: '极简主义', hint: '大道至简，去 AI 味' },
        { value: '详细注释，完整文档', label: '文档驱动', hint: '注释和文档优先' },
        { value: '功能优先，快速迭代', label: '敏捷实用', hint: '快速出结果' }
      ],
      initialValue: '大道至简，去 AI 味，拒绝废话'
    }),
    codeStyle: () => p.text({
      message: '代码风格偏好',
      placeholder: 'StandardJS（无分号，2空格）',
      defaultValue: 'StandardJS（无分号，2空格）'
    }),
    editor: () => p.text({
      message: '常用编辑器',
      placeholder: 'Cursor / VS Code',
      defaultValue: 'Cursor / VS Code'
    }),

    _persona: () => p.note('助手形象（可选）'),
    enablePersona: () => p.select({
      message: '是否启用可选的助手昵称 / 形象设定？',
      options: [
        { value: '否', label: '否', hint: '只保留工具与协议' },
        { value: '是', label: '是', hint: '定义你喜欢的助手形象' }
      ],
      initialValue: '否'
    }),
    assistantName: ({ results }) => results.enablePersona === '是'
      ? p.text({
        message: '助手名称',
        placeholder: '小烛',
        defaultValue: '小烛'
      })
      : undefined,
    assistantStyle: ({ results }) => results.enablePersona === '是'
      ? p.text({
        message: '助手形象描述',
        placeholder: '温柔、可爱、开朗的女孩',
        defaultValue: '温柔、可爱、开朗的女孩'
      })
      : undefined,
    assistantUserCall: ({ results }) => results.enablePersona === '是'
      ? p.text({
        message: '助手对你的称呼',
        placeholder: results.userTitle || '用户',
        defaultValue: results.userTitle || '用户'
      })
      : undefined,

    _note: () => p.note('额外备注（可选）'),
    extraNote: () => p.text({
      message: '给 AI 的额外说明（直接回车跳过）',
      placeholder: '例：避免标题党、少废话、遇到风险先提示',
      defaultValue: ''
    })
  }, {
    onCancel: () => {
      p.cancel('已取消，配置未保存。')
      process.exit(0)
    }
  })

  fs.mkdirSync(PROFILE_DIR, { recursive: true })
  fs.writeFileSync(PROFILE_PATH, buildProfile(answers), 'utf-8')

  p.outro(
    chalk.green('档案建立完成。') + '\n\n' +
    chalk.dim(`  ${PROFILE_PATH}\n`) +
    chalk.dim('  AI 下次启动时会自动从此路径加载配置。\n') +
    chalk.dim('  必需项用于运行；助手形象仅作为可选偏好。')
  )
}

main()
