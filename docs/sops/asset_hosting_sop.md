# ☁️ 资产存储与 CDN 分发 SOP (Asset Hosting SOP)

## 1. 目标

统一 AI 面对“上传图片/文件”、“图床”、“CDN 分发”、“推流素材”需求时的决策逻辑。

## 1.5 关键词触发 (Triggers)

- **中文关键词**: 图床、上传图片、CDN 链接、分发素材、推流。
- **English Keywords**: Image hosting, upload asset, CDN distribution, hosting link.

## 2. 核心工具链 (Tools)

- **GitHub 图床 (Default)**:
  - **命令**: `node /Users/webkubor/.agents/skills/github-uploader/upload.js <路径>`
  - **仓库**: `webkubor/upic-images`
  - **优势**: jsDelivr CDN 分发，适合轻量级图片、文档。

- **R2 存储 (Media)**:
  - **命令**: `node /Users/webkubor/.agents/skills/r2-uploader/upload.js <路径>`
  - **桶名**: `images`
  - **优势**: 无容量上限，适合 wide-aspect 电影参考图、超大视频或不宜入 Git 的隐私资产。

## 3. 决策矩阵 (Decision Matrix)

AI 必须根据以下规则自主判断，禁止询问“用哪一个”：

| 资产类型 | 推荐通道 | 理由 |
| :--- | :--- | :--- |
| **项目文档插图** | **GitHub** | 与文档伴生，CDN 访问极快。 |
| **21:9 电影质量参考图** | **R2** | 避免仓库体积快速膨胀，保持 Git 整洁。 |
| **临时演示视频/音频** | **R2** | 灵活分发，无惧 GitHub 大文件策略。 |
| **代码/配置片段** | **GitHub** | 语义化管理。 |

## 4. 执行规范 (AI Directive)

1. **自动感知**: 识别文件扩展名与上下文意图。
2. **静默执行**: 选定通道后直接调用对应脚本。
3. **闭环反馈**: 直接返回 `🔗 公网直链` 给老爹。

## 5. 维护规范

- 定期检查 `~/.agents/skills/r2-uploader/upload.js` 是否与 Worker 逻辑对齐。
- 图片分发主域名：`img.webkubor.online` (R2) / `cdn.jsdelivr.net` (GitHub)。

### Metadata

*Created: 2026-03-06 | By Gemini (CortexOS Integration)*
