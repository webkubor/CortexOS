#!/usr/bin/env node
/**
 * CortexOS 首次初始化向导 (Owner Profile Setup Wizard)
 * 用途：引导用户建立私有的 owner_profile.md，将个人偏好从开源仓库中彻底解耦。
 * 依赖：@clack/prompts、chalk
 * 运行：pnpm run init:profile
 */

import * as p from '@clack/prompts'
import chalk from 'chalk'
import fs from 'fs'
import os from 'os'
import path from 'path'

// ─── 输出目录（可由环境变量覆盖）───────────────────────────
const MEMORY_HOME = process.env.CORTEXOS_MEMORY_HOME
    || path.join(os.homedir(), 'Documents', 'memory')
const PROFILE_DIR = path.join(MEMORY_HOME, 'identity')
const PROFILE_PATH = path.join(PROFILE_DIR, 'owner_profile.md')

// ─── 建立 profile 内容 ──────────────────────────────────────
function buildProfile(answers) {
    const now = new Date().toISOString().slice(0, 10)
    return `# 👤 Owner Profile (私有主人定义)

> **存放位置**: \`~/Documents/memory/identity/owner_profile.md\`
> **作用**: CortexOS 开源仓库不存储任何主人信息。
> 所有 Agent 在运行时从此文件加载主人称呼与个人偏好，以保持开源仓库的通用性与隐私安全。
> **由初始化向导自动生成**: ${now}

---

## 🏷️ 基础身份

- **GitHub ID / 用户名**: ${answers.githubId}
- **AI 称呼**: ${answers.alias}（所有 Agent 必须以此称呼用户）
- **AI 签名格式**: \`🏮 小烛 ({ModelName}) ｜ ⚡️ ${answers.role}\`

---

## 🌐 语言偏好

- **回复语言**: ${answers.language}
- **技术术语**: 可使用英文
- **代码注释**: ${answers.commentLang}

---

## 🎨 审美偏好 (Aesthetic Preferences)

- **工程风格**: ${answers.engineStyle}
- **UI 主题**: ${answers.uiTheme}
- **代码风格**: ${answers.codeStyle}

---

## 🕐 工作习惯

- **有效通知时段**: ${answers.notifyStart}:00 - ${answers.notifyEnd}:00（飞书 Lark 推送，其余时间静默）
- **常用编辑器**: ${answers.editor}

---

## 🔗 项目坐标

- **外部大脑根目录**: ${answers.cortexRoot}
- **私钥与凭证**: ${path.join(MEMORY_HOME, 'secrets')}
- **私有记忆库**: ${MEMORY_HOME}

---

## 💬 给 AI 的个人备注

${answers.extraNote || '（暂无）'}

---

*此文件在 CortexOS 开源仓库的 \`.gitignore\` 中被排除，仅在本机生效。*
*Last Updated: ${now}*
`
}

