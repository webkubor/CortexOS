---
description: CortexOS 统一规则入口。只保留稳定主规则，不保留模板型、专题型、路由型规则文件。
---
# 规则中心

`docs/rules/` 现在只保留 3 份主规则文件：

1. [engineering_baseline](./engineering_baseline) — 工程基线：编码、函数注释、Review、提交、环境
2. [security_boundary](./security_boundary) — 安全边界：秘钥、隐私、红线、公开边界
3. [agent_governance](./agent_governance) — Agent 治理：授权、记忆、协作、权限

## 默认阅读顺序

1. `engineering_baseline`
2. `security_boundary`
3. `agent_governance`

## 和其他目录的边界

- `docs/rules/`：稳定规则、禁令、判断标准
- `docs/sops/`：具体操作步骤
- `docs/ops/`：系统运行与维护
- `docs/guide/`：给用户的使用说明

不再放在 `docs/rules/` 的内容类型：

- 模板型文件
- 专题型说明
- 路由型占位页
- 兼容跳转页
