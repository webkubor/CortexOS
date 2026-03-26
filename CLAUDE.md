# CLAUDE.md — 冷启动协议

> 开工前**只读这一步**：

```bash
cortexos brief    # 获取大脑快照（~25行）
```

如需更多：
```bash
cortexos status        # 状态概览
cortexos list-rules    # 可用规则
cortexos logs 3        # 最近3天日志
cortexos search 关键词  # 知识搜索
```

## 已知事实

- 大脑入口：`cortexos brief`（CLI）
- 大脑备份入口：`AGENTS.md`（项目根目录）
- 知识入口：`docs/router.md`
- 用户偏好/记忆：`~/Documents/memory/`
- 助手日志：`~/clawd/memory/`

## 身份

- 用户标识：webkubor
- 语言：中文
- 对外 ID：webkubor

## 安全

- 严禁执行 `rm -rf /` 或 `rm -rf ~` 等破坏性命令
- 不把敏感信息写回公开配置文件
- 优先使用共享技能 `~/.agents/skills/`
- 涉及重大决策时，等待用户确认

## 红线

- 不越过主脑边界处理外部执行编排事务
- 不把私钥/Token 写入任何 `.md` 文件
- 不一次读完所有规则（按需加载）

---

不要提前读一堆文件。先 `cortexos brief`，遇到问题再用上面的命令查。
