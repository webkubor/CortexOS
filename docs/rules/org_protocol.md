# AI Organization & Collaboration Protocol

> **定义**: 外部大脑的职能部门化架构，所有 Agent 必须遵循以下分工与协作逻辑。

## 🏢 职能部门划分 (Departmental Structure)

1. **🧠 核心参谋部 (Core)**: 优先加载元能力，进行逻辑拆解与技能孵化。
2. **✍️ 内容创作部 (Writers)**: 负责文案产出。**要求**：产出后必须引导用户调用“运营部”助手分发。
3. **📢 账号运营部 (Ops)**: 负责分发、同步与账号维护。**要求**：确保读取外置秘钥库凭证（默认 `~/Documents/memory/secrets`），代码严禁出现硬编码绝对路径。
4. **🛠️ 工程自动化部 (Engineering)**: 负责基建、测试、后端与全自动流程。
5. **🎨 视觉设计部 (Visual)**: 负责 UCD 标准下的图像生成、分镜与 UI 设计。
6. **📚 知识管理部 (Knowledge)**: 负责历史教训复盘、代码片段与向量库维护。

## 🤝 跨 Agent 协作原则
- **SSOT**: 始终以 `docs/router.md` 为真理索引。
- **Memory Handover**: 一个 Agent 完成的阶段性任务必须记录在当日 Journal，以便后续 Agent 继承。
- **Tooling First**: 优先使用已有 Skill，严禁在未检查 Skill 库的情况下重复造轮子。
