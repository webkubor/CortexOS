# Retry Patterns（失败重试模式）

> 目标：把常见失败收敛为可复用重试动作。

## 1. MCP 连接失败

- 症状：`Connection closed` / `tool unavailable`
- 先做：
  1. 检查对应 MCP 配置路径是否正确
  2. 验证命令可执行（如 `node`、`uv`、`npx`）
  3. 重启对应客户端会话后重试

## 2. 文档变更后未生效

- 症状：脚本已修改，但生成内容仍是旧文案
- 先做：
  1. 重新运行生成命令
  2. 检查是否有缓存产物覆盖
  3. 直接读取生成文件确认最终结果

## 3. 协作状态不一致

- 症状：看板显示任务旧、角色旧、节点残留
- 先做：
  1. 执行 `pnpm run fleet:claim -- --workspace "$PWD" --task "<最新任务>" --agent "Codex" --alias "Codex" --role "后端"` 回填
  2. 执行 `pnpm run fleet:status` 校验

## 4. 自动复盘增量

- [auto/command_failure] 2026-03-04: 记录失败命令与关键报错，补充前置检查后重跑
- [auto/permission_or_path] 2026-03-09: 权限或路径错误。先执行 `ls -la` 确认目标权限，或检查环境变量中的 ROOT 路径
- [auto/generic_error] 2026-03-11: 记录症状并补充上下文，再执行最小化复现
