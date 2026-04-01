---
title: AI前端项目技术基线
type: development-baseline
status: active
scope: project
domain: frontend
updated: '2026-03-10'
tags:
  - development-standard
  - frontend
  - ai
  - baseline
  - project
---
# AI前端项目技术基线

## 定位
这是一份面向新项目的开发细节基线，用来回答“当项目没有明确约束时，AI 应该怎么起项目、选依赖、写代码、组织 API 层、请求层、路由层、状态层、单文件组件和目录结构”。

它不是全局前端规范的替代品，而是对 [[AI前端开发规范]] 的项目级补充。

## 默认项目基线
当项目没有明确约束时，统一采用：
- 包管理器：`pnpm`（强制首选）
- 框架：`Vue 3`
- 构建工具：`Vite`
- 语言：`TypeScript`
- 样式：`SCSS`
- 路由：`vue-router`
- 状态管理：`pinia`
- 工具库：`@vueuse/core`
- 网络层：`ky` + 兼容封装
- API 组织：`src/api/*` + `src/utils/request.ts` 或等价双层结构
- 环境文件：`.env`、`.env.test`、`.env.production`
- 构建脚本：`build:test` / `build:prod`

## 依赖基线
### 强制基线依赖
- `vue`
- `vite`
- `typescript`
- `sass`
- `vue-router`
- `pinia`
- `ky`
- `@vueuse/core`

### 工程基线依赖
- `vue-tsc`
- `@vitejs/plugin-vue`
- `eslint`
- `eslint-plugin-vue`
- `vue-eslint-parser`
- `@typescript-eslint/parser`
- `@typescript-eslint/eslint-plugin`

### 场景依赖
- 图标场景：`@phosphor-icons/vue`
- 图表场景：`echarts`
- 剪贴板场景：`vue-clipboard3`
- 导出图片场景：`dom-to-image-more`
- 日期处理场景：`dayjs`
- 数据校验场景：`zod`
- 高精度数值计算场景：`bignumber.js`

### 依赖收口原则
- 基线之外的依赖按场景增补，不预先堆库
- 同类能力只保留一套实现，例如请求层、图表库、日期库不重复并行
- 大而全 UI 组件库仅在项目明确需要时引入

## 单文件组件顺序
统一使用以下顺序：
1. `<template>`
2. `<script setup lang="ts">`
3. `<style scoped lang="scss">`

说明：先看结构，再看逻辑，最后看样式，审查成本最低。

## 构建脚本与环境文件基线
- 默认脚本：`build:test` = `vite build --mode test`
- 默认脚本：`build:prod` = `vite build --mode production`
- 如果项目需要先做类型检查，允许扩展为 `vue-tsc -b && vite build --mode test` 和 `vue-tsc -b && vite build --mode production`
- 默认环境文件：`.env`、`.env.test`、`.env.production`
- `.env` 负责公共默认值；`.env.test` 和 `.env.production` 只覆盖环境差异项
- 新增环境变量时，必须核对三份 env 文件是否需要同步

## 代码风格
### 硬阈值约束 (200/500/8 准则)
**AI 必须严格遵守 [[AI前端开发规范]] 中的“代码膨胀与硬阈值约束”：**
- **单文件 SFC < 500 行**
- **Script Setup < 200 行**
- **状态变量 < 8 个**
- **复杂组件强制执行目录化：`index.vue` + `useLogic.ts` + `styles.scss`**
- **静态配置强制抽离至 `constants.ts`**

### 基础格式
- 规范：`StandardJS`
- 缩进：`2 spaces`
- 引号：`single quotes`
- 分号：`no semicolons`
- 命名：见名知意，禁止无语义缩写

### TypeScript
- 开启 `strict: true`
- 禁止滥用 `any`
- 公共返回值、组件 props、接口响应必须有明确类型
- 工具函数优先纯函数

### Vue
- 统一使用 `Composition API + <script setup>`
- 页面放 `views/`
- 可复用逻辑放 `composables/` 或 `lib/`
- 状态统一进 `stores/`
- 请求不直接散落在页面深处，统一走 API 层

### SCSS
- 变量统一走 `tokens.scss`
- 组件内只写当前组件样式
- 不允许每个组件重复引入全局变量
- 类名语义化，避免 `box1`、`box2` 这类命名

## API 层与请求层基线
参考收银台项目现状，默认采用双层分离：

### 1. API 层
- 路径：`src/api/*`
- 职责：按业务域组织接口，例如 `order.ts`、`pay.ts`
- 只负责组合接口路径、参数和返回类型
- 不负责协议兼容、鉴权头、统一报错、副作用提示

