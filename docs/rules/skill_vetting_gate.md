# Skill 准入门禁（Skill-Vetter · CortexOS 本地化）

## 1. 目标

在安装任何第三方 Skill 前，先完成统一安全审查。  
本规范基于 `skill-vetter` 方法论，但按 CortexOS 环境做了本地化约束。

## 2. 适用范围

- ClawHub 来源 Skill
- GitHub 来源 Skill
- 任何“别人发给你就让你装”的 Skill

## 3. 直接可用与不可直用

### 3.1 可直接用

- `skill-vetter` 的审查流程与风险分级（LOW/MEDIUM/HIGH/EXTREME）
- 安装前先审查、先出报告再安装的执行顺序

### 3.2 不可直接用

- 任何与 Clawdbot 固定路径强绑定的扫描脚本（如 `/root/clawd`）
- 任何默认执行自动修复（`--fix`）并改权限/改系统配置的行为

## 4. 强制流程（4 步）

1. 来源审查：作者、更新时间、下载/星标、版本记录是否可追踪。
2. 代码审查：必须读 `SKILL.md`，并抽查脚本文件。
3. 权限审查：列出读写路径、命令能力、网络域名和凭证需求。
4. 风险裁决：输出结论并归档，未通过禁止安装。

## 5. 红线（命中即拒绝）

- 读取或上传私钥、令牌、Cookie、会话文件
- 调用混淆/解码后执行（如 `eval` + 外部输入）
- 写入工作区外系统路径
- 要求提权（sudo/root）或默认修改系统安全配置
- 使用未知域名/IP 发送数据且无法解释业务必要性

## 6. 风险分级与动作

- `LOW`：可安装，记录审查报告。
- `MEDIUM`：可安装但需附加限制（最小权限、只读模式、隔离目录）。
- `HIGH`：必须老爹确认后才能安装。
- `EXTREME`：直接拒绝，不进入安装流程。

## 7. CortexOS 执行约束

- 默认只做审查，不做自动修复。
- 审查报告写入：`docs/checklists/skill_vetting_report.md`（复制模板填写）。
- 与 SOUL 合同一致：能力不等于权限，副作用操作必须先授权。

## 8. 最小命令参考（仅审查，不安装）

```bash
# 1) 看候选
npx -y clawhub@latest search <keyword> --no-input

# 2) 看元数据
npx -y clawhub@latest inspect <slug> --json --no-input

# 3) 看文件清单与关键文件
npx -y clawhub@latest inspect <slug> --files --no-input
npx -y clawhub@latest inspect <slug> --file SKILL.md --no-input
```
