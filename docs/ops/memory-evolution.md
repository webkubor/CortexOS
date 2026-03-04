---
description: 低 token 记忆检索、分级注入、错误自动复盘的运行手册。
---
# Memory Evolution

## 1. 目标

- 降低上下文注入 token 消耗。
- 让记忆注入按重要性分级（L0-L3）。
- 遇到错误自动沉淀复盘并更新重试策略。

## 2. 核心命令

```bash
pnpm run memory:index
pnpm run memory:query -- "多 Agent 冲突怎么处理" --mode lite
pnpm run memory:query -- "MCP 连接失败排查" --mode balanced --budget 1600
pnpm run memory:retro
```

## 3. 分级注入策略

- 配置文件：`scripts/ingest/injection_policy.json`
- 档位：
  - `lite`: L0-L1，最省 token，适合冷启动与快速问答。
  - `balanced`: L0-L2，默认模式，覆盖规则与操作手册。
  - `deep`: L0-L3，带项目与知识沉淀，适合复杂排障。

## 4. 自动化行为

- `auto-pilot` 会自动执行：
  - `memory-index`：只在索引源变化时重建。
  - `error-retro`：扫描 `.memory/logs` 新增错误并写入 `.memory/retros`。
- 失败复盘结果会同步回写 `retry_patterns.md` 的自动增量段。

## 5. 输出路径

- 索引：`.memory/index/memory_index.json`
- 复盘：`.memory/retros/YYYY-MM-error-retro.md`
- 去重游标：`.memory/meta/error-retro-seen.json`
