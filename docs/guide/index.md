# 指南

## 安装

```bash
git clone git@github.com:webkubor/CortexOS.git
cd CortexOS
pnpm bootstrap
```

## 配置

```bash
# 初始化脚本会自动安装 CLI 入口到 ~/.local/bin
source ~/.zshrc
cortexos brief
```

## 使用

```bash
cortexos brief          # 获取快照
cortexos status         # 系统状态
cortexos search <q>     # 搜索知识
cortexos serve          # 启动 HTTP API
```

## 结构

```
docs/           # 规则与文档
.memory/        # 影子私有记忆
~/Documents/memory/   # 主人知识库
```

## 规则

先看这三条：
- [工程基线](/rules/engineering_baseline)
- [安全边界](/rules/security_boundary)
- [Agent 治理](/rules/agent_governance)
