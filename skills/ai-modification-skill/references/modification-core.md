# 🛡️ AI Modification Common: 通用准则 (Base Layer)

## 🛡️ 核心合规 (Compliance)
- **文件备份**: 在执行大规模代码注入或文件删除前，必须确认用户已进行 Git 提交或手动备份。
- **敏感信息屏蔽**: 严禁在 `llms.txt` 或 `webmcp.json` 中暴露密钥、内网 IP 或 PII 信息。

## ⚖️ 事实对齐 (Project Context)
- **环境嗅探**: 在执行改造前，必须识别项目使用的技术栈（React, Vue, Vite, Webpack 等）。
- **路径重映射**: 自动识别 `public/` 目录相对于根目录的位置，确保 `.well-known/` 路径准确。

## 📂 资产规范 (Asset Protocol)
- **依赖注入**: 如果项目需要 `dom-to-image-more` 等第三方库，必须通过 `npm` 或 `pnpm` 完成安装，严禁裸写外链。
- **DoD (完工定义)**: 在改造结束后，必须运行 `npm run dev` 或 `npm run build` 进行联调验证。
