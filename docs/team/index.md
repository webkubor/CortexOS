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
  
  <!-- 返回文档的极简悬浮按钮 -->
  <a href="/CortexOS/" class="back-to-docs">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    BACK_TO_HQ
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
  bottom: 24px;
  right: 24px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 4px;
  color: #64748b;
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.back-to-docs:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.back-to-docs svg { width: 12px; height: 12px; }
</style>
