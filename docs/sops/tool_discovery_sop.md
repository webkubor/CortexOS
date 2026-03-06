# 🔍 自动化工具发现与对齐 SOP (Tool Discovery SOP)

## 1. 触发场景

- AI 节点 **冷启动** 完成后。
- 收到超出原生 MCP 能力范围的复杂任务（如：分镜、发布、上传）。
- 用户提到特定的技能名（前缀带 `$` 或 `skill` 字样）。

## 2. 执行步骤

### Step 1: 能力对齐 (Capability Alignment)

- 强制读取 `docs/intel/tooling_inventory.md`。
- **禁止** 在未读取 Inventory 的情况下执行 `ls ~/.agents/skills`。

### Step 2: 决策路由 (Router Decision)

- **私有优先**: 如果 `tooling_inventory` 中存在相同职能的 Private 脚本，无视 Public 插件。
- **路径锁定**: 获取脚本的绝对路径（如 `CortexOS/scripts/tools/...`）。

### Step 3: 指令执行 (Execution)

- 直接调用 Inventory 中注明的命令模板。
- 若 Inventory 缺失细节，联动查阅 `docs/mcp-console.md`。

## 3. DoD (完工定义)

1. AI 明确当前可用工具列表。
2. AI 明确该任务的最优工具路径。
3. AI 向用户回报时，明确指出所使用的工具属性（Private/Public）。

### Metadata

*Created: 2026-03-06 | CortexOS Protocol Agent*
