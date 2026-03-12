# 技术栈与环境上下文

## 基础环境
- **OS**: macOS
- **Shell**: zsh
- **项目根目录**: `~/Documents/CortexOS`

## 默认技术偏好

> 原则：优先探测项目实际配置。以下只是新项目默认基线，不覆盖已有项目的真实技术栈。

- **前端框架**: Vue 3（Composition API / `<script setup>`）
- **语言**: TypeScript（Strict Mode）
- **构建工具**: Vite
- **包管理器**: pnpm
- **状态管理**: Pinia
- **后端 / BaaS**: CloudBase（微信生态优先时）
- **向量数据库**: ChromaDB
- **Embedding / 本地模型**: Ollama
- **工具库**: VueUse
- **代码规范**: StandardJS（无分号、2 空格、单引号）
- **样式方案**: SCSS（scoped）或 Tailwind CSS
- **截图 / DOM 转图**: html-to-image

## 通用架构原则
- **单一职责**：函数、组件、Composable 只做一件事。
- **可读性优先**：命名和结构优先于花哨写法。
- **类型明确**：避免滥用 `any`。
- **状态收敛**：主状态源只能有一个。

## 编程偏好
- **主脚本语言**: Node.js（ESM）
- **Python 使用条件**: 明确需要脚本、索引、MCP 或数据处理时使用
- **注释语言**: 中文

## 设计与资源规范
- **图标 / Logo**: 优先直接输出 SVG
- **配色策略**: 优先跟随项目现有主题，没有主题时再补兜底方案
- **表单控件**: 禁止直接依赖原生系统 `select` 作为最终交付形态