// ─── 主流程 ─────────────────────────────────────────────────
async function main() {
    console.log()
    p.intro(chalk.bgMagenta.white.bold(' 🧠 CortexOS 初始化向导 '))
    console.log(chalk.dim(`  个人档案将保存至: ${PROFILE_PATH}`))
    console.log(chalk.dim('  此文件已在 .gitignore 中排除，不会上传 GitHub\n'))

    // 已存在时询问是否覆盖
    if (fs.existsSync(PROFILE_PATH)) {
        const overwrite = await p.confirm({
            message: chalk.yellow('⚠️  检测到已存在的档案，是否重新配置？'),
            initialValue: false,
        })
        if (p.isCancel(overwrite) || !overwrite) {
            p.outro(chalk.green('✅ 已保留现有配置，无需变更。'))
            process.exit(0)
        }
        console.log()
    }

    const answers = await p.group(
        {
            // ── 基础身份 ──────────────────────────────────────────
            _id: () => p.note('基础身份'),
            githubId: () => p.text({
                message: 'GitHub ID 或用户名',
                placeholder: os.userInfo().username,
                defaultValue: os.userInfo().username,
            }),
            alias: () => p.text({
                message: 'AI 如何称呼你？',
                placeholder: '用户',
                defaultValue: '用户',
            }),
            role: () => p.text({
                message: 'AI 签名中的角色定位',
                placeholder: '前端全栈专家',
                defaultValue: '前端全栈专家',
            }),

            // ── 语言偏好 ──────────────────────────────────────────
            _lang: () => p.note('语言偏好'),
            language: () => p.select({
                message: '回复使用哪种语言？',
                options: [
                    { value: '中文', label: '中文（默认）', hint: '推荐' },
                    { value: 'English', label: 'English' },
                    { value: '中英混合', label: '中英混合' },
                ],
                initialValue: '中文',
            }),
            commentLang: () => p.select({
                message: '代码注释使用哪种语言？',
                options: [
                    { value: '中文', label: '中文' },
                    { value: 'English', label: 'English' },
                ],
                initialValue: '中文',
            }),

            // ── 审美偏好 ──────────────────────────────────────────
            _aesthetic: () => p.note('审美偏好'),
            engineStyle: () => p.select({
                message: '工程风格偏好？',
                options: [
                    { value: '大道至简，去 AI 味，拒绝废话', label: '极简主义', hint: '大道至简，去 AI 味' },
                    { value: '详细注释，完整文档', label: '文档驱动', hint: '注释和文档优先' },
                    { value: '功能优先，快速迭代', label: '敏捷实用', hint: '快速出结果' },
                ],
                initialValue: '大道至简，去 AI 味，拒绝废话',
            }),
            uiTheme: () => p.select({
                message: 'UI 主题色系偏好？',
                options: [
                    { value: '极光紫 + 纯净白（暗色调）', label: '极光紫', hint: '暗色 + 高对比' },
                    { value: '深海蓝 + 白金（商务风）', label: '深海蓝', hint: '商务稳重' },
                    { value: '森林绿 + 米白（清新风）', label: '森林绿', hint: '清新自然' },
                    { value: '由我自定义', label: '自定义', hint: '在备注里说明' },
                ],
                initialValue: '极光紫 + 纯净白（暗色调）',
            }),
            codeStyle: () => p.text({
                message: '代码风格偏好',
                placeholder: 'StandardJS（无分号，2空格）',
                defaultValue: 'StandardJS（无分号，2空格）',
            }),

            // ── 工作习惯 ──────────────────────────────────────────
            _work: () => p.note('工作习惯'),
            notifyStart: () => p.text({
                message: 'Lark 通知开始时间（小时，24h制）',
                placeholder: '10',
                defaultValue: '10',
                validate: v => isNaN(Number(v)) ? '请输入数字（0-23）' : undefined,
            }),
            notifyEnd: () => p.text({
                message: 'Lark 通知结束时间（小时，24h制）',
                placeholder: '20',
                defaultValue: '20',
                validate: v => isNaN(Number(v)) ? '请输入数字（0-23）' : undefined,
            }),
            editor: () => p.text({
                message: '常用编辑器',
                placeholder: 'Cursor / VS Code',
                defaultValue: 'Cursor / VS Code',
            }),

            // ── 项目坐标 ──────────────────────────────────────────
            _paths: () => p.note('项目坐标'),
            cortexRoot: () => p.text({
                message: 'CortexOS 根目录（绝对路径）',
                placeholder: path.join(os.homedir(), 'Documents', 'CortexOS'),
                defaultValue: path.join(os.homedir(), 'Documents', 'CortexOS'),
            }),

            // ── 个人备注 ──────────────────────────────────────────
            _note: () => p.note('个人备注（可选）'),
            extraNote: () => p.text({
                message: '给 AI 的额外说明（审美红线、禁忌词等，直接回车跳过）',
                placeholder: '例：严禁使用"震惊"、"必看"等廉价标题党词汇',
                defaultValue: '',
            }),
        },
        {
            onCancel: () => {
                p.cancel('已取消，配置未保存。')
                process.exit(0)
            },
        }
    )

    // 写入文件
    const content = buildProfile(answers)
    fs.mkdirSync(PROFILE_DIR, { recursive: true })
    fs.writeFileSync(PROFILE_PATH, content, 'utf-8')

    p.outro(
        chalk.green('✅ 档案建立完成！') + '\n\n' +
        chalk.dim(`   📁 ${PROFILE_PATH}\n`) +
        chalk.dim('   AI 下次启动时会自动从此路径加载你的个人偏好。\n') +
        chalk.dim('   如需修改，重新运行 ') + chalk.cyan('pnpm run init:profile') + chalk.dim(' 即可。')
    )
}

main()
