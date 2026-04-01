---
name: chrome-native-debug
description: 接管原生 Chrome 浏览器进行自动化操作（共享登录态）。使用 Chrome 144+ 新方式：chrome://inspect 远程调试 + Chrome DevTools MCP --autoConnect。无需重启 Chrome，无需独立 profile，直接操控用户当前浏览器。当用户要求"打开网页"、"操控浏览器"、"接管浏览器"、"用原生浏览器"、"共享登录态"、"在当前浏览器里操作"时使用此 Skill。
---

# Chrome 原生浏览器接管方案

## 背景

自动化测试场景中，经常需要操作**已登录的网站**。启动新浏览器实例会丢失登录态。

**目标：在用户正在使用的原生 Chrome 中直接自动化操作，共享所有登录态和 Session。**

## Chrome 136 封了什么

传统方式 `--remote-debugging-port=9222` + 默认 profile 从 Chrome 136（2025-03-17）被安全策略封堵：参数**静默忽略**（不报错，端口不监听）。官方说明：https://developer.chrome.com/blog/remote-debugging-port

## 正确方案：Chrome 144+ 新方式

通过 `chrome://inspect` 主动授权 + MCP `--autoConnect` 连接。官方说明：https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session

| 维度 | 老方式（已封） | 新方式（推荐） |
|--|--------------|--------------|
| Chrome 版本 | 136 之前 | 144+ |
| 重启 Chrome | 需要 | **不需要** |
| 用户数据 | 需独立 profile | **共享默认 profile** |
| 登录态 | 丢失 | **保留** |
| 授权方式 | 无 | Allow 弹窗 |

## 接入步骤

### 1. Chrome 开启远程调试

地址栏输入 `chrome://inspect/#remote-debugging`，点击 **Enable remote debugging** 开关。只需一次，Chrome 会记住。

### 2. 确认 mcporter 配置

`~/.mcporter/mcporter.json`：

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
  }
}
```

⚠️ **不要加 `--channel=beta`**。验证：`mcporter list` 应显示 `chrome-devtools` 状态 `ok`。

### 3. 发起连接

```bash
mcporter call chrome-devtools.list_pages --tail-log
```

Chrome 弹 Allow 确认框 → **点击 Allow** → 连接成功。

### 4. 操控浏览器

```bash
# 列出标签页
mcporter call chrome-devtools.list_pages

# 导航
mcporter call chrome-devtools.navigate_page type=url url=https://example.com

# 新开标签页
mcporter call chrome-devtools.new_page url=https://example.com

# 截图
mcporter call chrome-devtools.take_screenshot

# 页面快照（a11y 树，含元素 uid）
mcporter call chrome-devtools.take_snapshot

# 点击元素（先 take_snapshot 获取 uid）
mcporter call chrome-devtools.click uid=xxx

# 执行 JS
mcporter call chrome-devtools.evaluate_script function="() => document.title"

# 填写输入框
mcporter call chrome-devtools.fill uid=xxx value="内容"

# 键盘输入
mcporter call chrome-devtools.type_text text="内容"

# 等待文本出现
mcporter call chrome-devtools.wait_for text="加载完成"
```

## 踩坑实录

### 坑 1：DevToolsActivePort 存在但端口不监听 HTTP CDP

**现象：** 文件存在、有端口号，但 `curl /json/version` 返回 404。

**原因：** Chrome 144+ 的远程调试端口**不暴露标准 CDP HTTP 接口**，只有 `chrome-devtools-mcp --autoConnect` 的私有协议能连。

**解决：** 不要用 curl/Playwright 直连端口，必须通过 MCP 工具。

### 坑 2：Allow 弹窗被遮挡导致超时

**现象：** `Call timed out` 或 `Could not find DevToolsActivePort`。

**原因：** MCP 启动后 Chrome 弹了 Allow 框，被其他窗口遮挡。

**解决：**
1. 用 `--tail-log`：`mcporter call chrome-devtools.list_pages --tail-log`
2. 调用前 Alt+Tab 切到 Chrome 等弹窗
3. 加大超时：`--timeout 60000`

### 坑 3：开启 inspect 后仍连不上

**现象：** 开了 `chrome://inspect` 但还是失败。

