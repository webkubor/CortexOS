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
    nav: [
      { text: "🛰️ 阵列态势", link: "/" },
      { text: "🚀 使用指南", link: "/guide/" },
      {
        text: "🧩 技能矩阵",
        items: [
          { text: "开源技能库", link: "/skills/github_repos" },
          { text: "本地集成能力", link: "/skills/" },
        ]
      },
      { text: "🗺️ 路由索引", link: "/router" },
    ],
    sidebar: [
      {
        text: "🚀 快速上手",
        items: [
          { text: "使用指引", link: "/guide/" },
          { text: "路由总览", link: "/router" },
        ],
      },
      {
        text: "🧩 技能矩阵",
        items: [
          { text: "开源技能库 (GitHub)", link: "/skills/github_repos" },
          { text: "本地集成能力", link: "/skills/" },
        ],
      },
      {
        text: "⚖️ 核心底座",
        collapsed: true,
        items: [
          { text: "审美准则", link: "/rules/webkubor_vibe_manifesto" },
          { text: "关于主理人", link: "/about" },
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
