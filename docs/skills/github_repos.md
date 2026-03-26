---
description: CortexOS 外部技能母库的仓库关系说明。
---
# Skills 仓库关系

## 当前真源

- 本地母库：`~/Desktop/skills`
- 远端仓库：`https://gitlab.com/webkubor/personal-skills.git`

## 关系

- `CortexOS`：主脑与索引层
- `personal-skills`：技能代码真源

## 规则

1. 代码改动只进 `personal-skills`
2. CortexOS 通过 `pnpm skills:sync` 生成索引
3. 如果 skill 被废弃，应先在母库移除，再同步主脑索引
