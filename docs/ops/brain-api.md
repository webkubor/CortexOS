---
description: CortexOS Cloud Brain 对外 HTTP API 参考，包含 health、memories、notifications、tasks 与 triage 的请求结构与示例。
---
# Brain API 参考

> `brain-api` 是 CortexOS 的云端共享入口。  
> 它不是另一套脑，而是 **CortexOS 在 Cloud Run + Firestore 上的共享扩展层**。

## 当前服务

- 服务名：`brain-api`
- 线上地址：[https://brain-api-675793533606.asia-southeast2.run.app](https://brain-api-675793533606.asia-southeast2.run.app)
- 本地代码：`services/brain-api/`
- 当前版本：`0.2.0`

## 当前能力

- `health`
- `memories`
- `notifications`
- `tasks`
- `triage`

## 鉴权

### 当前线上状态

当前部署返回：

```json
{
  "authMode": "disabled"
}
```

这意味着当前线上实例 **暂时不要求** Bearer Token。

### 未来收口方式

当 Cloud Run 设置了 `BRAIN_API_TOKEN` 后，除 `/health` 外的接口都应带：

```text
Authorization: Bearer <BRAIN_API_TOKEN>
```

## 通用约定

### Base URL

```text
https://brain-api-675793533606.asia-southeast2.run.app
```

### 通用字段

很多接口会反复出现这些字段：

- `project`: 项目标识，当前主脑默认项目为 `cortexos`
- `agent`: 发起方，例如 `gemini`、`codex`、`claude`
- `source`: 节点来源，例如 `jakarta-server`、`hangzhou-local`
- `tags`: 标签数组，最多 12 个，内部会转小写
- `metadata`: 扩展对象

### 当前默认项目

当前这套 Cloud Brain 面向的主脑项目就是：

```text
cortexos
```

如果调用方没有显式传 `project`，后端现在会自动回落到：

```text
cortexos
```

另外也兼容这些别名字段：

- `projectId`
- `project_id`
- `nodeId`
- `node_id`

### Subagent 推荐身份字段

如果调用方是外部子代理，推荐一并带上这些字段，后端会自动收进 `metadata`：

- `node_id`
- `node_name`
- `runtime`
- `model`
- `role`
- `workspace`
- `environment`
- `region`
- `hostname`

### 状态枚举

#### notification.status

- `new`
- `triaged`
- `acted`
- `archived`

#### task.status

- `todo`
- `in_progress`
- `done`
- `archived`

#### priority

- `low`
- `medium`
- `high`
- `urgent`

---

## 1. Health

### `GET /health`

用途：
- 探活
- 查看当前版本
- 看当前鉴权模式

示例：

```bash
curl https://brain-api-675793533606.asia-southeast2.run.app/health
```

示例返回：

```json
{
  "ok": true,
  "service": "brain-api",
  "version": "0.2.0",
  "authMode": "disabled",
  "capabilities": ["memories", "notifications", "tasks", "triage"],
  "timestamp": "2026-03-25T10:00:00.000Z"
}
```

---

## 2. Memories

### `POST /memories`

用途：
- 写入长期知识
- 写入重点事实
- 写入分诊后的高价值结论

最小请求体：

```json
{
  "project": "cortexos",
  "content": "Cloud Brain 已升级为 notifications -> triage -> memories/tasks 三层结构。"
}
```

完整示例：

```bash
curl -X POST 'https://brain-api-675793533606.asia-southeast2.run.app/memories' \
  -H 'content-type: application/json' \
  -d '{
    "project": "cortexos",
    "content": "Cloud Brain 已升级为 notifications -> triage -> memories/tasks 三层结构。",
    "agent": "codex",
    "source": "hangzhou-local",
    "kind": "note",
    "summary": "Cloud Brain 三层结构升级",
    "tags": ["cloud-brain", "architecture"],
    "metadata": {
      "scope": "brain"
    }
  }'
```

成功返回：

```json
{
  "ok": true,
  "memory": {
    "id": "memory-id",
    "project": "cortexos",
    "content": "...",
    "agent": "codex",
    "source": "hangzhou-local",
    "kind": "note",
    "summary": "Cloud Brain 三层结构升级",
    "tags": ["cloud-brain", "architecture"],
    "metadata": {
      "scope": "brain"
    },
    "createdAt": "2026-03-25T10:00:00.000Z"
  }
}
```

### `GET /memories`

支持查询参数：

- `project`
- `agent`
- `tag`
- `limit`

示例：

```bash
curl 'https://brain-api-675793533606.asia-southeast2.run.app/memories?project=cortexos&limit=10'
```

返回：

```json
{
  "ok": true,
  "count": 2,
  "memories": []
}
```

---

## 3. Notifications

### `POST /notifications`

用途：
- 远端节点汇报
- 异常上报
- 状态同步
- 先进入 inbox，再决定去哪里

最小请求体：

```json
{
  "content": "雅加达节点已完成本轮任务。"
}
```

推荐完整示例：

```bash
curl -X POST 'https://brain-api-675793533606.asia-southeast2.run.app/notifications' \
  -H 'content-type: application/json' \
  -d '{
    "project": "cortexos",
    "title": "雅加达节点汇报",
    "content": "Gemini 子代理已完成本轮接入验证，请主脑决定是否沉淀为记忆。",
    "agent": "gemini",
    "source": "jakarta-server",
    "node_id": "jakarta-server",
    "node_name": "Jakarta Agent",
    "runtime": "@cortexos/jakarta-agent",
    "model": "gemini",
    "role": "subagent",
    "workspace": "/opt/jakarta-agent",
    "environment": "production",
    "region": "asia-southeast2",
    "type": "notification",
    "priority": "medium",
    "tags": ["report", "jakarta"],
    "metadata": {
      "runtime": "jakarta-agent"
    }
  }'
```

成功返回：

```json
{
  "ok": true,
  "notification": {
    "id": "notification-id",
    "project": "cortexos",
    "title": "雅加达节点汇报",
    "content": "Gemini 子代理已完成本轮接入验证，请主脑决定是否沉淀为记忆。",
    "agent": "gemini",
    "source": "jakarta-server",
    "type": "notification",
    "priority": "medium",
    "status": "new",
    "read": false,
    "triageAction": "",
    "triageSummary": "",
    "tags": ["report", "jakarta"],
    "metadata": {
      "runtime": "jakarta-agent"
    },
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z",
    "actedAt": null
  },
  "suggestion": {
    "action": "memory",
    "reason": "默认按重点摘要沉淀，避免遗漏高价值信息。",
    "summary": "雅加达节点汇报"
  }
}
```

### `GET /notifications`

支持查询参数：

- `project`
- `status`
- `tag`
- `read`
- `limit`

示例：

```bash
curl 'https://brain-api-675793533606.asia-southeast2.run.app/notifications?project=cortexos&status=new&limit=20'
```

返回：

```json
{
  "ok": true,
  "count": 3,
  "notifications": []
}
```

---

## 4. Notification Triage

### `POST /notifications/:id/triage`

用途：
- 把收件箱通知转成 `memory`
- 或转成 `task`
- 或直接归档

可用动作：

- `memory`
- `task`
- `archive`

示例：转成记忆

```bash
curl -X POST 'https://brain-api-675793533606.asia-southeast2.run.app/notifications/<notification-id>/triage' \
  -H 'content-type: application/json' \
  -d '{
    "action": "memory",
    "summary": "雅加达节点完成 Cloud Brain 接入验证",
    "tags": ["jakarta", "cloud-brain"]
  }'
```

示例：转成任务

```bash
curl -X POST 'https://brain-api-675793533606.asia-southeast2.run.app/notifications/<notification-id>/triage' \
  -H 'content-type: application/json' \
  -d '{
    "action": "task",
    "summary": "确认 Cloud Brain 后续鉴权策略"
  }'
```

成功返回结构：

```json
{
  "ok": true,
  "suggestion": {
    "action": "task",
    "reason": "...",
    "summary": "..."
  },
  "notification": {},
  "created": {
    "type": "task",
    "value": {}
  }
}
```

---

## 5. Tasks

### `POST /tasks`

用途：
- 直接创建待办
- 把需要主脑继续处理的事项结构化

最小请求体：

```json
{
  "project": "cortexos",
  "title": "处理一条后续事项"
}
```

完整示例：

```bash
curl -X POST 'https://brain-api-675793533606.asia-southeast2.run.app/tasks' \
  -H 'content-type: application/json' \
  -d '{
    "project": "cortexos",
    "title": "确认 Cloud Brain Bearer 鉴权方案",
    "content": "需要统一本地与雅加达节点的认证策略。",
    "source": "brain-agent",
    "agent": "codex",
    "priority": "high",
    "status": "todo",
    "tags": ["cloud-brain", "security"],
    "metadata": {
      "area": "api"
    }
  }'
```

### `GET /tasks`

支持查询参数：

- `project`
- `status`
- `tag`
- `limit`

示例：

```bash
curl 'https://brain-api-675793533606.asia-southeast2.run.app/tasks?project=cortexos&limit=20'
```

---

## 6. 错误返回

当参数缺失时，返回：

```json
{
  "ok": false,
  "error": "project is required"
}
```

当前主要会出现的错误：

- `project is required`
- `content is required`
- `title is required`
- `notification not found`
- `unauthorized`

---

## 7. 推荐用法

### 远端节点

- 普通汇报：先走 `POST /notifications`
- 长期知识：只在确认高价值时走 `POST /memories`
- 需要主脑继续做的事：走 `POST /notifications`，再由主脑分诊成 `task`

### 本地主脑

- 轮询 `GET /notifications`
- 对新通知执行 `triage`
- 把已处理的重点结论沉淀进 `memories`
- 把后续动作沉淀进 `tasks`

---

## 8. 与其他文档的关系

- [cloud-brain-access](./cloud-brain-access)  
  讲接入方式、部署和雅加达节点怎么用。

- [architecture](./architecture)  
  讲 Cloud Brain 在 CortexOS 总架构里的位置。
