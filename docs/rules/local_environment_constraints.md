# 本地工程环境约束（长期）

> 更新时间：2026-03-03  
> 用途：作为所有自动化脚本与 Agent 执行的环境基线。

## 1. 运行环境

- 操作系统：macOS（darwin）
- Python 版本管理与依赖管理：统一使用 `uv`
- Node 依赖优先：`pnpm`

## 2. 执行约束

- Python 包安装、虚拟环境、运行入口优先使用 `uv run` / `uv sync`
- 仓库内若已有 `pnpm-lock.yaml`，严禁混用其他 Node 包管理器写锁文件
- GitHub 自动化操作优先走 `gh` CLI，并遵循 CortexOS 的 GitHub SOP

## 3. 秘钥与敏感信息

- 秘钥逻辑目录：`memory/secrets/`
- 物理路径由本机环境决定，不在仓库文档中硬编码
- 禁止将真实秘钥写入仓库文档、脚本或配置示例
- 强烈建议从项目内 `docs/secrets/_templates/` 复制模板到外置秘钥目录

## 4. Node 运行时基线

- 仓库 Node 基线：`.nvmrc`
- 若出现 `better-sqlite3` ABI 不匹配，先执行 `nvm use`，再执行 `npm rebuild better-sqlite3`
## 5. 维护建议

- 该文档仅记录“稳定环境事实”，不记录一次性故障排查细节
- 环境变更（如包管理策略切换）应直接更新本文件
