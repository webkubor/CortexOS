# 安全边界

> 这是 CortexOS 的统一安全规则入口。秘钥存放、隐私排除、公开边界、绝对红线统一收敛到本文件。

## 1. 高敏数据存放

- 秘钥逻辑目录：`memory/secrets/`
- 当前机器默认物理路径：`~/Documents/memory/secrets`
- 可覆盖环境变量：`CORTEXOS_SECRET_HOME`
- 项目模板目录：`docs/secrets/_templates/`

原则：

- 真实秘钥只允许存在于外置秘钥目录
- 仓库内只允许保留模板与说明
- 禁止把真实秘钥写进 `docs/`、`scripts/`、`.memory/`、配置示例或提交记录

## 2. 不入库 / 不公开范围

以下内容默认不向量化、不公开、不复制到开源仓库：

- `~/.ssh/`
- `~/.aws/`、`~/.config/gcloud/`
- `~/.npmrc`、`~/.yarnrc*`、`~/.pnpmrc`
- `~/.git-credentials`、`~/.config/gh/`
- `~/.gemini/` 中的令牌、凭证、OAuth 文件
- 任意 `*.env`、`*.pem`、`*.p12`、`*.key`、`id_rsa*`
- 含 `API_KEY`、`SECRET`、`TOKEN`、`PASSWORD` 等字段的内容

## 3. 允许备份但不建议入库

- 浏览器 profile、缓存状态文件
- `.DS_Store`
- `node_modules/`、`dist/`、`build/`

## 4. 绝对红线

- 严禁提交真实秘钥到 Git、issue、日志、截图
- 严禁在对话中明文回显完整 Token
- 严禁擅自捏造外部域名、外部链接、外部路由
- 严禁擅自替换或覆盖品牌名、Logo、正式资产
- 严禁把测试 URL、示例资源误当成用户正式资产
- 严禁越权读取或写入未授权的高敏路径

## 5. 模板与权限建议

- 外置秘钥目录建议：目录 `700`，文件 `600`
- 新增秘钥类型时，只能先补到 `docs/secrets/_templates/`
- 使用模板时，先复制到 `memory/secrets/` 再填真实值

## 6. 入库 / 发布前最小自检

- 扫描关键字：`API_KEY|SECRET|TOKEN|PASSWORD|PEM 私钥块标记|sk-`
- 检查变更中是否出现 `memory/secrets/` 之外的真实凭证
- 检查文档、截图、日志中是否出现完整令牌
- 检查是否误公开了品牌、账号、用户身份信息
