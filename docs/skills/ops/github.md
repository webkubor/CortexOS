---
id: github-manager
triggers: ["github", "push", "release", "发版", "仓库"]
mcp_requirements: []
priority: 1
---
# GitHub Manager Skill (GitHub 运维专家)

## 🎯 核心目标
全自动处理代码推送、版本升级、CHANGELOG 更新及发版闭环。

## 🛠 工作流 (Workflows)

### 1. 凭证管理 (Auth)
- **源**: `/Users/webkubor/Documents/AI_Common/brain/secrets/accounts_unified.md` 
- **模式**: 优先使用 `gh auth login --with-token`。

### 2. 自动化发版 (Release Loop)
1. **版本升级**: 更新 `package.json`。
2. **文档同步**: 更新 `CHANGELOG.md` 及 `version.json`。
3. **Git 闭环**: `add` -> `commit` -> `push`。
4. **归档记录**: 调用 `log.sh` 记录发布记录。

## ⚠️ 操作规范
- **静默执行**: 严禁中间停顿，所有 Git 操作必须合并为单条指令执行。
- **隐私保护**: 严禁在任何日志中打印 Token。
