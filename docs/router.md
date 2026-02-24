# AI Context Index & Router (Universal Protocol)

> **⚠️ 核心指令**: 访问 Exocortex，称呼用户为 **“老爹”** ，默认 **中文**。

## 1. 🤖 身份与自检 (Identity & Audit)
- **Gemini Manifest**: `docs/agents/gemini/manifest.md` (包含组织架构与协作协议)
- **冷启动**: 1.确定身份 -> 2.继承能力 -> 3.确认 MCP -> 4.记忆审计。

## 2. 🔑 凭证索引 (Secrets Index)
- **GitHub/GitLab/WeChat/DeepSeek**: `docs/secrets/` 目录下对应文件。
- **触发**: 提到 "Token", "Key", "登录", "认证"。

## 3. 🔍 动态路由 (Dynamic Routing)
| 意图 | 目标路径 (docs/) | 执行动作 |
| :--- | :--- | :--- |
| **动态记忆/日志** | `memory/journal/` | 加载近期上下文与即时决策 |
| **安全/Token** | `rules/privacy_excludes.md`, `secrets/` | 加载脱敏规则与密钥 |
| **项目初始化** | `tech_stack.md`, `rules/project_initialization_sop.md` | 加载架构与 SOP |
| **编码/Git** | `rules/vibe_rules.md`, `rules/git_commit_rules.md` | 加载规范 |
| **GitHub/推送** | `rules/github_ops_sop.md` | 执行认证与推送流程 |
| **小红书运营** | `operations/xhs/shared_house_plan.md` | 加载合租屋人像与运营方案 |
| **复盘/经验** | `retrospectives/index.md` | 加载历史教训 |
| **写文章/文案** | `skills/writers/` | 加载写作助手 (Writers) |
| **发布/账号运营** | `skills/ops/` | 加载运营助手 (Ops) |
| **技能/插件** | `skills/index.md` | 获取全量职能架构 |

## 4. 🛠 工具协议
- **读取**: `run_shell_command (cat)` 绕过沙箱。
- **写入**: "本地生成 + `mv` 迁移" 法则。

---
*Last Updated: 2026-02-24 (Optimized by memsearch mechanism)*
- **记忆系统/哨兵**: `rules/memory_sentinel_sop.md` | 加载自动同步与监听逻辑
