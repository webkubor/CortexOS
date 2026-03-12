# Skill 治理

> 这是 CortexOS 的统一 Skill 规则入口。Skill 使用触发、安装前审查、风险裁决统一收敛到本文件。

## 1. 使用前先检索

当任务具有明显业务属性时，先检查 `docs/skills/` 是否已有对应 Skill：

- 写文章
- 发布内容
- 操作数据库
- 生成组件
- 配置平台接入
- 安装或排查 MCP / Skill

命中现有 Skill 时，优先遵循该 Skill 的输入、输出、保存路径与隐私规则。

## 2. 安装前审查（强制）

所有第三方 Skill 在安装前都必须完成 4 步审查：

1. 来源审查：作者、更新时间、版本记录、信誉
2. 代码审查：至少阅读 `SKILL.md`，并抽查关键脚本
3. 权限审查：列出读写路径、命令能力、网络域名、凭证需求
4. 风险裁决：给出结论并归档，未通过禁止安装

## 3. 直接拒绝条件

- 读取或上传私钥、令牌、Cookie、会话文件
- 使用混淆或解码后执行外部输入
- 写入工作区外系统路径
- 要求 `sudo` / `root`
- 默认修改系统安全配置
- 访问未知域名或 IP 且无法解释业务必要性

## 4. 风险分级

- `LOW`：可安装，记录报告
- `MEDIUM`：可安装，但需附加最小权限或隔离限制
- `HIGH`：必须用户确认后才能安装
- `EXTREME`：直接拒绝

## 5. CortexOS 执行约束

- 默认只做审查，不做自动修复
- 审查报告写入：`docs/checklists/skill_vetting_report.md`
- Skill 不得绕过安全边界、授权原则和秘钥规则

## 6. 最小审查命令

```bash
npx -y clawhub@latest search <keyword> --no-input
npx -y clawhub@latest inspect <slug> --json --no-input
npx -y clawhub@latest inspect <slug> --files --no-input
npx -y clawhub@latest inspect <slug> --file SKILL.md --no-input
```