### 2. 请求层
- 路径：`src/utils/request.ts`、`src/lib/http/client.ts` 或等价路径
- 职责：统一创建 `ky` 实例
- 统一处理 `baseURL`、超时、语言头、鉴权头
- 统一处理响应解包、错误提示、旧协议兼容

### 3. 分层规则
- 页面和组件不直接调 `ky`
- 页面和组件只调用 `src/api/*` 导出的业务函数
- `src/api/*` 不直接写 UI 副作用
- 历史协议兼容，例如 `code === 200`、`msg === 'SUCCESS'`、`data` 包裹，统一收敛在请求层

### 4. 推荐返回方式
- API 层函数命名使用业务语义，例如：`fetchOrder`、`confirmPromptPay`
- API 层导出明确返回类型
- 请求层返回统一结构，避免页面里到处判断 `res.code` 和 `res.msg`

## Manager 风格整合
参考 `tarspay/manager` 现有结构，可继承的模式如下：

### 1. 业务域拆分
- `src/api/*` 按业务域拆分，不做“大一统 api.ts`
- `src/stores/*` 按业务域拆分，不做单一超级 store
- `src/views/*` 按业务域拆分页面目录
- `src/router/index.ts + children.ts` 分离根路由和子路由表

### 2. 路由 meta 承载业务语义
`manager` 的做法值得保留：
- `meta.title`
- `meta.auth`
- `meta.country`
- `meta.menuKey`
- `meta.keepAlive`

新项目如果存在国家、权限、菜单映射，同样建议统一放在 route meta，而不是分散在页面组件里。

### 3. Store 负责全局运行态
参考 `manager/src/stores/user.ts`：
- 用户信息
- 权限 ID
- 当前国家
- 菜单树
- 首路由
- 全局标题/图标联动

这说明 store 不只是存表单状态，更适合承接“运行期全局上下文”。新项目可按此思路组织，但要加强类型约束。

### 4. 请求层保留 manager 思路，升级实现
`manager` 现在的请求层在 `src/utils/fly.ts`，负责：
- 统一 baseURL
- 统一语言头
- 统一 token
- 统一国家码
- 统一报错
- 统一 401 失效处理
- 统一特殊错误码处理

这个思路要保留，但实现从 `flyio` 升级为 `ky` 兼容封装。

### 5. API 层职责不变
`manager` 的 `src/api/*` 已经证明这套模式有效：
- API 文件只暴露业务函数
- 页面不直接拼接口地址
- 请求层细节不泄漏到业务组件

新项目继续沿用这条规则。

## 新项目对 manager 风格的升级建议
- 保留：业务域目录拆分、route meta、store 组织、API 层与请求层分离
- 升级：包管理器统一到 `pnpm`
- 升级：请求层统一到 `ky`
- 升级：SFC 顺序统一为 `template -> script setup -> style`
- 升级：类型边界更严格，减少 `any`
- 升级：注释统一中文

## 网络层基线
- 新项目统一往 `ky` 兼容封装收敛，不新增 `axios`
- 请求统一通过请求层收口，再由 API 层对外暴露业务函数
- 错误处理、重试、鉴权、跳转、副作用必须收敛在统一层处理
- 如果项目存在旧协议，兼容逻辑统一写在请求层，不扩散到 API 层和业务组件
- 图表场景统一优先 `echarts`，不并行引入多套图表库
- 常用能力优先原生能力、`dayjs`、`zod` 与小型自写工具函数，新增依赖前先判断基线能力是否已覆盖

## 最低目录建议
```text
src/
├── api/
│   ├── auth.ts
│   ├── dashboard.ts
│   └── <domain>/
├── utils/
│   ├── request.ts
│   ├── url.ts
│   └── <shared-utils>.ts
├── router/
│   ├── index.ts
│   └── children.ts
├── stores/
│   ├── user.ts
│   └── <domain>/
├── styles/
├── views/
├── composables/
├── constants/
└── types/
```

## 基线验收
- `pnpm install` 成功
- `pnpm dev` 可启动
- `pnpm type-check` 通过
- `pnpm build` 通过
- `pnpm lint` 通过
- 页面不直接发请求，只调用 API 层
- API 层与请求层分离
- 路由业务语义统一放在 meta
- 单文件组件顺序统一
- 注释统一为中文

## 使用方式
- 新项目前先读这份基线
- 如果仓库已有成熟栈，以仓库现状优先
- 如果没有，按这份基线直接起项目
- 如果项目接近收银台或 manager 风格，优先复用这里的 API / store / router 分层
- 需要更细的工作区规则时，再在项目或工作区内加专项规范
