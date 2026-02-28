---
name: skill-creator
description: "Master Skill Factory - defining the unified standard for modular AI capabilities, compatible with Gemini CLI, Claude Code, and Cursor. Orchestrates SKILL.md structure, metadata, and automated packaging."
version: 2.0.0
allowed-tools: ["run_command", "write_to_file"]
---

# 🛠️ Skill Factory (一站式 AI 技能工厂)

本规范融合了 **Claude Code Skill** 的渐进式披露理念与 **Gemini CLI** 的工程化封装，旨在打造跨平台的、一步到位的 AI 专家能力包。

## 1. 技能元数据 (Frontmatter Standard)

Frontmatter 是技能的“触发指纹”，必须采用 YAML 格式并严格遵循以下字段：

```yaml
---
name: skill-identifier       # 触发名（对应斜杠命令 /name）
description: "English first..." # 触发描述（维持在 100 词内，用于渐进式披露）
version: 1.0.0               # 版本号
allowed-tools: ["tool_name"] # 预授权工具名（如 nanobanana, pencil, run_command）
user-invocable: true         # 用户是否可直接通过斜杠命令触发
---
```

## 2. 目录体系 (Core Anatomy)

每个技能必须是一个解耦的资产文件夹：

```bash
skill-package/
├── SKILL.md                 # 核心大脑（逻辑、流程、SOP）
├── package.json             # 自动化脚本与元数据（Gemini 生态核心）
├── README.md                # 审美化的用户引导（带勋章与示例）
├── scripts/                 # 确定性脚本（如 setup-mcp.sh, auto-deploy.py）
├── references/              # 辅助内核（长篇文档、Schema、API 引用）
└── assets/                  # 静态资源（模板、Logo、字体）
```

## 3. 专家逻辑：渐进式披露 (Progressive Disclosure)

- **触发层 (L1)**: `description` 中明确任务场景和触发词。
- **指令层 (L2)**: `SKILL.md` 正文包含核心逻辑，控制在 500 行内。
- **深挖层 (L3)**: 通过 `references/` 存放大型文档，Agent 仅在需要时 `view_file` 读取。

## 4. “一步到位”封装 SOP (The Factory Flow)

当识别到需要创建技能时，Agent 必须在单一复合指令中完成：

1. **目录初始化**: 创建标准 5 级目录。
2. **内核编写**:
    - 注入符合 Claude Code 语义的 Frontmatter。
    - 编写具备分步流程的 Markdown 指令。
3. **工程化补全**:
    - 写入 `package.json`（包含 `install-skill` 和 `package` 脚本）。
    - 写入审美感强的 `README.md`。
4. **自动化安装**:
    - 生成 `scripts/setup-mcp.sh` 处理依赖。
5. **编译镜像**: 执行打包命令生成 `.skill` (Zip格式)。

## 5. 跨平台兼容性 (Compatibility)

- **Gemini CLI**: 通过 `gemini skills install` 原生感知。
- **Claude Code**: 对应其原生 Skill 规范，通过斜杠命令调用。
- **Cursor/Codex**: 通过在 Rules 中引用 `SKILL.md` 实现逻辑对齐。

---
"Defining the Standard of Modern Agentic Skills." - Unified by Candle.
