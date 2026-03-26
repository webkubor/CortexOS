## Why

CortexOS 已经进入多入口、多协议、多子代理协作阶段，重要改动如果只停留在聊天记录和零散文档里，很容易出现边界漂移、实现先行、回顾困难的问题。现在需要一套轻量但稳定的变更规范流，让主脑、Cloud Brain、CLI/API、subagent 协议在改动前先对齐，再进入实现。

## What Changes

- 引入 OpenSpec 作为 CortexOS 的重大变更规范流。
- 约定哪些类型的改动必须先写 proposal / design / specs / tasks。
- 为 CortexOS 定制 OpenSpec 上下文，明确中央大脑定位、SSOT 边界、CLI/API/MCP/subagent 关系。
- 在 `docs/ops/` 中加入 OpenSpec 使用说明，作为人类和 AI 的共同入口。
- 提供最小命令入口，便于查看变更列表、状态与校验结果。

## Capabilities

### New Capabilities
- `openspec-governance`: 为 CortexOS 提供一套重大变更的规范流，包括提案、设计、需求与任务拆解，以及与现有主脑文档体系的边界。

### Modified Capabilities
- 无

## Impact

- 影响目录：`openspec/`、`docs/ops/`、`package.json`
- 影响对象：Codex、Gemini、Claude、OpenCode 等已接入的 AI 工具
- 不直接改变 Cloud Brain API 行为，不改变主脑运行时数据结构
