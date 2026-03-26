## Context

CortexOS 现在是 `webkubor` 的 AI Agent 中央大脑，对内通过 MCP 组织能力，对外通过 CLI 与 HTTP API 接收信息、分发任务，并与各类 subagent 持续互动。随着 Cloud Brain、主脑前台、技能母库、subagent 协议逐步成型，纯聊天驱动的改动方式已经不足以承载这些跨层变更。

OpenSpec 适合承担“变更过程稿”的角色，但不应替代 CortexOS 自己的长期文档真源。也就是说，`openspec/` 负责记录每次改动的 why / what / how / tasks，稳定结论仍然需要回写到 `docs/` 或 `~/Documents/memory/`。

## Goals / Non-Goals

**Goals:**
- 给 CortexOS 建立一套可复用的重大变更规范流
- 让多工具、多子代理在实现前先对齐提案与设计
- 保持 OpenSpec 与现有主脑文档体系边界清晰
- 让 AI 能通过统一命令快速发现变更状态

**Non-Goals:**
- 不用 OpenSpec 替代 `docs/` 作为长期规则真源
- 不要求所有小修复都走 OpenSpec
- 不重写 CortexOS 现有 CLI / API / MCP 运行方式

## Decisions

### 1. OpenSpec 只管理“重大变更”，不管理全部工作
- 选择：仅对 API、数据流、前台架构、subagent 协议、SSOT 边界类改动强制使用 OpenSpec。
- 原因：这样能保持流程重量适中，不会把小改动也拖进重流程。
- 备选方案：所有改动都走 OpenSpec。
- 不选原因：会让日常维护成本过高，降低实际使用率。

### 2. `docs/` 继续做长期真源，`openspec/` 做过程层
- 选择：过程产物放 `openspec/changes/...`，稳定结论回写 `docs/ops/*`、`README.md`、`docs/router.md` 等。
- 原因：符合 CortexOS 现有 SSOT 结构，也更利于 AI 和人类长期检索。
- 备选方案：把长期设计也长期留在 OpenSpec 里。
- 不选原因：会造成规范流和长期文档体系重复。

### 3. 先采用默认 `spec-driven` schema，并只做 CortexOS 上下文定制
- 选择：使用 OpenSpec 默认 schema，定制 `openspec/config.yaml` 中的 context 和 rules。
- 原因：先快速建立稳定工作流，不额外引入自定义 schema 维护成本。
- 备选方案：一开始就自建 schema。
- 不选原因：会过早增加框架复杂度。

## Risks / Trade-offs

- [流程变重] → 通过限定“必须走 OpenSpec 的改动范围”来控制
- [过程稿与长期文档脱节] → 约定稳定结论必须回写 `docs/` 或 `~/Documents/memory/`
- [多工具命令不一致] → 统一使用 `/opsx:*` 和 `openspec` CLI 作为标准入口

## Migration Plan

1. 在 CortexOS 初始化 OpenSpec 基础结构
2. 定制 `openspec/config.yaml` 以贴合中央大脑语义
3. 补充 `docs/ops/openspec-workflow.md` 作为正式说明
4. 为以后重大改动优先使用 `openspec/changes/*`
5. 在每次重要变更完成后，将稳定结论回写主脑长期文档

## Open Questions

- 后续是否要为 CortexOS 定制专属 schema，而不是一直沿用默认 `spec-driven`
- 是否要把 `openspec` 状态汇总进 `pnpm brain:status` 或主脑前台
