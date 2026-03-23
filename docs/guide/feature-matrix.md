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

### 1.2 cortexos CLI 命令

| 命令 | 用途 | 什么时候用 |
| :--- | :--- | :--- |
| `cortexos brief` | 极简快照（~25行） | **所有 Agent 冷启动** |
| `cortexos router` | 完整路由协议 | 需要全貌时 |
| `cortexos status` | 大脑状态概览 | 检查系统状态 |
| `cortexos rule <名>` | 加载具体规则 | 需要特定规范约束时 |
| `cortexos list-rules` | 列出所有可用规则 | 不确定规则名时 |
| `cortexos logs <N>` | 最近 N 天日志 | 查看近期操作记录 |
| `cortexos search <关键词>` | 知识库搜索 | 经验召回/复盘查询 |
| `cortexos log <内容>` | 记录日志 | 完工留档 |
| `cortexos secrets` | 列出凭证文件 | 检查秘钥是否已配置 |
| `cortexos serve` | 启动 HTTP API（端口 3579） | 其他 AI / Web 应用调用 |

---

## 2. cortexos CLI 全能接口 (v6.0.0)

> cortexos CLI 是 CortexOS 的唯一标准接口。不依赖 MCP 协议，任何能跑 shell 或发 HTTP 请求的 AI 工具都能调用。

### 命令速查

| 命令 | 用途 | 典型触发 |
| :--- | :--- | :--- |
| `cortexos brief` | 极简快照（~25行） | **冷启动首选** |
| `cortexos router` | 完整路由协议 | 需要全貌时 |
| `cortexos status` | 状态概览（版本/规则/日志/凭证数） | 检查系统状态 |
| `cortexos rule <名>` | 加载具体规则（模糊匹配） | 需要特定规范约束时 |
| `cortexos list-rules` | 列出所有可用规则 | 不确定规则名时 |
| `cortexos logs <N>` | 最近 N 天日志 | 查看近期操作记录 |
| `cortexos search <关键词>` | 知识库搜索（关键词匹配） | 经验召回/复盘查询 |
| `cortexos log <内容>` | 记录日志 | 完工留档 |
| `cortexos secrets` | 列出凭证文件清单 | 检查秘钥是否已配置 |

### HTTP API 模式

启动后其他 AI 可通过 HTTP 调用：

```bash
cortexos serve --port 3579
```

| 端点 | 方法 | 用途 |
| :--- | :--- | :--- |
| `/health` | GET | 健康检查 |
| `/api/brief` | GET | 极简快照 |
| `/api/router` | GET | 完整路由 |
| `/api/status` | GET | 状态概览 |
| `/api/rules` | GET | 规则列表 |
| `/api/rule/<name>` | GET | 加载具体规则 |
| `/api/search?q=<关键词>` | GET | 知识库搜索 |
| `/api/logs` | GET | 最近日志 |
| `/api/files` | GET | 已生成图片列表 |

### 启动方式对比

| 方式 | 命令 | 适用场景 |
| :--- | :--- | :--- |
| CLI | `cortexos brief` | 终端里的 AI（Gemini/Codex/Claude CLI） |
| HTTP | `cortexos serve` | Web 应用、不支持 shell 的 AI |
| 文件直读 | `cat ~/.claude/CLAUDE.md` | 首次冷启动引导 |

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
