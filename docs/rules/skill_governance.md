---
description: skills 能力库治理规则。明确 skills 必须独立存在，CortexOS 只保留索引与治理，不复制能力代码。
---
# Skill Governance

## 核心原则

1. `skills` 是独立能力母库，不属于 CortexOS 本体代码。
2. CortexOS 只维护索引、治理、使用说明与同步状态。
3. 不允许在 CortexOS 中复制 skill 真代码形成第二份实现。
4. 任何 skill 的实质更新，都应优先发生在 `~/Desktop/skills/`。

## 单一真源

- 本地真源：`~/Desktop/skills/`
- 远端真源：`personal-skills` 仓库
- CortexOS：仅文档索引层

## 生命周期

1. 创建：在母库中新增 skill
2. 使用：由主脑索引识别并调度
3. 优化：继续在母库迭代
4. 废弃：先从母库移除，再同步主脑索引

## 同步命令

```bash
pnpm skills:sync
```

## 判断标准

以下内容应该进 `skills` 母库：
- 可复用工作流
- 跨 agent 可共享能力
- 独立技能模板、脚本、参考资料

以下内容不应该进 `skills` 母库：
- 只服务 CortexOS 单项目的一次性逻辑
- 主脑自身运行状态
- 用户长期知识内容
