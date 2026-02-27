# 🧠 大脑演化史 (Brain Evolution History)

> **当前智力档位**: v3.7.0 (Hardcore & Content-Aware)
> **核心原则**: 记录大脑在逻辑、协议、技术栈上的重大变更，指导 AI Agent 快速对齐上下文。

---

## [v3.7.0] - 2026-02-27 (重大变革：本地化与极简主义)

### 🏗 基础架构 (Architecture)
- **向量库重构**: 彻底移除远程 Milvus 依赖，全面切换至 **ChromaDB (Local)** + **Ollama (nomic-embed-text)**。
- **冷启动初始化**: 新增 `scripts/init-project.sh`，实现一键部署环境（pnpm, uv, ollama）。
- **Python 闭环**: 引入 `pyproject.toml` 使用 `uv` 管理 Python 依赖，确保检索脚本稳定性。

### 📡 自动驾驶 (Auto-Pilot)
- **推送脱水**: 飞书通知升级为 **V3.7 (Content-Aware)**，删除所有煽情模板，仅保留硬核数据。
- **语义抓取**: 新增 **Diff Snippets** 功能，推送中可直接看到 Markdown 文件的文字变动摘要。
- **意图映射**: 通知标题自动根据 `router.md` 的路由表匹配语义意图（如 [写文章]、[项目初始化]）。

### ⚖️ 协议变更 (Protocol)
- **入口锚定**: 明确 `docs/router.md` 为唯一真理来源 (SSOT)，强制所有新 Agent 进场首读。
- **README 重构**: 增加了 **智力进化路径** 指南。

---

## [v2.0.0] - 2026-02-02 (基础设施期)
- 引入 **Sentinel (哨兵)** 机制，实现 Agent 物理操作日志记录。
- 确立 **VitePress** 知识展示体系。
- 建立 `docs/retrospectives` 深度复盘文件夹。

---

## [v1.0.0] - 初始混沌期
- 建立 `AI_Common` 仓库，确立 `docs/` 结构与 `package.json` 基础。
