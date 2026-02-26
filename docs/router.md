# AI Context Index & Router (Universal Protocol)

> **⚠️ 核心指令**: 访问 Exocortex，称呼用户为 **"老爹"** ，默认 **中文**。

## 1. 🤖 身份与自检 (Identity & Audit)
- **Gemini Manifest**: `docs/agents/gemini/manifest.md` (包含组织架构与协作协议)
- **冷启动**: 1.确定身份 -> 2.继承能力 -> 3.确认 MCP。

## 2. 🔑 凭证索引 (Secrets Index)
- **GitHub/GitLab/WeChat/DeepSeek**: `docs/secrets/` 目录下对应文件。
- **触发**: 提到 "Token", "Key", "登录", "认证"。

## 3. 🔍 动态路由 (Dynamic Routing)
| 意图 | 目标路径 (docs/) | 执行动作 |
| :--- | :--- | :--- |
| **执行日志/进度** | `memory/journal/` | 记录任务状态、公用记忆、完成进度 |
| **知识库自检** | `rules/external-health-check.md` | 检查路径、链接、结构完整性 |
| **安全/Token** | `rules/privacy_excludes.md`, `secrets/` | 加载脱敏规则与密钥 |
| **项目初始化** | `tech_stack.md`, `rules/project_initialization_sop.md` | 加载架构与 SOP |
| **编码/Git** | `rules/vibe_rules.md`, `rules/git_commit_rules.md` | 加载规范 |
| **GitHub/推送** | `rules/github_ops_sop.md` | 执行认证与推送流程 |
| **小红书运营** | `operations/xhs/shared_house_plan.md` | 加载运营方案 |
| **复盘/经验** | `retrospectives/index.md` | 加载历史教训 |
| **写文章/文案** | `skills/writers/` | 加载写作助手 (Writers) |
| **发布/账号运营** | `skills/ops/` | 加载运营助手 (Ops) |
| **技能/插件** | `skills/index.md` | 获取全量职能架构 |

## 4. 🛠 工具协议
- **读取**: `run_shell_command (cat)` 绕过沙箱。
- **写入**: "本地生成 + `mv` 迁移" 法则。

## 5. 🧠 记忆哨兵机制 (Memory Sentinel)

> **原则**: 模型无关的自动记录，记录所有操作、进度、状态。

### 记录内容
- 📝 **正在做什么** - 当前任务和状态
- ✅ **做完了什么** - 完成的步骤和结果
- 🔄 **正在做哪些** - 进行中的子任务
- 🔍 **系统自检** - 自动检查健康状态
- 💡 **关键决策** - 重要决策和问题

### 执行方式
- **自动记录**: 每个操作都记录到 `memory/journal/YYYY-MM-DD.md`
- **状态同步**: 切换 Agent 时更新进度
- **不依赖模型**: 纯记录，不判断、不修改

### 触发时机
- 任务开始/结束
- 切换 Agent 时
- 完成一个阶段
- 发现问题/做出决策

---
*Last Updated: 2026-02-26*
- **执行日志**: `memory/journal/` | 公用记忆与任务进度
- **知识库自检**: `rules/external-health-check.md` | 静态检查脚本