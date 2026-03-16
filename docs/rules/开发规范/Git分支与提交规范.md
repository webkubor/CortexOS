---
title: Git分支与提交规范
type: development-standard
status: active
scope: global
domain: frontend
updated: '2026-03-13'
tags:
  - development-standard
  - frontend
  - git
  - workflow
---
# Git 分支与提交规范

## 定位
本文档定义前端团队的 Git 分支模型、命名规则、提交信息格式和合并流程。
适用范围：所有前端项目，包括收银台各子项目。

与 [[AI前端开发规范]] 的关系：本文档补充其"质量门禁"章节，定义代码进入发布链路前的 Git 操作规范。

---

## 仓库配置：强制大小写敏感

为了避免因文件名大小写问题（例如 `Component.vue` vs `component.vue`）导致 Git 在不同操作系统（macOS/Windows vs Linux）上行为不一致，所有开发者必须在克隆仓库后，立即执行以下命令，将仓库配置为大小写敏感：

```bash
git config core.ignorecase false
```

**AI 约束**：AI 在开始任何编码工作前，必须先确认该配置已生效。如果发现 `git config core.ignorecase` 返回 `true` 或未设置，必须先执行上述命令，再进行后续操作。

---

## 分支模型

### 主干分支（长期存在，禁止直接 push）

| 分支名 | 对应环境 | 说明 |
|--------|---------|------|
| `main` | 生产环境 | 只接受来自 `release/*` 或 `hotfix/*` 的合并，打 tag 后部署 |
| `develop` | 测试环境 | 功能开发的集成主线，CI 自动部署测试环境 |

### 短生命周期分支（完成后必须删除）

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feature/` | 新功能开发 | `feature/pk-add-payment-channel` |
| `fix/` | 非紧急 bug 修复 | `fix/th-countdown-display-error` |
| `hotfix/` | 生产紧急修复 | `hotfix/bd-amount-calc-wrong` |
| `refactor/` | 重构（不改功能） | `refactor/extract-use-payment-flow` |
| `chore/` | 配置、依赖、脚本类 | `chore/upgrade-vite-5` |

### 分支命名规则

```
<前缀>/<国家码（可选）>-<简短描述（kebab-case）>
```

- 全小写，用 `-` 连接，禁止用下划线或空格
- 描述部分不超过 40 个字符
- 多国家项目在描述前加国家码前缀：`bd` / `pk` / `th`
- 禁止使用 `test`、`temp`、`new`、`fix2` 等无语义命名

---

## 标准开发流程

```
develop
  │
  ├─ checkout ──► feature/xxx
  │                    │
  │                    │（开发、本地自测）
  │                    │
  │               push + PR
  │                    │
  │◄── merge（Squash）─┘
  │
  ├─ CI 自动部署测试环境
  │
  ├─ checkout ──► release/x.x.x（发布准备）
  │                    │
  │                    │（回归测试）
  │                    │
main ◄──── merge ──────┘
  │
  └─ 打 tag v x.x.x，部署生产
```

### 生产紧急修复流程

```
main ──► checkout ──► hotfix/xxx
                           │
                           │（修复 + 本地验证）
                           │
              PR ──► main（直接合入生产）
                           │
                           └──► develop（同步回开发线，避免修复丢失）
```

---

## 提交信息格式

### 结构

```
<类型>(<范围>): <描述>

[可选正文]

[可选脚注]
```

### 类型（type）

| 类型 | 含义 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(支付): 新增 JazzCash 渠道` |
| `fix` | Bug 修复 | `fix(倒计时): 修复 Safari 下时间显示异常` |
| `refactor` | 重构（不改功能） | `refactor(支付流程): 提取 usePaymentSubmit composable` |
| `style` | 样式调整（不影响逻辑） | `style(结账页): 对齐移动端底部按钮间距` |
| `perf` | 性能优化 | `perf(订单列表): 虚拟滚动替换全量渲染` |
| `test` | 测试相关 | `test(金额计算): 补充边界用例` |
| `docs` | 文档/注释 | `docs(请求层): 补全函数头注释` |
| `chore` | 构建/依赖/配置 | `chore: 升级 vite 到 5.4` |
| `revert` | 回滚 | `revert: feat(支付): 新增 JazzCash 渠道` |

### 范围（scope）

用括号标注受影响的功能模块或国家，可选但推荐填写：

```
feat(pk-支付): ...      # 巴基斯坦支付模块
fix(bd-订单): ...       # 孟加拉订单模块
chore(构建): ...        # 构建相关
```

### 描述规则

- **中文**，动词开头，简洁说明"做了什么"
- 不超过 50 个汉字
- 末尾不加句号
- 禁止写"修改了一些东西""更新代码""fix bug"等无信息量描述

### 正文（可选，但以下情况必须写）

- 本次改动涉及金额/支付核心逻辑
- 有已知风险或已知不兼容项
- 关联了需求单号或 bug 单号

```
feat(th-支付): 新增 TrueMoney 渠道

TrueMoney 只在泰国上线，通过 meta.country === 'th' 控制路由可见性。
接口新增 channel=truemoney 参数，响应结构与现有渠道一致。

关联需求: PAY-2341
```

### 完整示例

```
# 新功能
feat(pk-支付): 新增 EasyPaisa 渠道入口

# Bug 修复
fix(倒计时): 修复订单超时后倒计时不停止的问题

# 重构
refactor(请求层): 将错误拦截从各 API 文件收敛到 request.ts

# 有风险的改动（必须写正文）
fix(bd-金额): 修正手续费四舍五入计算逻辑

旧逻辑使用原生 JS 浮点运算，存在精度丢失风险。
本次改用 bignumber.js，影响范围：BD 所有支付渠道的手续费展示。
已在测试环境验证三个主流渠道，回滚方式：git revert <commit-hash>。

关联 bug: PAY-1892
```

---

## PR（合并请求）规范

### 何时创建 PR

- 所有代码合入 `develop` 或 `main` 必须通过 PR，禁止直接 push 主干

### PR 标题

与 commit 描述格式一致：`<类型>(<范围>): <描述>`

### PR 描述模板

```markdown
## 改动说明
- 改了什么，为什么改

## 影响范围
- 涉及的页面/组件/接口

## 验证方式
- [ ] 本地验证主流程
- [ ] 测试环境验证
- [ ] 边界/异常场景确认

## 风险说明
- 无 / 或具体说明
```

### 合并方式

| 场景 | 合并方式 | 说明 |
|------|---------|------|
| `feature/*` → `develop` | Squash merge | 多个调试 commit 压缩为一条，保持主线整洁 |
| `hotfix/*` → `main` | Merge commit | 保留完整历史，便于事后追查 |
| `hotfix/*` → `develop` | Cherry-pick | 只同步修复内容，不带主干多余提交 |
| `release/*` → `main` | Merge commit | 打 tag，保留完整发布记录 |

---

## 禁止事项

- 禁止向 `main` / `develop` 直接 push
- 禁止在主干分支上提交 `WIP`、`临时`、`test` 等调试性 commit
- 禁止一个 PR 同时包含多个不相关的功能改动
- 禁止 PR 合并后不删除对应的功能分支
- 禁止提交信息写"修改""更新""fix"等无上下文的描述
- 禁止 `hotfix` 只合入 `main` 而不同步回 `develop`

---

## 与版本记录的关系

- `main` 每次合并后必须打 tag，tag 名与 `package.json` version 保持一致
- tag 打完后更新 [[版本记录模板]] 对应的发布记录
- CHANGELOG 在 PR 合并时同步更新，不在发布时补写
