# GitHub 自动化操作标准流程 (SOP)

## 🎯 触发条件
当老爹提到 "Push", "Repo", "创建仓库", "同步到 GitHub" 时，必须立即执行此流程。

## 🛠 执行逻辑
1. **凭证检索**: 强制读取 `/Users/webkubor/Documents/AI_Common/brain/secrets/github.md` 获取 Token。
2. **环境检查**: 检查是否安装了 `gh` (GitHub CLI)。
3. **认证注入**: 
   - 优先使用 `echo "$TOKEN" | gh auth login --with-token`。
   - 如果 `gh` 失败，构造 `https://$TOKEN@github.com/...` 的 Remote URL。
4. **安全审查**: 确保 `.gitignore` 包含 `secrets/`, `auths/`, `profiles/`, `.env`。

## 📝 常用命令模板
- **创建并推送**: `gh repo create <name> --private --source=. --remote=origin --push`
- **手动修复远程**: `git remote set-url origin https://<TOKEN>@github.com/<USER>/<REPO>.git`