**原因：** 开关修改后可能需要**重启 Chrome** 才生效。

**解决：** 开启开关 → Cmd+Q 完全退出 Chrome → 重新打开 → 验证：
```bash
cat ~/Library/Application\ Support/Google/Chrome/DevToolsActivePort
```

### 坑 4：macOS 系统代理拦截 localhost

**现象：** `curl localhost:9222` → 502 Bad Gateway（Clash 等代理工具）。

**解决：** 使用 `--autoConnect` 方式自动规避。如需手动测试，绕过代理：
```bash
python3 -c "
import urllib.request
proxy_handler = urllib.request.ProxyHandler({})
opener = urllib.request.build_opener(proxy_handler)
print(opener.open('http://127.0.0.1:54501/json/version').read())
"
```

### 坑 5：Playwright + 默认 profile 报错

**现象：** `DevTools remote debugging requires a non-default data directory`

**原因：** Chrome 136+ 限制，默认 profile 拒绝开调试端口。

**解决：** 必须指向独立目录（但会丢失登录态），或改用 MCP `--autoConnect` 方式。

### 坑 6：mcporter 服务器名写错

**现象：** `Unknown MCP server 'chrome-devtools-mcp'`

**解决：** 配置名是 `chrome-devtools`（不带 `-mcp`）。

## MCP 工具速查（29 个）

| 工具 | 功能 |
|------|------|
| `list_pages` | 列出标签页 |
| `select_page` | 切换标签页 |
| `new_page` | 新开标签页 |
| `close_page` | 关闭标签页 |
| `navigate_page` | 导航（URL/前进/后退/刷新） |
| `take_screenshot` | 截图 |
| `take_snapshot` | 页面 a11y 树快照（含 uid） |
| `click` | 点击元素 |
| `fill` | 填写输入框 |
| `type_text` | 键盘输入 |
| `press_key` | 按键/组合键 |
| `hover` | 悬停 |
| `drag` | 拖拽 |
| `upload_file` | 上传文件 |
| `evaluate_script` | 执行 JS |
| `wait_for` | 等待文本 |
| `handle_dialog` | 处理弹窗 |
| `list_network_requests` | 网络请求列表 |
| `get_network_request` | 请求详情 |
| `list_console_messages` | 控制台消息 |
| `performance_start_trace` | 性能追踪 |
| `lighthouse_audit` | Lighthouse 审计 |
| `emulate` | 模拟设备/网络 |
| `resize_page` | 调整大小 |
| `fill_form` | 批量填表 |
| `take_memory_snapshot` | 内存快照 |

完整 schema 用 `mcporter list chrome-devtools --output json` 查看。

## 快速诊断

```bash
# Chrome 是否运行？
pgrep -f "Google Chrome"

# 远程调试开启？
cat ~/Library/Application\ Support/Google/Chrome/DevToolsActivePort

# mcporter 配置？
mcporter list chrome-devtools

# 测试连接（注意 Allow！）
mcporter call chrome-devtools.list_pages --tail-log
```

## 各平台配置

### Claude Code
```bash
claude mcp add chrome-devtools npx -y chrome-devtools-mcp@latest --autoConnect
```

### Gemini CLI
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--autoConnect", "--channel=beta"]
    }
  }
}
```

### Cursor / VS Code
```bash
code --add-mcp '{"name":"chrome-devtools","command":"npx","args":["chrome-devtools-mcp@latest"]}'
```

## 参考

- [Chrome 远程调试安全变更（136 封老方式）](https://developer.chrome.com/blog/remote-debugging-port)
- [Chrome DevTools MCP（144+ 新方式）](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [云文档（完整版）](https://www.feishu.cn/wiki/SxsmwhE8MipyJdkd5v1c5TBlnpd)
