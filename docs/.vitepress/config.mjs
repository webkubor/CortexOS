import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
  lang: "zh-CN",
  title: "CortexOS",
  description: "个人外部大脑操作系统：基于 MCP 协议的多智能体协同中枢。",
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
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: "搜索文档", buttonAriaLabel: "搜索文档" },
              modal: {
                noResultsText: "无法找到相关结果",
                resetButtonTitle: "清除查询条件",
                footer: { selectText: "选择", navigateText: "切换" },
              },
            },
          },
        },
      },
    },
    // 简化右上角导航，只保留两个入口
    nav: [
      { text: "🛰️ 阵列态势", link: "/" },
      { text: "🚀 使用指引", link: "/guide/" },
      { text: "🤖 Agent 配置", link: "/agents/" },
    ],
    // 强化左侧边栏，增加饱满度
    sidebar: [
      {
        text: "🏁 开始使用",
        items: [
          { text: "快速上手指南", link: "/guide/" },
          { text: "功能总表（完整）", link: "/guide/feature-matrix" },
          { text: "🗺️ 路由总览", link: "/router" },
        ],
      },
      {
        text: "🧩 技能矩阵 (Skills)",
        items: [
          { text: "🌍 开源技能库 (GitHub)", link: "/skills/github_repos" },
          { text: "🏠 本地集成能力", link: "/skills/" },
        ],
      },
      {
        text: "📏 核心准则 (Rules)",
        items: [
          
          { text: "📝 编码规范", link: "/rules/coding_rules" },
          { text: "🛡 Skill 准入门禁", link: "/rules/skill_vetting_gate" },
          { text: "🔒 隐私排除规范", link: "/rules/privacy_excludes" },
        ],
      },
      {
        text: "🤖 Agent 支持",
        items: [
          { text: "主流 Agent 配置总览", link: "/agents/" },
          { text: "Gemini 配置", link: "/agents/gemini/README" },
          { text: "Codex 配置", link: "/agents/codex/README" },
          { text: "Claude 配置", link: "/agents/claude/README" },
          { text: "OpenCode 配置", link: "/agents/opencode/README" },
        ],
      },
      {
        text: "🖥 运行与运维 (Ops)",
        collapsed: false,
        items: [
          { text: "🚦 舰队态势板", link: "/ops/fleet-dashboard" },
          { text: "🔁 自动巡航", link: "/ops/auto-pilot" },
          { text: "🧪 健康检查", link: "/ops/external-health-check" },
          { text: "🧭 协作工作流", link: "/ops/workflow" },
        ]
      },
      {
        text: "👋 关于",
        items: [
          { text: "主理人自述", link: "/about" },
          { text: "大脑进化史", link: "/BRAIN_HISTORY" },
        ]
      }
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
