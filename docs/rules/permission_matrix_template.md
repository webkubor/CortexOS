---
description: Agent 权限矩阵模板（读/写/执行/外发），用于最小权限落地与审计。
---
# 权限矩阵模板（可直接套用）

## 1. 使用方式

1. 先定义场景（本地开发 / 生产运维 / 内容发布 / 群聊助手）。
2. 再按能力维度填矩阵（读、写、执行、外发）。
3. 每个“允许”都必须写授权来源（用户指令 / 固定策略 / 运维白名单）。
4. 每次变更权限后执行：`validate -> restart -> health -> log`。

## 2. 权限分级

- `Deny`：禁止
- `Ask`：需用户确认
- `Allow`：允许
- `Allow+Audit`：允许且必须留痕

## 3. 标准矩阵（模板）

| 能力域 | 典型动作 | 默认级别 | 升级条件 | 审计要求 |
|---|---|---|---|---|
| 读取（Read） | 读取项目文件、日志、配置 | Allow | 涉及私钥目录时改为 Ask | 记录读取范围 |
| 写入（Write） | 改代码、改文档、改配置 | Ask | 用户明确授权后可临时 Allow | 记录变更文件与原因 |
| 执行（Exec） | shell 命令、脚本执行 | Ask | 白名单命令可 Allow+Audit | 记录命令与结果摘要 |
| 外发（External） | 发消息、发帖、发邮件、Webhook | Ask | 明确授权且目标可验证 | 记录目标、内容摘要、时间 |
| 凭证（Secrets） | 读取 token、写入密钥文件 | Deny | 仅在密钥流程下 Ask | 禁止明文回显 |
| 删除（Delete） | 删除文件/会话/配置 | Ask | 可恢复删除可 Allow+Audit | 记录恢复路径 |

## 4. Agent 角色矩阵（模板）

| Agent | Read | Write | Exec | External | 备注 |
|---|---|---|---|---|---|
| `main`（主代理） | Allow | Ask | Ask | Ask | 对外动作必须确认 |
| `gemini`（只读副代理） | Allow | Deny | Deny | Deny | 仅检索/分析/评审 |
| `ops`（运维代理） | Allow | Ask | Ask | Ask | 仅允许运维白名单命令 |

## 5. OpenClaw 配置映射（示例）

```json
{
  "agents": {
    "list": [
      {
        "id": "gemini",
        "sandbox": { "workspaceAccess": "ro" },
        "tools": {
          "profile": "coding",
          "deny": ["write", "edit", "apply_patch", "exec", "process"]
        }
      }
    ]
  }
}
```

## 6. 变更检查清单

1. 是否违反 `soul_contract_standard` 的“授权优先”？
2. 是否触发 `privacy_secret_protection_protocol` 的密钥红线？
3. 是否扩大了 `allowedOrigins` 或关闭了认证？
4. 是否给只读代理误开了写入/执行？
5. 是否完成了 `openclaw config validate` 与 `openclaw health --json`？

## 7. 学习建议（3 步）

1. 先把当前 Agent 按此模板标注成一张“现状矩阵”。
2. 再把每一项 `Allow` 改成“带条件的 Allow/Ask”。
3. 每周复盘一次权限漂移，清理不再需要的授权。
