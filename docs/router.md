# 路由

## 身份

| 角色 | 真源 |
|:---|:---|
| 主人 (webkubor) | `~/Documents/memory/` |
| 影子 (CortexOS) | `IDENTITY.md` + `soul.md` |

## 定义

- `CortexOS` 是 `webkubor` 的电子大脑与技能中枢
- 它不拥有独立的私人长期记忆库
- 它负责记录运行态、分诊信息，并把高价值内容沉淀到 `~/Documents/memory/`
- 它同时维护 `skills/` 里的个人 skills 真源与索引

## 命令

```bash
cortexos brief      # 快照
cortexos status     # 状态
cortexos rule       # 规则
cortexos search     # 搜索
```

## 文档

- [规则](/rules/) — 工程基线、安全边界、Agent 治理
- [指南](/guide/) — 安装与使用
- [接入](/agents/) — AI 工具接入方式

## 边界

- 主人知识 → `~/Documents/memory/`
- 影子运行记忆 → `.memory/`
- 个人 skills 真源 → `skills/`
