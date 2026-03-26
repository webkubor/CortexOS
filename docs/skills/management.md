---
description: CortexOS 对外部 skills 母库的维护方式。强调 skills 独立存在，主脑只维护治理、索引与使用协议。
---
# Skills 维护方式

## 定位

- `skills` 是独立能力母库
- `CortexOS` 是主脑
- 主脑不复制 skill 代码，只维护：
  - 索引
  - 使用入口
  - 治理规则
  - 最近同步状态

## 正确维护方式

1. 修改技能内容：去 `~/Desktop/skills/`
2. 完成功能后：提交母库
3. 回到 CortexOS：执行 `pnpm skills:sync`
4. 让主脑重新认识最新 skill 状态

## 不要怎么做

- 不要把 skill 代码复制到 CortexOS 里
- 不要同时维护两份 skill
- 不要把主脑文档当 skill 真源

## 推荐节奏

- 小改动：直接改 skill 母库
- 阶段性整理：同步生成主脑索引
- 真正稳定后：再写分享文档或 SOP
