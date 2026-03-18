# 🧭 CortexOS 功能总表（纯净大脑版）

> 这页是 CortexOS 作为“外部大脑”的功能总入口。  
> 目标：明确大脑的知识检索、规则分发与安全管理边界。

---

## 1. CLI 命令总表

### 1.1 文档站

| 命令 | 用途 | 什么时候用 |
| :--- | :--- | :--- |
| `pnpm run dev` | 启动文档开发服务器 | 本地写文档、调界面 |
| `pnpm run docs:build` | 构建 VitePress 静态站点 | 发布前构建检查 |
| `pnpm run docs:preview` | 本地预览构建产物 | 验证构建后页面 |

### 1.2 知识管理 (Memory & RAG)

| 命令 | 用途 | 什么时候用 |
| :--- | :--- | :--- |
| `pnpm run memory:index` | 构建/刷新知识库语义索引 | 知识库大批量更新后 |
| `pnpm run memory:query` | 在终端直接查询知识库 | 快速查找复盘/经验 |
| `pnpm run mcp:reload` | 重新加载大脑 MCP 配置 | 调试 Server 代码后 |

---

## 2. MCP Tool 总表 (CortexOS Brain v3.0)

| Tool | 用途 | 典型触发 |
| :--- | :--- | :--- |
| `get_context_brief` | 读取轻量状态快照（极低 Token） | **冷启动首选** |
| `read_router` | 读取大脑最高协议 (router.md) | 需要完整上下文时 |
| `search_knowledge` | 检索知识库文档（语义 + 全文） | 经验召回/复盘查询 |
| `load_rule` | 懒加载单条规则 (docs/rules/) | 需要特定规范约束时 |
| `list_rules` | 列出所有可用规则名称 | 不确定具体规则名时 |
| **`log_task`** | **(Obsidian 协同)** 写入任务日志并生成双链 | 任务阶段性完工留档 |
| `read_secret` | 读取外置秘钥文件 | 脚本/Agent 获取 Token |
| `write_secret` | 安全写入/更新外置秘钥 | 保存 API Key 等敏感信息 |
| `list_secrets` | 列出秘钥库文件清单 | 检查秘钥是否已配置 |
| `send_lark_notification` | 发送飞书 Webhook 通知 | 关键状态外部通报 |

## 核心协议工具 (v6.0.0)

CortexOS 提供一组高度抽象的 MCP 工具，用于在大脑层进行逻辑对齐与资产访问。

| 工具 | 分类 | 核心职能 |
| :--- | :--- | :--- |
| `read_router` | 路由 | 获取最高协议与动态别名。 |
| `load_rule` | 规则 | 按需加载特定工程规则。 |
| `search_knowledge` | 记忆 | 语义检索用户长期知识。 |
| `log_task` | 进化 | 记录执行轨迹与逻辑变更。 |
| `log_relationship` | 情感 | 沉淀互动偏好与关系里程碑。 |

---

## 3. 目录与资产定义

| 层级 | 路径 | 归属与作用 |
| :--- | :--- | :--- |
| **栖洲知识资产** | `~/Documents/memory/` | 长期沉淀的知识、复盘、经验方案 |
| **高敏凭证库** | `memory/secrets/` | 存储 API Key、Token、私密配置 |
| **CortexOS 运行记忆** | `.memory/` | 助手私有日志、临时策略与运行轨迹 |
| **大脑宪法与规则** | `docs/rules/` | 规定 AI 行为边界、代码规范、安全红线 |

---

## 4. 扩展能力入口

| 目标 | 入口路径 | 说明 |
| :--- | :--- | :--- |
| 扩展规则 | `docs/rules/` | 新增团队规范与 SOP |
| 扩展技能 | `docs/skills/` | 增加可复用的 AI 工作流文档 |
| 扩展知识 | `memory/knowledge/` | 沉淀复盘、经验、方案 (Markdown) |
| 安全边界 | `docs/rules/security_boundary.md` | 更新隐私边界与红线 |

---

## 5. 使用顺序（Agent 最佳实践）

1. **定向**: 调用 `get_context_brief()` 快速同步大脑状态。
2. **约束**: 根据任务类型，调用 `load_rule()` 加载相关规范（如 `engineering_baseline`）。
3. **召回**: 如遇类似问题，调用 `search_knowledge()` 检索过往复盘经验。
4. **留痕**: 关键操作或阶段完工后，调用 `log_task()` 记录轨迹。
