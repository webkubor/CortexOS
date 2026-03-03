# 飞书机器人双向通信接入

目标：在飞书群里让机器人可以“收消息并回复”，把你这套 AI 大脑接成一个通信入口。

## 1. 本地配置

创建文件：`~/Documents/memory/secrets/feishu_bot.env`

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_VERIFICATION_TOKEN=xxx
FEISHU_BOT_PORT=8788
# 可选：你自己的大脑对话服务
BRAIN_CHAT_ENDPOINT=http://127.0.0.1:9000/chat
```

## 2. 启动桥接服务

```bash
pnpm run feishu:bot
```

健康检查：

```bash
curl http://127.0.0.1:8788/healthz
```

## 3. 飞书开放平台配置

1. 创建企业自建应用（机器人）。
2. 开启 **事件订阅**，请求地址填：`https://你的域名/feishu/events`。
3. 在事件列表勾选：`im.message.receive_v1`。
4. 配置与本地一致的 `Verification Token`。
5. 给应用开通发消息权限（机器人能力 / IM 消息相关）。
6. 将机器人拉入群聊并授权可见范围。

## 4. 消息流

- 飞书群发消息给机器人
- 飞书事件回调到 `/feishu/events`
- 服务调用 `BRAIN_CHAT_ENDPOINT`（若未配置则回声模式）
- 机器人回消息到群聊

## 5. 当前实现说明

- 已支持：URL 验证、接收文本消息、发送文本回复。
- 未做：加密事件解密、签名强校验、幂等去重（生产建议补齐）。
