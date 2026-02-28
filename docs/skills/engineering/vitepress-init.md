---
name: vitepress-init
description: "VitePress Documentation Expert - automated initialization of high-quality documentation sites, handling directory structures, logo branding, and config.mjs nuances."
version: 1.1.0
allowed-tools: ["run_command", "write_to_file", "list_dir"]
user-invocable: true
---
# VitePress Init Skill (文档站点初始化专家)

> **🚀 官方技能仓库**: [github.com/webkubor/vitepress-init-skill](https://github.com/webkubor/vitepress-init-skill)
> **建议**: 核心代码已托管，安装请使用 `gemini skills install https://github.com/webkubor/vitepress-init-skill`

## 技能定位

本技能专注于快速初始化 VitePress 文档站点，确保项目结构、Logo 配置、Favicon 设置等关键环节一次性配置正确，避免后续反复调整。

## 触发条件

当用户提出以下请求时自动激活：

- "初始化 VitePress"
- "创建文档站点"
- "搭建 VitePress 项目"
- "配置文档系统"

## 核心工作流

### 阶段 1: 环境准备

1. **确认环境**:
   - Node.js 版本 >= 18
   - 包管理器：推荐 pnpm（确保 workspace 支持）
   - 文本编辑器：VSCode + Vue 官方扩展

2. **安装依赖**:

   ```bash
   pnpm add -D vitepress@next
   pnpm add -D vue  # 如果需要自定义组件
   ```

### 阶段 2: 目录结构初始化

创建标准化的目录结构：

```
project-root/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mjs
│   │   └── theme/
│   │       ├── index.js
│   │       └── custom.css
│   ├── public/
│   │   └── logo.svg
│   ├── index.md
│   └── [其他文档目录]
└── package.json
```

### 阶段 3: Logo 设计与配置

1. **Logo 设计原则**:
   - 使用 SVG 格式（矢量、可缩放）
   - 风格：极简几何风格（Geometric Minimalism）
   - 配色：莫兰迪色系（低饱和度、高级感）
   - 尺寸：512x512 viewbox
   - 背景：默认透明，适配深/浅色模式

2. **Logo 创建**:
   - 使用 `think` 或 `logo-design` 技能生成
   - 保存路径：`docs/public/logo.svg`

3. **Favicon 配置**（关键步骤）:
   - 直接复用 `logo.svg`，无需额外文件
   - 在 `config.mjs` 中正确配置路径

### 阶段 4: 配置文件生成

生成标准化的 `docs/.vitepress/config.mjs`：

```javascript
import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "项目名称",
  description: "项目描述",
  base: "/项目路径/",  // 如：/AI_Common/

  // ⚠️ 关键：Favicon 配置
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/项目路径/logo.svg' }]
  ],

  themeConfig: {
    logo: "/logo.svg",  // 导航栏 logo

    nav: [
      { text: "首页", link: "/" },
      // ... 其他导航项
    ],

    sidebar: [
      {
        text: "核心",
        items: [
          { text: "首页", link: "/" },
          // ... 其他侧边栏项
        ],
      },
      // ... 其他分组
    ],

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    darkModeSwitchLabel: "外观",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "返回顶部",
    lastUpdatedText: "最后更新于",
  },
});
```

### 阶段 5: 验证与测试

1. **启动开发服务器**:

   ```bash
   pnpm run docs:dev
   ```

2. **验证清单**:
   - [ ] 浏览器标签页显示 favicon
   - [ ] 导航栏显示 logo
   - [ ] 所有链接正常跳转
   - [ ] 深色/浅色模式切换正常
   - [ ] 侧边栏导航正常

## 关键技术规范

### 1. 路径配置规范（重要）

当设置了 `base: "/项目路径/"` 后：

| 资源类型 | 配置方式 | 示例 |
|---------|---------|------|
| **Favicon** | 绝对路径（包含 base） | `href: "/AI_Common/logo.svg"` |
| **导航栏 Logo** | 相对路径（不含 base） | `logo: "/logo.svg"` |
| **静态资源引用** | 相对路径 | `![图片](./image.png)` |

### 2. Logo 设计规范

- 使用莫兰迪色系渐变
- 黄金比例构图
- 语义化标签（`<title>`, `<desc>`）
- 透明背景（除非用户明确要求）

### 3. 目录组织规范

- **核心文档**：`docs/index.md`
- **配置文件**：`docs/.vitepress/config.mjs`
- **静态资源**：`docs/public/`
- **主题定制**：`docs/.vitepress/theme/`

## 验收清单

### 必须完成

- [ ] VitePress 成功安装并启动
- [ ] 目录结构符合标准
- [ ] Logo 已创建并保存到 `docs/public/logo.svg`
- [ ] Favicon 在浏览器标签页正确显示
- [ ] 导航栏 Logo 正确显示
- [ ] 配置文件使用 `.mjs` 扩展名（ESM）

### 推荐完成

- [ ] 添加自定义主题样式
- [ ] 配置深色模式
- [ ] 添加搜索功能
- [ ] 配置部署脚本

## 常见问题

### Q1: Favicon 不显示？

**原因**：路径配置错误
**解决**：确保 `head` 中使用绝对路径（包含 base），如 `href: "/AI_Common/logo.svg"`

### Q2: Logo 显示模糊？

**原因**：使用了位图格式
**解决**：使用 SVG 矢量格式

### Q3: 深色模式下 Logo 看不清？

**原因**：Logo 使用了纯黑色
**解决**：使用莫兰迪色系或提供亮色描边版本

## 参考资源

- [VitePress 官方文档](https://vitepress.dev/guide/getting-started)
- [VitePress 配置参考](https://vitepress.dev/reference/site-config)

## 最佳实践

1. **统一配置**：所有路径配置在 `config.mjs` 中集中管理
2. **版本控制**：将 `docs/public/logo.svg` 纳入版本控制
3. **文档同步**：Logo 更新后同步更新所有引用
4. **测试先行**：每次配置修改后立即验证效果
