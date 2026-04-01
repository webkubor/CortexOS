---
name: r2-uploader-skill
description: 生产级 Cloudflare R2 图床上传与分发技能。用于一键同步本地图片/素材到 img.webkubor.online，并自动生成公网直链。
---

# R2 图床上传技能 (Production-Grade)

此技能是您 `img.webkubor.online` 资产体系的唯一核心入口。

当用户要求执行以下操作时使用：
- **上传资产**：将本地图片、音视频或设计素材同步到 R2 存储桶。
- **生成直链**：上传后自动产出 `https://img.webkubor.online/<文件名>` 格式的链接。
- **批量分发**：处理多张图片并返回 Markdown 或纯文本链接。

## 核心执行指令

直接调用母库中的 `lib/r2-uploader.js`：
```bash
node $SKILL_PATH/lib/r2-uploader.js <本地路径> [自定义名称]
```

## 核心工作流

### 1. 自动执行上传
- 识别文件类型（图片、视频、音频）。
- 调用 `lib/r2-uploader.js` 进行 Native Fetch 直连上传。

### 2. 返回标准化直链
- 强制使用主域名：`https://img.webkubor.online/`。
- 确保输出结果直接可用于 Markdown 或社交媒体分享。

### 3. 安全与权限
- 本技能已集成 Cloudflare API 凭证，存储于私有仓库中。
- **红线**：禁止向外部泄露 `r2-uploader.js` 中的 API Token。

## 维护守则
- **单源真理**：本目录（`Desktop/skills/arsenal/image-hosting-skill`）是代码母库。
- **软链接同步**：`~/.agents/skills/r2-uploader` 已软链接至此，修改此处代码即全局生效。
