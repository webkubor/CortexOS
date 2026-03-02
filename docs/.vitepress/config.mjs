import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
  lang: "zh-CN",
  title: "小烛的外部大脑",
  description: "小烛 (Candle) 的外部大脑：集成标准化操作规范 (SOP)、工程实践深度复盘与知识路由的 统一协同中枢。",
  base: "/CortexOS/",
  srcExclude: [
    "**/secrets/**",
    "**/operation-logs/**",
    "**/scripts/**",
    "**/snippets/git_repos_inventory.md"
  ],
  vite: {
    plugins: [
      llmstxt({
        title: "CortexOS",
        description: "Standardized AI Context Engineering & Long-term Memory Infrastructure.",
      })
    ]
  },
  head: [["link", { rel: "icon", href: "/logo.svg" }]],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "AI Team 看板", link: "/ai-team" },
      { text: "路由总览", link: "/router" },
      { text: "规则中心", link: "/rules/" },
      { text: "技能库", link: "/skills/" },
      { text: "关于我", link: "/about" },
    ],
    sidebar: [
      {
        text: "🧠 核心配置 (Core)",
        items: [
          { text: "AI Team 看板", link: "/ai-team" },
          { text: "路由总览", link: "/router" },
          { text: "技术栈偏好", link: "/tech_stack" },
          { text: "代码片段", link: "/snippets/" },
        ],
      },
      {
        text: "📏 规则中心 (Rules)",
        items: [
          { text: "总览", link: "/rules/" },
          { text: "编码规范", link: "/rules/coding_rules" },
          { text: "Git 提交规范", link: "/rules/git_commit_rules" },
          { text: "隐私与忽略规范", link: "/rules/privacy_excludes" },
          { text: "标准化操作规范 (SOP)", link: "/rules/workflow" },
          { text: "Vibe 编程规则", link: "/rules/vibe_rules" },
        ],
      },
      {
        text: "💎 职能部门 (Departments)",
        items: [
          { text: "Skills 包总览（唯一入口）", link: "/skills/github_repos" },
          { text: "Skills 说明页", link: "/skills/" },
          {
            text: "本地保留能力（未拆分）",
            collapsed: true,
            items: [
              { text: "Core 协议", link: "/skills/core/common_manifest" },
              { text: "Ops 总览", link: "/skills/ops/" },
              { text: "碎片知识管家", link: "/skills/knowledge/snippet_master" },
            ]
          },
          {
            text: "🤖 Agent 参谋矩阵",
            collapsed: true,
            items: [
              { text: "矩阵总览", link: "/agents/" },
              { text: "Claude", link: "/agents/claude/manifest" },
              { text: "Gemini", link: "/agents/gemini/manifest" },
              { text: "Codex", link: "/agents/codex/manifest" },
            ]
          }
        ]
      },
      {
        text: "🕒 深度复盘 (Retrospectives)",
        items: [
          { text: "复盘总览", link: "/retrospectives/" },
          {
            text: "📚 规则复盘 (Rules)",
            collapsed: true,
            items: [
              { text: "规则复盘总览", link: "/retrospectives/rules/" },
              { text: "交互协议复盘", link: "/retrospectives/rules/interaction" },
            ]
          },
        ],
      },
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
