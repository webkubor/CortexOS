# KIP-01: CortexOS 知识入库协议 (KIP)

> 版本: 1.0.0
> 属性: Public (开源资产)

## 1. 宗旨
所有存入 CortexOS 及其外部大脑 (memory/knowledge) 的内容必须经过语义化整理。禁止无脑堆砌原始对话记录或长篇网页剪藏。

## 2. 存储分层 (Hierarchy: 生、熟、干)
- **/memory/knowledge/raw/** (生数据): 
  - **定位**: 灵感中继站、知识杂物舱。
  - **内容**: 网页剪藏、原始对话、未整理的灵感、长篇素材。
  - **处理**: AI 定期扫描，识别价值内容并提示“熟化”。
- **/memory/knowledge/refined/** (熟知识): 
  - **定位**: 个人精华智库。
  - **内容**: 经过 AI 提取、去重、标准化后的笔记。必须包含元数据。
  - **要求**: 扁平化存储，禁止超过两层的深层嵌套。
- **/CortexOS/docs/rules/** (干协议/Actionable): 
  - **定位**: 核心指令集。
  - **内容**: 验证过的 SOP、协议、开源标准。可直接被 Agent 调用。

## 3. 必填元数据 (Standard Frontmatter)
所有 .md 文件头必须包含：
```markdown
---
title: {{简短标题}}
date: {{YYYY-MM-DD}}
tags: [{{分类标签}}]
status: raw | refined | actionable
source: {{来源: chat/web/thought}}
---
```

## 4. AI 审计职责 (Auditor Role)
- **去重**: 发现相似内容时，必须提示用户进行合并。
- **关联**: 入库时必须检查并建立 [[双链]]。
- **精简**: 自动总结 200 字以内的 TL;DR。

---
*签署: CortexOS Central Command*
