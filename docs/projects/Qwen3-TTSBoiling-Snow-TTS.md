---
title: Qwen3-TTSBoiling-Snow-TTS 项目档案
type: AI Voice Engine (Python/Qwen3-TTS)
repo: /Users/webkubor/Desktop/create/Qwen3-TTSBoiling-Snow-TTS
---
# 🎙 Qwen3-TTSBoiling-Snow-TTS

## 项目定义
一个面向影视化中文配音的 AI 语音工程，核心支持三类任务：声音克隆、音色设计、对话拼接。

## 核心价值 (The Vibe)
- **影视化表达**: 强调起承转合、气口、反应停顿与场景缝合。
- **配置收敛**: 运行态仅保留 `clone/design/dialogue + personas` 四类核心 JSON。
- **命名强约束**: 参考音频统一命名 `assets/reference_audio/<角色名>_参考.<ext>`，避免临时文件污染流程。

## AI 初始化状态
- **Router 挂载**: 已通过 `$start` 接入 AI_Common 懒加载路由。
- **项目挂牌**: 已接入舰队编排板，支持多 Agent 冲突规避。
- **执行入口**: `python3 main.py clone|design|dialogue`。

## 维护手册
- **主流程**: `main.py` + `core/modes/*`
- **规范**: 遵循 `AI_Common/docs/rules/webkubor_vibe_manifesto.md`
- **记忆沉淀**: 关键演进同步写入 `AI_Common/docs/memory/logs/`
