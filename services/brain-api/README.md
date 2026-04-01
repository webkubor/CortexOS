# brain-api

Cloud Run 上的云端大脑接口服务。

## 当前能力

- `GET /health`
- `POST /memories`
- `GET /memories`
- `POST /notifications`
- `GET /notifications`
- `DELETE /notifications/:id`
- `POST /notifications/delete-batch`
- `POST /notifications/:id/triage`
- `POST /tasks`
- `GET /tasks`

## 三层结构

Cloud Brain 现在按这三层收口：

1. `notifications`
- 远端节点把消息先投递到收件箱
- 这里是待处理区，不直接等于长期记忆

2. `tasks`
- 需要后续执行、确认、接手的事项
- 分诊后进入任务集合

3. `memories`
- 只沉淀高价值、已提炼的重点知识
- 不直接把所有通知原文灌进长期记忆

## 智能分诊

推荐的消息流：

```text
通知 -> inbox/notifications -> triage -> memories | tasks | archive
```

当前第一版分诊规则：

- `error / failed / 异常 / 超时 / 离线` -> `task`
- `need / please / 待处理 / 请确认` -> `task`
- `completed / resolved / 完成 / 已修复 / 总结` -> `memory`
- `sync / heartbeat / 状态 / 心跳` -> `archive`
- 其他默认 -> `memory`

这意味着：
- 主脑不会把所有远端同步都当作长期记忆
- 只把重点结果提升为 `memory`
- 需要动作的内容转为 `task`

## 鉴权

- `/health` 默认开放，用于探活
- 其他接口支持 `Bearer Token`
- 当设置了 `BRAIN_API_TOKEN` 后，除 `/health` 外的接口会强制校验：

```bash
Authorization: Bearer <BRAIN_API_TOKEN>
```

- 如果未设置 `BRAIN_API_TOKEN`，服务会处于无鉴权模式，只适合本地验证

## 本地启动

```bash
pnpm install
pnpm brain-api:dev
```

如果要本地模拟鉴权：

```bash
cd services/brain-api
cp .env.example .env
export $(cat .env | xargs)
pnpm start
```

本地默认监听端口是 `3679`。
如需覆盖，可显式设置：

```bash
export BRAIN_API_PORT=4680
pnpm brain-api:start
```

## 请求示例

```bash
curl -X POST http://127.0.0.1:3679/memories \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer replace-with-a-long-random-token' \
  -d '{
    "project": "cortexos",
    "agent": "gemini",
    "source": "jakarta-server",
    "content": "修复了共享大脑基础设施权限问题",
    "tags": ["brain", "infra"]
  }'
```

通知写入：

```bash
curl -X POST http://127.0.0.1:3679/notifications \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer replace-with-a-long-random-token' \
  -d '{
    "project": "cortexos",
    "agent": "gemini",
    "source": "jakarta-server",
    "title": "雅加达节点汇报",
    "content": "cloud brain 第一期部署完成，后续需要本地主脑确认是否收口鉴权。",
    "tags": ["brain", "jakarta", "report"]
  }'
```

分诊执行：

```bash
curl -X POST http://127.0.0.1:3679/notifications/<notification-id>/triage \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer replace-with-a-long-random-token' \
  -d '{
    "action": "task",
    "summary": "确认 cloud brain 鉴权收口"
  }'
```

删除单条通知：

```bash
curl -X DELETE http://127.0.0.1:3679/notifications/<notification-id>
```

批量删除通知：

```bash
curl -X POST http://127.0.0.1:3679/notifications/delete-batch \
  -H 'content-type: application/json' \
  -d '{
    "ids": ["id-1", "id-2"]
  }'
```

## Cloud Run 部署

```bash
export BRAIN_API_TOKEN=replace-with-a-long-random-token
pnpm brain-api:deploy
```

首次部署后，可以再根据访问策略补：

- `--allow-unauthenticated`
- 或基于 IAM / ID Token 做鉴权

部署脚本位置：

- `scripts/actions/deploy-brain-api.mjs`

它会自动读取：

- 当前 `gcloud` 项目
- 默认区域 `asia-southeast2`
- 服务目录 `services/brain-api/`
- 服务账号 `brain-api@<project>.iam.gserviceaccount.com`

## 雅加达节点接入

远端节点建议固定两个环境变量：

```bash
export BRAIN_API_URL="https://brain-api-675793533606.asia-southeast2.run.app"
export BRAIN_API_TOKEN='<your-brain-api-token>'
```

读取：

```bash
curl -s "$BRAIN_API_URL/memories?project=cortexos&limit=10" \
  -H "authorization: Bearer $BRAIN_API_TOKEN"
```

写入：

```bash
curl -s -X POST "$BRAIN_API_URL/memories" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $BRAIN_API_TOKEN" \
  -d '{
    "project": "cortexos",
    "agent": "gemini",
    "source": "jakarta-server",
    "content": "雅加达节点已接入受保护的云端大脑接口。",
    "tags": ["brain", "jakarta", "secure"]
  }'
```
