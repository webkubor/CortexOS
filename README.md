# CortexOS

> 主人的影子系统

## 概念

```
主人 (webkubor) → 影子 (CortexOS) → 任何 AI 工具
```

- **主人**：拥有主权、偏好、长期知识
- **影子**：电子大脑，处理运行态信息、维护技能体系、沉淀高价值结果
- **接入**：任何 AI 工具通过统一 CLI/API 访问影子

## 定位

`CortexOS` 不拥有独立的私人长期记忆库。

它的职责是两件事：

1. **运行中的电子大脑**
- 记录日志
- 接收通知
- 分诊任务
- 处理运行态缓存与状态

2. **个人 skills 的维护中枢**
- 发现你有哪些 skills
- 维护索引
- 持续优化和治理技能体系

真正长期保留的知识，最终都应沉淀到：

- `~/Documents/memory/`

## 使用

```bash
# 首次初始化
pnpm bootstrap

# 获取上下文快照
cortexos brief

# HTTP API 模式
cortexos serve
curl http://localhost:3579/api/brief

# 本地 brain-api
curl http://127.0.0.1:3679/health
```

## 结构

```
CortexOS/
├── docs/           # 文档（规则、指南）
├── .memory/        # 影子运行记忆（日志、缓存、状态）
├── skills/         # 个人 skills 真源
├── bin/cortexos    # CLI 入口
└── services/       # Cloud Brain 云端接口
```

**边界**：
- 主人知识 → `~/Documents/memory/`
- 影子运行记忆 → `.memory/`
- 个人 skills 真源 → `skills/`

## 版本

v7.0.0 — Harness-First 架构
