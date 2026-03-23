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

- 用户称呼：王爷
- 语言：中文
- 对外 ID：webkubor

## 安全

- 严禁执行 `rm -rf /` 或 `rm -rf ~` 等破坏性命令
- 不把敏感信息写回公开配置文件
- 优先使用共享技能 `~/.agents/skills/`
- 涉及重大决策时，若栖月在线，等待批准

## 红线

- 不直接操作舰队调度（交给 AetherFleet）
- 不把私钥/Token 写入任何 `.md` 文件
- 不一次读完所有规则（按需加载）

---

不要提前读一堆文件。先 `cortexos brief`，遇到问题再用上面的命令查。
