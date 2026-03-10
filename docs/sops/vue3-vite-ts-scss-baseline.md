# Vue 3 + Vite + TypeScript + SCSS 基线 SOP

> 适用场景：新建 AI 原生前端项目。
> 统一基线：`Vue 3 + Vite + TypeScript + SCSS`
> 强制约束：`pnpm` 为唯一包管理器；新网络层优先往 `ky` 兼容封装收敛。

## 1. 必选技术栈

- 框架：Vue 3（Composition API + `<script setup>`）
- 构建：Vite
- 语言：TypeScript（`strict: true`）
- 样式：SCSS
- 包管理器：pnpm
- 路由：Vue Router
- 状态管理：Pinia
- 工具库：VueUse
- 网络层：Ky + 项目兼容封装

## 2. 不允许漂移的规则

- 不允许在同一仓库混用 `npm` / `yarn` 生成锁文件
- 不允许直接在业务组件里散落 `fetch` / `axios`
- 不允许每个页面自定义一套接口错误处理
- 不允许在组件内重复手动引入全局样式变量
- 不允许把 AI 协作文档散落在根目录，统一收口到 `.agent/`

## 3. 推荐目录结构

```text
.
├── .agent/
│   ├── PROJECT.md
│   ├── MODULE_INDEX.md
│   ├── DESIGN_SYSTEM.md
│   ├── plans/
│   └── reviews/
├── src/
│   ├── lib/http/
│   ├── router/
│   ├── stores/
│   ├── styles/
│   └── views/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 4. 初始化命令

```bash
pnpm create vite my-app --template vue-ts
cd my-app
pnpm add vue-router pinia @vueuse/core ky
pnpm add -D sass vue-tsc @vitejs/plugin-vue typescript eslint eslint-plugin-vue vue-eslint-parser @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-standard-with-typescript eslint-plugin-import eslint-plugin-n eslint-plugin-promise
```

## 5. 网络层基线

### 5.1 统一入口

所有请求统一从 `src/lib/http/client.ts` 进入：
- 统一 `baseURL`
- 统一超时
- 统一鉴权头
- 统一语言头
- 统一业务响应解包
- 统一错误提示

### 5.2 兼容封装原则

如果旧项目已有 `code === 200`、`msg === 'SUCCESS'`、`data` 包裹等历史协议，不改业务层判断，统一在 Ky 封装里兼容掉。

目标是：
- 业务组件只拿到干净数据
- 旧协议兼容逻辑只存在一处
- 后端协议切换时只改一层

## 6. SCSS 基线

- `src/styles/tokens.scss`：颜色、间距、圆角、阴影、z-index 变量
- `src/styles/index.scss`：reset、根节点、全局语义类
- 通过 `vite.config.ts` 的 `additionalData` 全局注入 tokens
- 组件内只写 scoped SCSS，不重复 import tokens

## 7. AI 协作文档基线

每个项目必须包含：
- `.agent/PROJECT.md`：项目总览
- `.agent/MODULE_INDEX.md`：模块职责图
- `.agent/DESIGN_SYSTEM.md`：视觉与交互规则
- `.agent/plans/`：任务计划
- `.agent/reviews/`：任务复盘

## 8. 验收清单

- `pnpm install` 成功
- `pnpm dev` 可启动
- `pnpm type-check` 通过
- `pnpm build` 通过
- `pnpm lint` 通过
- 网络请求全部经 `src/lib/http/client.ts`
- `.agent/` 目录完整

## 9. 模板入口

现成模板目录：`templates/vue3-vite-ts-scss/`（仓库根目录）
