---
name: logo-designer
description: Vector Aesthetics Protocol for generating high-quality, proportionally-coordinated, modern aesthetic SVG logos. Does not depend on external drawing libraries - uses AI's SVG coding capabilities directly to output production-ready vector graphics. Use for website logos, App icons, Favicons, and brand identities.
license: Apache 2.0
---

# Logo Designer Skill (Vector Aesthetics Protocol)

本技能专注于生成 **高品质、比例协调、符合现代美学** 的 SVG Logo。不依赖外部绘图库，完全利用 AI 的 SVG 编码能力，直接产出生产级矢量图形。

## 🎯 适用场景

适用于：网站 Logo、App 图标、Favicon、品牌标识。

## 🚀 触发条件

当用户提出以下请求时自动激活：
- "设计一个 logo"
- "生成网站图标"
- "画个 svg logo"
- "帮我想个 logo 方案"

## 🎨 设计核心原则 (Design Principles)

在生成 SVG 代码前，必须在思维链中通过以下检查：

### A. 几何与构图 (Geometry & Composition)
- **黄金比例 (Golden Ratio)**: 在圆角、线宽、图形大小对比上，优先尝试 `1 : 1.618` 比例。
- **网格系统 (Grid System)**: 所有元素的坐标和尺寸应尽量对齐 `4px` 或 `8px` 网格格式，避免出现 `13.7px` 这种随意的小数。
- **视觉重心**: 确保图形的物理中心与视觉中心平衡，防止"头重脚轻"。
- **负空间 (Negative Space)**: 巧妙利用背景与前景的镂空关系，增加设计的呼吸感。

### B. 配色与风格 (Color & Style)
- **极简主义 (Minimalism)**: 遵循 "Less is More"。能用 2 个形状表达的，绝不用 3 个。
- **渐变趋势 (Modern Gradients)**: 避免原本的高饱和纯色平铺。适度使用 `<linearGradient>` 或 `<radialGradient>` 增加质感（如 Tech 风格的蓝紫渐变，Nature 风格的青绿渐变）。
- **深色模式适配 (Dark Mode)**: 考虑到 Logo 可能在深色背景下显示，避免使用纯黑 (`#000000`) 作为主色，或提供亮色描边版本。

### C. 技术规范 (Technical Specs)
- **ViewBox**: 统一使用标准的 `viewBox="0 0 512 512"` 或 `viewBox="0 0 1024 1024"`，方便缩放。
- **语义化标签**: 使用 `<title>` 和 `<desc>` 描述 Logo 内容，利于 SEO 和无障碍访问。
- **结构清晰**: 合理使用 `<g>` 分组，代码需缩进整齐。

### D. 背景处理 (Background Handling)
- **默认透明 (Transparent by Default)**: 除非用户明确要求（如"做成 App 图标样式"或"需要底色"），否则 SVG 默认**不应包含背景层**。
- **纯粹性**: Logo 应独立于背景存在，方便用户在不同环境（深/浅色模式、图片背景）中复用。

## 📋 标准化工作流 (Workflow)

### 步骤 1: 需求分析
询问或确认用户：
- **品牌名称** (Text)
- **核心隐喻** (Metaphor): 如 "云端"、"速度"、"链接"、"安全"。
- **风格偏好**: (极简/抽象/几何/手绘风/科技感)。
- **主色调**: (蓝/红/黑白/彩虹)。

### 步骤 2: 方案构思 (Think)
在输出代码前，先简述设计思路：
> "我将使用两个交错的圆形代表'链接'，采用 45 度角切分体现'速度'，配色使用电光蓝渐变体现科技感..."

### 步骤 3: 代码生成 (Implement)
直接输出一个完整的 SVG 代码块。

**通用模板参考**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <!-- 定义渐变 -->
    <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
    <!-- 定义阴影 (可选) -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
      <feOffset dx="4" dy="8" result="offsetblur" />
    </filter>
  </defs>

  <title>Brand Logo</title>

  <!-- 背景处理原则: 默认保持透明，不要添加背景 <rect> 标签，除非用户明确要求 -->
  <!-- <rect width="512" height="512" fill="#ffffff" rx="128" /> -->

  <!-- 主体图形 -->
  <g filter="url(#softShadow)">
    <!-- 示例：一个黄金比例的圆 -->
    <circle cx="256" cy="256" r="158" fill="url(#mainGradient)" />
    <!-- 示例：文字/符号 -->
    <path d="M..." fill="#ffffff" />
  </g>
</svg>
```

### 步骤 4: 保存与交付 (Save & Deliver)
自动调用 `write_file` 将 SVG 保存到用户指定的路径（默认为 `public/logo.svg`）。

**建议**: 提醒用户可以使用在线工具 (如 svgomg) 进一步压缩代码。

## 🎨 常见设计模式库 (Patterns)

AI 应熟练运用以下模式：

- **首字母变形**: 将 "A" 变成火箭，将 "S" 变成河流。
- **负空间隐藏**: 在图形内部镂空出具体含义（如 FedEx 的箭头）。
- **几何抽象**: 用三角形代表稳定/山峰，圆形代表包容/全球，方形代表科技/基石。
- **黄金分割切图**: 比如 Twitter 的鸟，完全由不同直径的圆相切而成。

## ✅ 验收标准

- [ ] SVG 代码无语法错误，浏览器可直接打开。
- [ ] 缩放到 32px (Favicon) 时依然清晰可辨。
- [ ] 颜色对比度符合 WCAG AA 标准。
- [ ] 必须检查: 是否错误地添加了背景色？（如有则删除）。
- [ ] 这一步生成的图形是否真的"好看"？(Self-Correction)
