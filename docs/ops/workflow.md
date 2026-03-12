# AI 协作标准工作流

## 1. 开工前

1. 读取 `docs/router.md`
2. 调用 `get_fleet_status()` 检查并行状态
3. 执行 `fleet_claim()` 明确任务、角色、工作路径

## 2. 规则与上下文

- 优先读取当前项目真实配置，不预设语言或框架。
- 规则只从 `docs/rules/` 按需加载，不全量扫读。
- 用户知识、复盘、方案从 `~/Documents/memory/` 读取。
- 高敏信息统一通过 `memory/secrets/` 管理，不写回仓库。

## 3. 外部平台与凭证

- **GitHub**：优先 `gh` CLI
- **GitLab**：优先 `glab` CLI
- **WeChat / 发布类平台**：走对应 Skill 或已定义的集成脚本
- **统一路径规则**：文档使用逻辑路径 `memory/secrets/`；当前机器默认物理路径为 `~/Documents/memory/secrets/`

## 4. 开发执行

- 先确认主状态源，再改代码或文档
- 禁止制造第二真相、重复入口或历史兼容层
- 一次任务只保留一条清晰主链路，不做临时拼接
- 发布、通知、导出这类展示层逻辑，不应反向驱动主状态

## 5. 收工

1. 执行验证命令
2. 调用 `log_task()` 写留痕
3. 执行 `pnpm run fleet:post-task`
4. 调用 `task_handoff_check()` 标记完成并检查未认领任务
