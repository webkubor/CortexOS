---
description: 外部大脑的职能部门化扩展能力，按角色定义 AI Agent 的专业技能。
---
# 扩展能力 (Extensions) - AI 公司职能架构版

这里汇集了 AI Common 的所有专项技能扩展。按照职能部门分类，实现“创作-运营-工程”全链路闭环。

## 🧠 核心参谋部 (Core Capabilities)

负责逻辑分析、技能孵化与全局协议。

- [深度思考 (Think)](./core/think-skill.md) - 苏格拉底式分析。
- [技能孵化器 (Skill Creator)](./core/skill-creator.md) - 开发新技能。
- [通用能力协议 (Common Manifest)](./core/common_manifest.md) - 基础行为准则。

## 📢 账号运营部 (Account Ops)

负责内容的分发、同步与账号维护。

- [GitHub 运营助手](./ops/github.md) - 仓库与社区维护。
- [GitLab 管理员](./ops/gitlab.md) - 流水线与仓库管理。

## 🛠️ 工程与自动化部 (Engineering)

负责基建、后端与全自动流程。

- [图床大师 (Image Hosting)](./engineering/image-hosting-master.md) - 全自动资产分发。

## 📚 知识管理部 (Knowledge)

负责历史教训复盘与碎片资产管理。

- [自动复盘 (Auto Retro)](./knowledge/auto-retro.md) - 定期归档与经验提取。
- **ChromaDB (本地 RAG)** - 向量库检索与自动化入库 (通过 `scripts/ingest/` 维护)。
- [碎片知识管家](./knowledge/snippet_master.md) - 代码片段与配置备忘。
