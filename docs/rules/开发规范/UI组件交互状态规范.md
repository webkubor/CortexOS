---
title: UI组件交互状态规范
type: development-standard
status: active
scope: global
domain: frontend
updated: '2026-03-13'
tags:
  - development-standard
  - frontend
  - ui
  - interaction
  - state
---

# UI 组件交互状态规范

## 1. 定位与原则

### 1.1. 定位

本规范是对 [[AI前端开发规范]] §样式与设计规范 的强制补充，旨在定义所有**可交互 UI 组件**必须实现的视觉反馈状态，确保用户体验的一致性、可预见性和可访问性。

**核心问题**：杜绝“只实现静态样式而忽略交互过程”的问题。一个没有交互状态的组件，是**未完成**的组件。

### 1.2. 原则

- **无反馈，不交互**：用户的任何操作（悬停、点击、聚焦）都必须得到即时的视觉响应。
- **状态须明确**：组件的当前状态（可用、禁用、加载中）必须让用户一目了然。
- **体验须一致**：同类组件（如所有主要按钮）在不同页面的交互模式必须完全统一。
- **可访问性优先**：必须保证键盘用户（通过 Tab 键）也能获得清晰的聚焦状态反馈。

---

## 2. 五种核心交互状态

所有可交互的 UI 元素，包括但不限于按钮 (`<button>`)、链接 (`<a>`)、输入框 (`<input>`)、下拉框 (`<select>`)、自定义表单控件等，都**必须**实现以下五种状态的样式。

### 2.1. 默认状态 (Default)

- **描述**：组件在页面加载完成时的原始、静态外观。
- **实现**：标准 CSS 类，如 `.btn`, `.input`。

### 2.2. 悬停状态 (`:hover`)

- **描述**：鼠标指针移到组件上时的视觉变化。
- **实现**：使用 `:hover` CSS 伪类。
- **反馈建议**：轻微的背景色/边框色变化或透明度变化，避免剧烈跳动。

### 2.3. 聚焦状态 (`:focus`, `:focus-visible`)

- **描述**：通过键盘 `Tab` 键或鼠标点击使得组件获得焦点时的状态。
- **实现**：
    - 优先使用 `:focus-visible` 伪类，它只在键盘导航时触发，更符合用户预期。
    - 考虑兼容性时可回退到 `:focus`。
- **反馈建议**：通常表现为清晰的外轮廓（`outline`），颜色应与背景有高对比度。**禁止 `outline: none;`**。

### 2.4. 激活状态 (`:active`)

- **描述**：用户鼠标左键按下但还未抬起，或手指触摸屏幕瞬间的状态。
- **实现**：使用 `:active` CSS 伪类。
- **反馈建议**：比 `:hover` 更深一层的颜色变化或轻微的内凹/位移效果，给用户“按下去了”的物理反馈。

### 2.5. 禁用状态 (`[disabled]`)

- **描述**：组件当前不可用、不可交互的状态。
- **实现**：
    - 对于原生元素，直接添加 `disabled` HTML 属性。
    - 对于自定义组件，通过 `props` (如 `disabled: boolean`) 控制，并动态添加 `.is-disabled` CSS 类。
- **反馈建议**：
    - 样式：通常为灰色、透明度降低，视觉上明显弱化。
    - 行为：**必须**通过 `pointer-events: none;` 阻止所有鼠标事件（包括 `:hover`），并改变光标为 `cursor: not-allowed;`。

---

## 3. 异步/加载中状态

对于会触发异步操作（如 API 请求）的组件，如提交按钮，还**必须**实现加载中状态。

### 3.1. 加载中状态 (`.is-loading`)

- **描述**：异步操作正在进行中，等待响应的状态。
- **实现**：通过 `props` (如 `loading: boolean`) 控制，动态添加 `.is-loading` CSS 类。
- **反馈建议**：
    - 行为上必须**同时处于禁用状态**，防止用户重复提交。
    - 视觉上应有明确的加载指示，如内置一个旋转的 `spinner` 图标，并隐藏原有文本。

## 4. 示例：一个完整的按钮组件

一个合格的按钮组件，其样式**必须**完全由设计变量构成。以下示例假设 `tokens.scss` 已被全局引入，并包含 `$primary`, `$primary-hover`, `$disabled-bg` 等变量。

```scss
// GOOD: 完全由设计变量驱动
.btn {
  // 1. 默认状态
  background-color: $primary;
  color: $white;
  border: 1px solid $primary;
  border-radius: $border-radius-md;
  padding: $spacing-sm $spacing-md;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;

  // 2. 悬停状态
  &:hover {
    background-color: $primary-hover;
    border-color: $primary-hover;
  }

  // 3. 聚焦状态
  &:focus-visible {
    outline: 2px solid $primary-hover;
    outline-offset: 2px;
  }

  // 4. 激活状态
  &:active {
    background-color: $primary-active;
    transform: translateY(1px); // 轻微下沉效果
  }

  // 5. 禁用状态
  &[disabled],
  &.is-disabled {
    background-color: $disabled-bg;
    border-color: $disabled-bg;
    color: $disabled-color;
    cursor: not-allowed;
    pointer-events: none;
  }

  // 6. 加载中状态
  &.is-loading {
    // 同时应用禁用样式
    @extend .is-disabled;

    .btn-text { // 隐藏文字
      visibility: hidden;
    }

    .spinner { // 显示加载图标
      display: inline-block;
      // spinner 样式也应由变量控制
      width: $icon-size-sm;
      height: $icon-size-sm;
    }
  }
}
```

## 5. 质量门禁与审查清单

- **AI 约束**：AI 在创建或修改任何可交互组件时，必须在代码中同时实现上述**全部**状态的样式。
- **Code Review 检查项**：
    - [ ] 是否实现了 `:hover`, `:focus-visible`, `:active` 伪类？
    - [ ] 是否正确处理了 `disabled` 属性和对应的样式？
    - [ ] 对于异步按钮，是否实现了 `loading` 状态，并且该状态下按钮被正确禁用？
    - [ ] 键盘 `Tab` 切换时，聚焦状态是否清晰可见？
    - [ ] 禁用状态下，鼠标悬停是否已无任何 `:hover` 效果？

---

## 6. 与现有规范的关系

- 本规范是 [[AI前端开发规范]] 的核心补充，与 §样式与设计规范 并行。
- [[前端测试规范]] 应包含对这些交互状态的单元测试，例如，验证 `disabled` 状态下点击事件不会触发，`loading` 状态下按钮不可交互等。
