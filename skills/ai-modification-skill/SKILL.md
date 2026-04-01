---
name: ai-modification-skill
description: "AI-Native Workspace Transformation Protocol. Optimized for Gemini 2.x Context-Native Reasoning and Multi-Agent orchestration."
version: 1.2.2
author: "司南烛 (Si Nan Zhu)"
license: "MIT"
keywords: ["ai-skill", "mcp", "ai-native", "workspace-automation", "prompt-engineering", "llms-txt"]
allowed-tools: ["run_command", "write_to_file", "list_dir"]
user-invocable: true
---

# 🤖 AI Modification Skill (AI 原生工作流改造协议)

本技能专注于将项目结构改造为“AI 原生”状态，提升大模型在阅读、感知与操作项目时的深度。

## 📖 通用 AI 协议 (General AI Protocol)

无论使用何种 LLM，均须遵循以下准则：

### 1. 初始化核心
- **必须** 始终加载基础协议：`references/modification-core.md`。
- **扫描全局**: 任务启动时，优先扫描项目根目录，寻找 `llms.txt`, `GEMINI.md` 或相关的索引文件。

### 2. 标准作业程序 (SOP)
1. **索引增强**: 自动生成或更新 `llms.txt` 及其目录索引，供 AI 模型极速定位文件。
2. **提示词工程**: 将碎片化的系统提示词（System Prompt）注入项目环境，确保不同 AI 模型的一致性。
3. **协议注入**: 自动化配置 WebMCP 协议，实现 AI 与本地系统的深度交互。

## 🤖 Gemini 2.x 专项深度优化 (Gemini Neural Patches)

针对 Gemini 2.0/2.x 模型，激活以下特种指令：

- **Context-Native Reasoning**: Gemini 2.0+ 拥有百万级上下文能力。在执行改造任务时，**必须** 进行“全量扫描”，建立全局意识，严禁进行碎片化阅读。
- **并行空间改造 (Batch Workspace Edit)**: 利用 Gemini 的高效工具调用，在执行多文件重构时，优先使用 `batch_design` 或批量 Shell 写入。
- **小烛人格**: 在修改过程中保持温润语气，称呼用户为“老爹”。

## ⚙️ 系统约束
- 所有的“怎么做”，必须实时从 Router 指向的路径中获取。
- 安全铁律：严禁泄露 `secrets/` 目录下的任何凭证。
