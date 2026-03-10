# 项目初始化与模板 SOP (Project Initialization)

> 核心目标：统一所有项目的 AI 协作结构 (.agent) 与文档格式。
> **基准**: 以 th-payment-web 项目配置为标准。
> 前端新项目统一基线补充见：[`vue3-vite-ts-scss-baseline`](./vue3-vite-ts-scss-baseline)。

## 1. 目录结构初始化

任何新项目启动 (Phase 1) 必须执行以下 Shell 命令：

```bash
# 1. 创建精简目录结构
mkdir -p .agent/{plans,reviews}

# 2. 创建项目总览 (PROJECT.md)
printf "# 项目总览 (Project Overview)

> 这里是 AI 协作的上下文中心。

## 快速导航
- 📂 **[计划索引 (Plans)](plans/README.md)**: 任务待办与进行中。
- ✅ **[执行记录 (Reviews)](reviews/README.md)**: 任务完成后的原子记录。
- 🗺 **[模块索引 (Modules)](MODULE_INDEX.md)**: 代码结构职责图。
- 🎨 **[设计规范](DESIGN_SYSTEM.md)**: 色彩、排版与 UI 规则。

## 当前状态
- **阶段**: 初始化 (Inception)
- **最新计划**: 暂无
" > .agent/PROJECT.md

# 3. 创建分栏索引文件
printf "# 计划索引 (Plans Index)

## 📅 活跃中 (Active)
暂无。

## ✅ 已完成 (Completed)
暂无。
" > .agent/plans/README.md

printf "# 复盘索引 (Review Index)

## 📝 最近复盘
暂无。
" > .agent/reviews/README.md

# 4. 创建模块索引 (空)
printf "# 模块索引 (Module Index)

## 核心层 (Core)
待扫描。
" > .agent/MODULE_INDEX.md
```

## 2. README 注入

必须在项目根目录 `README.md` 头部注入导航：

```markdown
# AI Context

> **🤖 AI Agents 导航**: 本项目遵循 Standard Workflow。
> 请优先阅读 [.agent/PROJECT.md](.agent/PROJECT.md) 获取上下文与任务索引。
```

## 3. 标准文档模板 (Templates)

### 3.1 计划模板 (Plan)

路径: `.agent/plans/YYYY-MM-DD_task_name.md`

```markdown
# 计划: [任务简述]

**日期**: YYYY-MM-DD
**状态**: 🚧 进行中 / ⏳ 待办
**发起人**: User/Agent

## 🎯 目标 (Goals)
- [ ] 核心目标 1
- [ ] 核心目标 2

## 📋 任务分解 (Tasks)
- [ ] 步骤 1
- [ ] 步骤 2

## 🔗 参考 (References)
- [文件链接](path/to/file)
```

### 3.2 复盘模板 (Review)

路径: `.agent/reviews/YYYY-MM-DD_task_name_review.md`

```markdown
# 复盘: [任务简述]

**日期**: YYYY-MM-DD
**执行人**: Agent
**审核人**: User (必填)
**关联计划**: [链接到 Plan](../plans/xxx.md)

## 📊 结果概览
- **状态**: ✅ 成功 / ❌ 失败
- **Token消耗**: 约 x k

## 💡 关键决策 (Key Decisions)
- 决策 1...

## 🐛 遇到的坑 (Lessons Learned)
- **问题**: ...
- **解决**: ...
```

## 4. 设计规范初始化

必须创建 `.agent/DESIGN_SYSTEM.md`，包含以下基础结构：

```markdown
# 设计规范 (Design System)

## 🎨 色彩系统 (Color Palette)
...

## 📱 布局与交互 (Layout)
- **移动端优先**: 360x800 基准。
- **骨架屏**: 数据加载期间必须显示骨架屏，严禁空白或 0。
```

## 5. AI 行为强制准则

1.  **计划先行**：先写 Plan，再写代码。
2.  **实时更新**：任务完成打钩 `[x]`。
3.  **自动复盘**：任务结束必写 Review。
4.  **索引维护**：增删文件必更新 README 索引。
