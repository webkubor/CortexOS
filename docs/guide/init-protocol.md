# CortexOS `init` 协议设计

`cortexos brief` 解决的是“大脑快照”，但没有解决“当前工作区是谁、该读什么、该遵守什么”。  
下一阶段的 CortexOS 应该把冷启动统一收敛为一个入口：

```bash
cortexos init
```

目标不是增加命令，而是让 Agent 在进入任意仓库时，不需要记忆额外流程，也不需要手动搜索项目上下文。

## 1. 设计目标

`cortexos init` 必须一次性解决这 5 件事：

1. 识别当前工作区与 Git 边界
2. 命中项目索引，判断当前属于哪个项目
3. 自动挂载该项目对应的记忆文档与规则建议
4. 输出最小必要上下文，而不是一堆散命令
5. 同时支持人类可读输出与 Agent 可消费 JSON

一句话：

> `brief` 是大脑状态，`init` 是工作区冷启动。

## 2. 命令面设计

建议保留 3 个核心命令：

### `cortexos init`

用途：冷启动当前工作区，自动识别项目、自动同步项目索引并返回上下文。

典型用法：

```bash
cortexos init
cortexos init --json
cortexos init ~/workspace/your-project
```

### `cortexos doctor`

用途：检查当前工作区是否缺上下文、缺规则、缺项目档案、是否存在结构风险。

典型用法：

```bash
cortexos doctor
cortexos doctor --json
```

### `cortexos brief`

用途：保留为“全局大脑快照”，不再承担项目识别职责。

## 3. `init` 的工作流程

`cortexos init` 的内部逻辑建议固定为下面 6 步：

1. 获取当前 `cwd`
2. 向上查找 Git 根目录与嵌套仓库边界
3. 以 Git 仓库根作为唯一 ID，自动写入或纠正项目索引
4. 从项目索引重新命中当前项目
5. 加载对应项目档案与推荐规则
6. 输出文本或 JSON

建议优先级：

1. 显式传入路径
2. 当前 `cwd`
3. 向上查找最近的 Git 仓库根
4. 没有 Git 仓库则作为临时工作区处理，不写正式索引

## 4. 项目索引

`init` 不应该依赖手工注册。  
只要当前工作区处于 Git 仓库中，`init` 就应该自动把该仓库同步进项目索引。

建议项目索引主源：

```text
CortexOS/.memory/sqlite/knowledge.db -> project_maps
```

说明：

- `project_maps` 是项目索引的唯一结构化主源
- 历史 `registry.json` 视为遗留旁路，不应再作为新协议的写入目标
- `init/doctor` 后续都应围绕 SQLite 主源演进

建议表结构语义：

```sql
project_maps(
  project_name TEXT UNIQUE,
  root_path TEXT,
  tech_stack TEXT,
  core_logic_map TEXT,
  entry_points TEXT
)
```

字段建议：

- `root_path`: Git 仓库根路径，也是项目唯一身份锚点
- `project_name`: 当前项目展示名，可在 `init` 时按当前仓库名自动纠正
- `tech_stack`: 技术栈摘要
- `core_logic_map`: 项目架构摘要
- `entry_points`: 入口说明

补充信息如 `memory_doc`、`repo_role`、`recommended_rules` 可以由 `init` 在运行时推导，不必额外复制存一份。

## 5. `init` 的文本输出

人类可读模式应该简洁，目标是 15-25 行内完成冷启动。

建议输出：

```text
🧠 CortexOS Init

项目 ID: my-frontend-repo
项目名称: my-frontend-repo
当前工作区: ~/workspace/my-frontend-repo/apps/app
仓库根目录: ~/workspace/my-frontend-repo
仓库角色: frontend-app
已命中项目索引: 是
项目记忆文档: ~/Documents/memory/knowledge/refined/projects/my-frontend-repo.md
索引同步: 已按当前 Git 仓库同步项目索引

推荐规则:
- engineering_baseline
- frontend_standard
- typescript_standard

提示:
- 检测到嵌套 Git 仓库
```

原则：

- 不自动吐完整 router
- 不自动打印全部规则清单
- 不自动全文输出项目文档
- 只返回“当前最该知道的最小上下文”

## 6. `init --json` 输出

给 Agent 使用时，文本不够稳定，所以必须支持 JSON。

建议格式：

```json
{
  "ok": true,
  "cwd": "/Users/you/workspace/my-frontend-repo/apps/app",
  "project": {
    "id": "my-frontend-repo",
    "name": "my-frontend-repo",
    "root": "/Users/you/workspace/my-frontend-repo",
    "repo_root": "/Users/you/workspace/my-frontend-repo",
    "repo_role": "frontend-app",
    "memory_doc": "~/Documents/memory/knowledge/refined/projects/my-frontend-repo.md"
  },
  "rules": [
    "engineering_baseline",
    "frontend_standard",
    "typescript_standard"
  ],
  "warnings": [
    "检测到嵌套 Git 仓库：~/workspace/my-frontend-repo/apps/app"
  ],
  "索引同步": {
    "status": "unchanged",
    "message": "已按当前 Git 仓库同步项目索引"
  },
  "next_actions": ["读取项目记忆文档", "加载推荐规则"]
}
```

这会让 Codex、Gemini、Claude CLI、AetherFleet worker 都能统一消费。

## 7. `doctor` 的责任

`doctor` 是结构体检，不是状态快照。

建议它检查：

1. 当前工作区是否已注册
2. `memory_doc` 是否存在
3. 推荐规则是否都能命中
4. 是否有嵌套 Git 仓库
5. 是否存在仓库边界歧义
6. 是否缺少项目类型标记

建议输出示例：

```text
Project Doctor: tarspay-platform-india-app

OK:
- project registered
- memory doc found
- recommended rules found

WARN:
- nested git repo detected
- no release workflow rule linked

FAIL:
- none
```

## 8. 与现有命令的关系

这是最重要的收敛原则：

- `brief` 不废弃
- `search` 不废弃
- `rule` 不废弃
- 但它们不再承担“项目冷启动入口”的角色

新的认知模型应该是：

- `brief`: 看大脑状态
- `init`: 看我现在正在什么项目里，并自动同步项目索引
- `rule`: 精准读某条规则
- `search`: 精准搜知识
- `doctor`: 查项目结构是否健康

## 9. 与 `AGENTS.md` 的关系

仓库内的 `AGENTS.md` 应该进一步简化。

不再写：

```bash
cortexos brief
cortexos read-router
cortexos list-rules
cortexos search "project-name"
```

而是写成：

```bash
cortexos init
```

只有在 `init` 报告缺项目记忆文档或结构风险时，Agent 才做下一步补充动作。

## 10. 最小可实现版本

建议先做 MVP，不要一上来追全自动。

### Phase 1

- 新增 `cortexos init`
- 读取当前 `cwd`
- 命中 `project_maps`
- 输出文本版

### Phase 2

- 增加 `--json`
- 增加嵌套仓库检测
- 增加推荐规则输出
- 自动发现项目档案
- 自动按 Git 仓库同步项目索引

### Phase 3

- 增加 `cortexos doctor`
- 增加结构风险诊断
- 增加 AetherFleet / CLI agent 的结构化接入

## 11. 一条总原则

CortexOS 的目标不是让 Agent 记住更多命令，而是：

> 让 Agent 进入任意工作区时，只需要一个动作，就能知道“我在哪、这是什么项目、该读什么、该遵守什么”。

所以 `cortexos init` 不只是命令优化，而是 CortexOS 从“可调用工具箱”升级为“工作区感知大脑”的关键一步。
