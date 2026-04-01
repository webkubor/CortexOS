# CortexOS

> 主人的影子系统

## 概念

```
主人 (webkubor) → 影子 (CortexOS) → 任何 AI 工具
```

- **主人**：拥有主权、偏好、知识
- **影子**：记忆主人偏好、执行指令、沉淀经验
- **接入**：任何 AI 工具通过统一 CLI/API 访问影子

## 使用

```bash
# 获取上下文快照
cortexos brief

# HTTP API 模式
cortexos serve
curl http://localhost:3579/api/brief
```

## 结构

```
CortexOS/
├── docs/           # 文档（规则、指南）
├── .memory/        # 影子私有记忆（日志、偏好）
├── bin/cortexos    # CLI 入口
└── services/       # Cloud Brain 云端接口
```

**边界**：
- 主人知识 → `~/Documents/memory/`
- 影子记忆 → `.memory/`

## 版本

v7.0.0 — Harness-First 架构
