---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

### 核心流派：Premium Modern Style (高级现代风格)
> 这是我们最为推崇且首选的设计流派体系，它脱胎于“Aureate（鎏金）”流派但褪去了对金色的绑定，提倡极客、高级与现代感。它包含六大不可动摇的黄金原教旨：
1. **HSL 情绪调音深色/多态系统**: 抛弃内联的静态 Hex 色彩及单色绑定。建立基于 `:root` 的 HSL 设计令牌 (Design Tokens)。系统应具备高度自适应性，主色彩应通过调整 `H`(色相)无缝切换，而 `S/L` 调色板保持深邃。
2. **高保真玻璃拟物态体系 (Glassmorphism)**: 抵制平庸的厚重色块，用多层级的高斯模糊 (`backdrop-filter: blur(16px)`)、低频柔和光遮罩、极细的高光描边 (`border: 1px solid rgba(255, 255, 255, 0.1)`) 来构建悬浮层级深度。
3. **高信噪比排版 (High SNR Typography)**: 字体应当充满质感。严控字体层级与种类，增强不同 Weight 之间的对比。用巨量的「负空间」来引导呼吸和视线，杜绝为填补空白而使用的无效边框与分割线。
4. **三维空间感与悬浮景深 (3D Spatial Interaction)**: 对象不仅在画板平面排布，更要在 Z 轴分布。使用多层叠合 (`box-shadow`)、悬浮放大及位移变换 (`translateZ`, `scale`) 构建强烈的景深立体感。
5. **微交互发动机 (Micro-Interaction Engine)**: 状态切换不能是非黑即白的。Hover / Focus / Active 必须伴生顺滑克制的缓动曲线（推荐定制 `cubic-bezier`），给用户极致流畅和高级的响应反馈。
6. **Token-first 设计集落库**: 设计变量即代码本身。杜绝一次性的样式和“AI廉价的默认妥协设计”。所有视觉变量必须在 CSS 中成为全局单一事实 (SSOT) 的局部引用。

### General Rules / 边界规范
Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Pair a distinctive display font with a refined body font. Avoid generic defaults.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables (HSL preferred) for consistency. Dominant colors with sharp accents outperform timid palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Apply thoughtful staggered reveals (`animation-delay`) and scroll-triggering.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Grid-breaking elements. Generous negative space.
- **Backgrounds & Visual Details**: Layered transparencies, subtle grain overlays, noise textures, and geometric soft gradients. Create atmosphere.

NEVER use generic AI-generated aesthetics like cliched color schemes (e.g. basic purple gradients on white), predictable component patterns, and cookie-cutter designs that feel cheap.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Elegance comes from executing the vision flawlessly. Remember: Show what can truly be created when committing fully to a distinctive architectural styling vision.
