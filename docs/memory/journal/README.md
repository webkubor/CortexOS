---
id: journal
triggers: ["执行日志", "进度", "任务记录"]
priority: 1
---

# 外部大脑执行日志 (Execution Log)

> **原则**: 记录公用记忆、操作进度、完成状态。完全独立于任何模型，作为通用状态存储。

## ⚠️ 两个概念的区别

### 1️⃣ 执行日志 (这个文档)
- **作用**: 持久化存储状态
- **内容**: 做了什么、进度如何、完成了什么
- **载体**: `memory/journal/YYYY-MM-DD.md`
- **特点**: 模型无关，仅记录事实

### 2️⃣ 记忆哨兵 (自动化机制)
- **作用**: 自动记录行为
- **实现**: `scripts/sentinel.js`
- **内容**: 操作日志、决策、错误、状态更新
- **特点**: 自动执行，不依赖模型

> **重要**: 记忆哨兵记录的内容**最终会写入执行日志**，但哨兵本身是独立的记录机制。

## 📝 日志格式标准

每个日志文件 `YYYY-MM-DD.md` 应包含：

```markdown
# 2026-02-26: 任务执行日志

## 📋 任务概览
- **任务**: [简要描述任务]
- **触发 Agent**: [例如: Gemini / Codex]
- **优先级**: [高/中/低]

## ✅ 已完成
- [x] 任务步骤1
- [x] 任务步骤2

## 🔄 进行中
- [ ] 任务步骤3 - [详细说明当前进度]
  - 子任务1：已完成
  - 子任务2：进行中...

## ⏸️ 待办
- [ ] 任务步骤4
- [ ] 任务步骤5

## 📊 资源消耗
- Token 使用: [估算]
- 时间: [开始时间 - 结束时间]

## 🔍 大脑自检记录
- [自动检查项目]
  - 检查1: [结果]
  - 检查2: [结果]
```

## 💡 使用原则

1. **何时记录**：
   - 切换 Agent 前必须记录当前状态
   - 完成/失败必须记录
   - 关键决策必须记录

2. **避免**：
   - 不要记录 Agent 之间的对话内容
   - 不要记录敏感密钥信息
   - 只记录**状态**，不是**流水账**

3. **自检记录**：
   - 每次切换后记录"外部大脑健康检查"结果
   - 记录文件路径访问是否正常
   - 记录必要的凭证是否可用

## 🤖 记忆哨兵使用

记忆哨兵是自动记录机制，无需手动写入。

### 在脚本中使用

```javascript
const sentinel = require("./scripts/sentinel.js");

// 记录操作
sentinel.recordOperation({
  action: "创建新技能",
  details: "创建了 skill-name 技能，包含 SKILL.md 和相关资源"
});

// 记录健康检查
sentinel.recordHealthCheck([
  { name: "router.md 存在", pass: true },
  { name: "memory/journal 可访问", pass: true }
]);

// 切换 Agent
sentinel.recordAgentSwitch("Gemini");

// 记录任务状态
sentinel.recordTaskStatus("进行中", "正在更新文档结构");

// 记录决策
sentinel.recordDecision("移除老爹照片", "外部大脑不存储个人照片");

// 记录错误
sentinel.recordError("文件未找到", "路径: docs/persona/refs/father.jpg");
```

### 自动化运行

记忆哨兵可以集成到 CI/CD 或定时任务中：

```javascript
// 定时自检
setInterval(() => {
  sentinel.recordHealthCheck([
    { name: "router.md 更新", pass: true },
    { name: "sidebar 链接完整", pass: true }
  ]);
}, 3600000); // 每小时一次
```

### 查看日志

```bash
# 查看今天的日志
cat docs/memory/journal/$(date +%Y-%m-%d).md

# 搜索特定操作
grep "记录操作" docs/memory/journal/*.md
```