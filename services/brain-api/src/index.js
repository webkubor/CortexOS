import Fastify from 'fastify'
import {
  applyNotificationTriage,
  createMemory,
  createNotification,
  createTask,
  listMemories,
  listNotifications,
  listTasks
} from './firestore.js'
import { suggestTriageAction } from './triage.js'

const app = Fastify({
  logger: true
})

function isHealthRoute (request) {
  return request.routerPath === '/health' || request.url === '/health'
}

function getBearerToken (request) {
  const authorization = String(request.headers.authorization || '')
  if (!authorization.startsWith('Bearer ')) return ''
  return authorization.slice('Bearer '.length).trim()
}

function replyBadRequest (reply, result) {
  reply.code(400)
  return {
    ok: false,
    error: result.error
  }
}

const apiToken = String(process.env.BRAIN_API_TOKEN || '').trim()

app.addHook('onRequest', async (request, reply) => {
  if (isHealthRoute(request)) return
  if (!apiToken) return

  const token = getBearerToken(request)
  if (token === apiToken) return

  reply.code(401)
  return {
    ok: false,
    error: 'unauthorized'
  }
})

app.get('/health', async () => {
  return {
    ok: true,
    service: 'brain-api',
    version: '0.2.0',
    authMode: apiToken ? 'bearer' : 'disabled',
    capabilities: ['memories', 'notifications', 'tasks', 'triage'],
    timestamp: new Date().toISOString()
  }
})

app.post('/memories', async (request, reply) => {
  const result = await createMemory(request.body)
  if (!result.ok) return replyBadRequest(reply, result)

  reply.code(201)
  return {
    ok: true,
    memory: result.value
  }
})

app.get('/memories', async (request) => {
  const memories = await listMemories({
    project: request.query?.project,
    agent: request.query?.agent,
    tag: request.query?.tag,
    limit: request.query?.limit
  })

  return {
    ok: true,
    count: memories.length,
    memories
  }
})

app.post('/notifications', async (request, reply) => {
  const result = await createNotification(request.body)
  if (!result.ok) return replyBadRequest(reply, result)

  const suggestion = suggestTriageAction(result.value)

  reply.code(201)
  return {
    ok: true,
    notification: result.value,
    suggestion
  }
})

app.get('/notifications', async (request) => {
  const notifications = await listNotifications({
    project: request.query?.project,
    status: request.query?.status,
    tag: request.query?.tag,
    read: request.query?.read,
    limit: request.query?.limit
  })

  return {
    ok: true,
    count: notifications.length,
    notifications
  }
})

app.post('/notifications/:id/triage', async (request, reply) => {
  const notification = request.body?.notification || {}
  const suggestion = suggestTriageAction({
    ...notification,
    title: request.body?.title || notification.title,
    content: request.body?.content || notification.content
  })

  const result = await applyNotificationTriage({
    notificationId: request.params.id,
    action: request.body?.action || suggestion.action,
    summary: request.body?.summary || suggestion.summary,
    tags: request.body?.tags,
    metadata: request.body?.metadata
  })

  if (!result.ok) return replyBadRequest(reply, result)

  return {
    ok: true,
    suggestion,
    ...result.value
  }
})

app.post('/tasks', async (request, reply) => {
  const result = await createTask(request.body)
  if (!result.ok) return replyBadRequest(reply, result)

  reply.code(201)
  return {
    ok: true,
    task: result.value
  }
})

app.get('/tasks', async (request) => {
  const tasks = await listTasks({
    project: request.query?.project,
    status: request.query?.status,
    tag: request.query?.tag,
    limit: request.query?.limit
  })

  return {
    ok: true,
    count: tasks.length,
    tasks
  }
})

const port = Number(process.env.PORT) || 8080
const host = process.env.HOST || '0.0.0.0'

try {
  await app.listen({ port, host })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
