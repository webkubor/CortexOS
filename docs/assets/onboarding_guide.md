# 🛠 技能包初始化与配置指南 (Onboarding & Config)

> **定位**: 本文件定义了如何从零初始化老爹的 11 大专家系统，并配置核心凭证路径。

---

## 🚀 1. 快速安装 (Quick Install)
所有技能包均可通过以下命令一键安装。建议优先安装 **Brain Sentinel** 和 **Code Aureate**。

| 技能名称 | 安装命令 |
| :--- | :--- |
| **全平台分发** | `gemini skills install https://github.com/webkubor/omni-publisher-skill` |
| **AI 原生改造** | `gemini skills install https://github.com/webkubor/gemini-skill-ai-native` |
| **大脑哨兵** | `gemini skills install https://github.com/webkubor/brain-sentinel-expert` |
| **图床分发** | `gemini skills install https://github.com/webkubor/file-hosting-expert` |
| ... | *(其余链接见 [skills_index.md](./skills_index.md))* |

---

## 🔑 2. 核心凭证配置 (Critical Secrets)
技能包运行依赖于 `docs/secrets/` 目录下的物理文件。请确保以下文件已就绪：

### A. 图床分发专用 (`hosting_credentials.md`)
**路径**: `docs/secrets/hosting_credentials.md`
**模板**:
```markdown
### ☁️ Cloudflare R2 Config
- R2_UPLOAD_URL: "https://your-worker.workers.dev"
- R2_AUTH_TOKEN: "your-secret-token"

### 🐙 GitHub Hosting Config
- GH_REPO: "webkubor/assets-hosting"
- GH_TOKEN: "ghp_xxxxxxxxxxxx"
```

### B. 哨兵报警专用 (`lark.env`)
**路径**: `docs/secrets/lark.env`
**模板**:
```bash
LARK_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
```

---

## 🔄 3. 维护流程 (Maintenance SOP)
1. **上线巡检**: 执行 `npm run check-update` 确认本地专家版本。
2. **热更新**: 若发现更新，执行 `npm run update` 实现无感升级。
3. **打包备案**: 修改专家内核后，必须执行 `npm run package` 并推送到 GitHub。

---
*Last Updated: 2026-02-28*
