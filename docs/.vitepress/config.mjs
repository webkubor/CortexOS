import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
  lang: "zh-CN",
  title: "CortexOS",
  description: "影子系统：主人的数字延伸",
  base: "/CortexOS/",
  vite: {
    plugins: [
      llmstxt({
        title: "CortexOS",
        description: "AI Agent Harness for Personal Use",
      })
    ]
  },
  head: [["link", { rel: "icon", href: "/CortexOS/logo.svg" }]],
  themeConfig: {
    logo: "/logo.svg",
    search: { provider: "local" },
    nav: [
      { text: "指南", link: "/guide/" },
      { text: "规则", link: "/rules/" },
      { text: "接入", link: "/agents/" },
      { text: "运维", link: "/ops/" }
    ],
    sidebar: [
      {
        text: "指南",
        items: [
          { text: "快速开始", link: "/guide/" },
          { text: "功能总表", link: "/guide/feature-matrix" },
          { text: "路由", link: "/router" }
        ]
      },
      {
        text: "规则",
        items: [
          { text: "工程基线", link: "/rules/engineering_baseline" },
          { text: "安全边界", link: "/rules/security_boundary" },
          { text: "Agent 治理", link: "/rules/agent_governance" }
        ]
      },
      {
        text: "关于",
        items: [
          { text: "进化史", link: "/BRAIN_HISTORY" }
        ]
      }
    ],
    docFooter: {
      prev: "上一页",
      next: "下一页"
    }
  }
});
