---
title: AI Team 大面板
description: CortexOS AI Team 独立态势大面板
layout: page
sidebar: false
aside: false
outline: false
pageClass: team-dashboard-page
---

<script setup>
import FleetDashboard from '../.vitepress/theme/components/FleetDashboard.vue'
import TeamCommandDeck from '../.vitepress/theme/components/TeamCommandDeck.vue'
</script>

<style>
/* 🔴 强行杀死 VitePress 文档 UI，实现全屏沉浸 */
.team-dashboard-page .VPNav,
.team-dashboard-page .VPFooter,
.team-dashboard-page .VPLocalNav {
  display: none !important;
}

.team-dashboard-page .VPContent {
  padding-top: 0 !important;
  background: #000 !important;
}

.team-dashboard-page .VPCentere,
.team-dashboard-page .container {
  max-width: 100% !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 强制 Body 溢出隐藏，像个真正的 App */
html.team-dashboard-page,
body.team-dashboard-page {
  overflow: hidden !important;
  background: #000 !important;
}
</style>

<div class="immersive-wrapper">
  <TeamCommandDeck />
  <FleetDashboard />
  
  <!-- 返回文档的悬浮入口，避免压住中枢头部 HUD -->
  <a href="/CortexOS/" class="back-to-docs">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    返回文档
  </a>
</div>

<style scoped>
.immersive-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
  position: relative;
  overflow: hidden;
}

.back-to-docs {
  position: fixed;
  left: 28px;
  bottom: 28px;
  z-index: 120;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.88));
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 14px;
  border-radius: 999px;
  color: rgba(226, 232, 240, 0.78);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.78);
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.back-to-docs:hover {
  transform: translateY(-1px);
  border-color: rgba(103, 232, 249, 0.28);
  background:
    linear-gradient(135deg, rgba(8, 47, 73, 0.96), rgba(15, 23, 42, 0.9));
  color: #fff;
}

.back-to-docs svg {
  width: 13px;
  height: 13px;
}

@media (max-width: 960px) {
  .back-to-docs {
    left: 16px;
    right: 16px;
    bottom: 16px;
    justify-content: center;
  }
}
</style>
