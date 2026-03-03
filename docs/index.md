---
layout: doc
---

<script setup>
import FleetDashboard from './.vitepress/theme/components/FleetDashboard.vue'
</script>

<div class="command-center-wrapper">
  <FleetDashboard />
</div>

---

## 🛰️ 快速指令 (Quick Ops)

| 意图 | 命令 | 目标 |
| :--- | :--- | :--- |
| **新兵入队** | `pnpm run fleet:claim` | 注册任务、物理路径与 Agent 别名 |
| **状态同步** | `pnpm run fleet:sync-dashboard` | 刷新看板动效与客观进度 (TODO.md) |
| **队长移交** | `pnpm run fleet:handover` | 切换 0 号机指挥权 |
| **健康门禁** | `pnpm run health:gate` | 扫描大脑结构与索引完整性 |
| **功能总表** | `/guide/feature-matrix` | 查看全部命令与 MCP Tool |

---

## 🧠 意识架构 (Exocortex)

- **[路由总览](/router)**：大脑宪法与真理入口。
- **[规则中心](/rules/)**：工程规范与审美红线。
- **[技能资产](/skills/)**：多智能体协作能力库。
- **[Agent 配置](/agents/)**：主流 Agent 的配置文件位置与接入方式。
- **[关于主理人](/about)**：CortexOS 设计哲学。

<style>
.command-center-wrapper {
  margin: -24px -24px 0 -24px;
}
.vp-doc h1 { display: none; }
</style>
