---
description: Skills 能力入口与查找顺序。
---
# Skills 索引

这部分只做一件事：告诉 AI 去哪里找 skills，以及先看哪里。

## 查找顺序

1. Skills 管理台（统一视图）：[`management`](./management)
2. 用户侧 skills 索引：`~/Documents/memory/skills/index.md`
3. 本地 skills 根目录：`~/Desktop/skills`
4. 开源仓库清单：[`github_repos`](./github_repos)

## 边界

- `docs/skills/` 只保留索引与目录说明，不放长篇 SOP。
- Skills 的业务细节、项目策略、运行态说明，写入用户 memory（`../memory`）。

## 常用动作

- 查看“原生 + 已安装”总览：打开 [`management`](./management)
- 查看可用开源 skills：打开 [`github_repos`](./github_repos)
- 查本机私有 skills：先读 `~/Documents/memory/skills/index.md`
- 新增 skill：在 `~/Desktop/skills` 建仓，并同步更新 `../memory/skills/index.md`
- 刷新管理页：运行 `pnpm run skills:sync`（或 `node scripts/tools/sync-skills-management.mjs`）
