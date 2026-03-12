---
description: 核心研发、运维与协作规则集，确保 Agent 输出的一致性。
---
# 规则中心

> **定义**: `rules/` 只存放**约束、禁令与价值观**——告诉 Agent 能做什么、不能做什么。  
> SOP 操作手册 → `docs/sops/`，系统运维文档 → `docs/ops/`，人格参考 → `docs/persona/`。

## 先看这 6 条

如果你只想快速掌握 CortexOS 的开发规则，先读下面这 6 条：

1. [coding_rules](./coding_rules) — 编码规范约束，定义什么叫可用代码
2. [review_rules](./review_rules) — Code Review 规则，定义如何按风险审查
3. [red_lines](./red_lines) — 红线禁令，定义哪些行为直接算事故
4. [local_environment_constraints](./local_environment_constraints) — 本地环境与运行时边界
5. [privacy_secret_protection_protocol](./privacy_secret_protection_protocol) — 秘钥与敏感信息存放规则
6. [org_protocol](./org_protocol) — 多 Agent 协作协议

## 按场景找规则

### 开发必读

- [coding_rules](./coding_rules) — 编码规范约束
- [review_rules](./review_rules) — Code Review 规则
- [git_commit_rules](./git_commit_rules) — Commit 规则
- [local_environment_constraints](./local_environment_constraints) — 本地环境约束

### 安全与边界

- [red_lines](./red_lines) — 红线禁令
- [privacy_excludes](./privacy_excludes) — 隐私排除规则
- [privacy_secret_protection_protocol](./privacy_secret_protection_protocol) — 私钥保护协议
- [permission_matrix_template](./permission_matrix_template) — 权限矩阵模板

### Agent 协作

- [org_protocol](./org_protocol) — 组织协作协议
- [soul_contract_standard](./soul_contract_standard) — Agent 行为合同边界
- [skill_vetting_gate](./skill_vetting_gate) — Skill 准入门禁与红线

### 风格与表达

- [vibe_rules](./vibe_rules) — 审美风格约束

## 规则和别的文档有什么区别

- `docs/rules/`：约束、禁令、边界、判断标准
- `docs/sops/`：具体操作步骤
- `docs/ops/`：系统运行、维护、后台任务
- `docs/guide/`：给用户的上手与说明

如果你在改代码时不知道先读什么，默认顺序是：

1. `coding_rules`
2. `review_rules`
3. `red_lines`
4. `local_environment_constraints`
