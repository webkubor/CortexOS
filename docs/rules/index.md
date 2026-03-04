---
description: 核心研发、运维与协作规则集，确保 Agent 输出的一致性。
---
# 规则中心

> **定义**: `rules/` 只存放**约束、禁令与价值观**——告诉 Agent 能做什么、不能做什么。  
> SOP 操作手册 → `docs/sops/`，系统运维文档 → `docs/ops/`，人格参考 → `docs/persona/`。

## 📋 当前规则清单

- [coding_rules](./coding_rules) — 编码规范约束
- [git_commit_rules](./git_commit_rules) — Commit 格式规则
- [review_rules](./review_rules) — Code Review 规则
- [red_lines](./red_lines) — 红线禁令（不可逾越）
- [privacy_excludes](./privacy_excludes) — 隐私排除规则
- [privacy_secret_protection_protocol](./privacy_secret_protection_protocol) — 私钥保护协议
- [vibe_rules](./vibe_rules) — 审美风格约束
- [org_protocol](./org_protocol) — Agent 组织协作协议
- [soul_contract_standard](./soul_contract_standard) — Agent 行为合同边界
- [skill_vetting_gate](./skill_vetting_gate) — Skill 准入门禁与红线
- [local_environment_constraints](./local_environment_constraints) — 环境执行边界约束

## 🔀 已迁移到对应目录

| 文件 | 新路径 | 原因 |
|---|---|---|
| `auto-pilot.md` | `docs/ops/` | 后台进程操作手册 |
| `external-health-check.md` | `docs/ops/` | 自检步骤清单 |
| `workflow.md` | `docs/ops/` | 工作流操作流程 |
| `github_ops_sop.md` | `docs/sops/` | GitHub 操作 SOP |
| `image_ops_sop.md` | `docs/sops/` | 图像生成 SOP |
| `project_initialization_sop.md` | `docs/sops/` | 项目初始化 SOP |
| `identity.md` | `docs/persona/` | Agent 身份协议 |
| `webkubor_vibe_manifesto.md` | `~/Documents/memory/persona/`（私有，已迁出仓库） | 审美宣言参考 |
| `webmcp_protocol_v2.md` | `docs/tech/` | 技术协议文档 |
