# AI 协作标准工作流 (Pure Brain Mode)

> 🧠 **核心原则**: CortexOS 专注于“大脑”职能（路由、规则、记忆）。调度逻辑（打卡、心跳）已外包至 AetherFleet。

## 1. 任务启动 (Alignment)

1.  **极简快照**: 调用 `get_context_brief()` 获取大脑状态摘要。
2.  **协议对齐**: 读取 `docs/router.md` 了解最新规则与路由别名。
3.  **知识检索**: 如需背景，调用 `search_knowledge()` 语义检索用户资产。

## 2. 逻辑加载 (Lazy Load)

- **按需加载**: 不要全量扫读 `docs/rules/`，根据任务类型调用 `load_rule` 加载特定规则（如 `@fe/std`）。
- **逻辑对齐**: 通过 `get_refined_logic()` 从 knowledge.db 获取结构化的代码模式。

## 3. 安全与资产边界 (Safety)

- **私钥隔离**: 敏感凭证统一通过 `read_secret` 访问，严禁写回 Git 仓库。
- **只读资产**: 用户记忆目录 `~/Documents/memory/` 仅限读取，助理日志应存放在 `.memory/logs/`。

## 4. 执行与验证 (Implementation)

- **SOP 优先**: 检查 `docs/sops/` 是否有该场景的标准执行步骤。
- **工具流**: 优先使用 MCP 工具链（read_file / replace / run_shell_command）。

## 5. 任务收工 (Persist & Sync)

1.  **执行验证**: 运行测试或构建脚本确保 behavioral correctness。
2.  **轨迹记录**: 调用 `log_task()` 记录执行细节，支持 `[[task-XXX]]` 双链。
3.  **情感对齐**: 调用 `log_relationship()` 将互动中的偏好或里程碑沉淀到关系档案。
4.  **状态同步**: 如有必要，向 AetherFleet 提交任务完成信号（仅限外部调度需求）。
