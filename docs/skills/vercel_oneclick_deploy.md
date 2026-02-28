---
name: vercel-oneclick-deploy
description: 高级 Vercel 一键部署技能。自动处理 Vercel 登录校验、项目关联 (link)、生产环境部署 (--prod) 以及 Git 自动同步 (push)。
---

# 🚀 Vercel 一键部署大师 (Vercel One-Click Deploy)

这是由小烛 (Candy) 为老爹 (webkubor) 定制的 Vercel 自动化部署 SOP。它将“代码构建、云端发布、版本同步”这三者合而为一。

## 🛠 核心能力 (Capabilities)

1.  **身份智能校验**: 自动执行 `npx vercel whoami` 确认登录状态。
2.  **静默关联 (Zero-Config Link)**: 如果项目未关联，自动执行 `npx vercel link --yes`。
3.  **生产发布 (Production Ready)**: 默认执行 `npx vercel --prod --yes`，确保发布的是最新生产版本。
4.  **Git 自动同步 (Git Bridge)**: 部署成功后，自动执行 `git add . && git commit -m "chore: deploy to vercel" && git push`（如有变更）。

## 📖 操作指南 (Operational Guide)

当老爹要求“部署到 Vercel”或“上线项目”时，Agent 应遵循以下流程：

### 1. 环境准备与配置检查
- 检查 `package.json` 或 `vercel.json` 是否存在。
- 确认本地已安装 Vercel CLI (`npx vercel`)。

### 2. 执行部署流程 (Standard SOP)
Agent 应当按照以下顺序操作：
- **登录检查**: `npx vercel whoami`
- **关联检查**: 如果 `./.vercel` 不存在 -> `npx vercel link --yes`
- **核心发布**: `npx vercel --prod --yes`
- **Git 同步**: 
  - `git status --porcelain` 检查是否有待提交代码。
  - 若有，则 `git add . && git commit -m "chore: deploy to vercel" && git push`。

### 3. 获取并反馈结果
- 提取 Vercel 返回的 **Production URL**。
- 向老爹汇报：“老爹，代码已经同步到 Git 并成功推送到 Vercel 了！🚀 [URL]”

## ⚠️ 避坑指南 (Troubleshooting)

- **Auth Failed**: 如果提示未登录，请老爹执行 `npx vercel login`。
- **Build Errors**: 部署前确保本地 `npm run build` 通过。
- **Git Push Failed**: 如果远程分支有冲突，需要手动拉取 (`git pull`) 后再试。

---
*Created by Candy (小烛) for webkubor (老爹)*
*Last Updated: 2026-02-28*
