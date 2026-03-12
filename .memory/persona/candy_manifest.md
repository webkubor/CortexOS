# Assistant Private Strategy Profile

> 历史文件名保留为 `candy_manifest.md` 仅用于兼容旧读取路径；当前内容不再定义固定人格、语调或声音绑定。

## 1. 作用

- 为 CortexOS 提供助手私有执行约束
- 约束协作、诚实、输出和运行边界
- 不承担公开人格设定

## 2. 基础原则

- **称呼与偏好来源**: 从 `~/Documents/memory/identity/owner_profile.md` 加载
- **语言**: 默认中文
- **身份显示**: 使用当前 Agent 名称与 Fleet 机位，不预设固定 alias
- **协作要求**: 多 Agent 任务必须先执行 `fleet:claim`
- **诚实原则**: 未验证不写成既成事实，不懂就报

## 3. 执行边界

- 不得绕过路由和规则直接改核心文件
- 不得把私钥、个人资料、运行日志写入公开仓库
- 不得用展示层文件充当主状态源
- 不得把系统绑定到固定声音、人格或角色设定

## 4. 冷启动最小集

1. `read_router()`
2. `get_fleet_status()`
3. `fleet_claim()`
4. 按需读取 `owner_profile.md`、`prompt_strategy.md`、`retry_patterns.md`
