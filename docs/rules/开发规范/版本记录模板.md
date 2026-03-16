---
title: 版本记录模板
type: development-template
status: active
scope: global
domain: frontend
updated: '2026-03-10'
tags:
  - development-template
  - frontend
  - version
  - changelog
  - release
---
# 版本记录模板

## 适用范围
用于前端项目的版本号变更、发布记录、回滚记录和变更留痕。

## 版本号递增原则
- 修复问题：`patch`，例如 `1.4.2 -> 1.4.3`
- 兼容性新增：`minor`，例如 `1.4.2 -> 1.5.0`
- 破坏性变更：`major`，例如 `1.4.2 -> 2.0.0`

## CHANGELOG 模板
```md
## v1.4.3 - 2026-03-10

### Changed
- 优化泰国收银台订单状态轮询逻辑。
- 收敛支付结果页的跳转判断，减少重复请求。

### Fixed
- 修复低网速下支付结果页偶发空白的问题。
- 修复英语文案缺失时展示 key 的问题。

### Risk
- 订单状态轮询逻辑有调整，需重点回归支付成功 / 失败 / 超时三条主路径。

### Rollback
- 回滚到 `v1.4.2`
- 回滚入口：`deploy/rollback-version.sh`
```

## 发布记录模板
```md
# Release v1.4.3

- 日期：2026-03-10
- 项目：th-payment-web
- 发布类型：patch
- 负责人：Codex
- 影响模块：订单轮询、结果页跳转、国际化文案
- 构建命令：`npm run build:prod`
- 发布入口：`deploy/prod.sh`
- 回滚入口：`deploy/rollback-version.sh`
- 风险说明：支付结果页链路有逻辑收敛，需重点验证成功 / 失败 / 超时三条路径
- 验证结果：已手测主流程
```

## 最低保留字段
每次版本记录至少保留以下字段：
- 版本号
- 日期
- 变更摘要
- 影响模块
- 风险说明
- 回滚入口

## 落盘位置建议

三选一，但一旦选定就持续沿用：
- `CHANGELOG.md`
- `docs/releases/`
- 发布通知归档目录

## 禁止事项
- 禁止发布后不更新版本号。
- 禁止只覆盖线上产物、不保留版本记录。
- 禁止代码版本、构建版本、通知版本三套口径不一致。
- 禁止没有回滚入口就进入正式发布。

