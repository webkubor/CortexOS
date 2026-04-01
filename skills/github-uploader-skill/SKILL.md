---
name: github-uploader-skill
description: 生产级 GitHub 图床上传与 jsDelivr CDN 分发技能。用于将项目文档插图同步至 webkubor/upic-images，并生成极速 CDN 直链。
---

# GitHub 图床上传技能 (Production-Grade)

此技能是您项目文档、配置片段及轻量级资产的默认上传通道。

当用户要求执行以下操作时使用：
- **上传文档插图**：将本地图片同步到 GitHub 仓库。
- **生成 CDN 链接**：上传后自动产出 jsDelivr CDN 直链（国内访问极快）。
- **轻量级素材分发**：处理不适合入 R2 的小文件或公开素材。

## 核心执行指令

直接调用母库中的 `lib/github-uploader.js`：
```bash
node $SKILL_PATH/lib/github-uploader.js <本地路径> [远程文件名]
```

## 核心工作流

### 1. 自动执行上传
- 默认上传至仓库：`webkubor/upic-images`。
- 远程路径固定为：`assets/` 目录下。

### 2. 返回标准化直链
- 默认返回 jsDelivr CDN 链接：`https://cdn.jsdelivr.net/gh/webkubor/upic-images@main/assets/<文件名>`。
- 同时提供 Raw 链接作为备份。

### 3. 安全与权限
- 本技能已集成 GitHub Personal Access Token。
- **红线**：禁止将此 Token 泄露给任何非受信进程。

## 维护守则
- **单源真理**：本目录（`Desktop/skills/arsenal/github-uploader-skill`）是代码母库。
- **软链接同步**：`~/.agents/skills/github-uploader` 已软链接至此，修改此处代码即全局生效。
