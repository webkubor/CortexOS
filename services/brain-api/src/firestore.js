import { Firestore, Timestamp } from '@google-cloud/firestore'

const firestore = new Firestore()

const memoriesCollection = firestore.collection('brain_memories')
const notificationsCollection = firestore.collection('brain_notifications')
const tasksCollection = firestore.collection('brain_tasks')

function normalizeText (value, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizeTags (tags) {
  if (!Array.isArray(tags)) return []

  return tags
    .map(tag => String(tag || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12)
}

function normalizeMetadata (metadata) {
  return metadata && typeof metadata === 'object' ? metadata : {}
}

function normalizePriority (value, fallback = 'medium') {
  const text = String(value || '').trim().toLowerCase()
  if (['low', 'medium', 'high', 'urgent'].includes(text)) return text
  return fallback
}

function normalizeNotificationType (value) {
  const text = String(value || '').trim().toLowerCase()
  if (['notification', 'memory', 'task', 'chat', 'alert'].includes(text)) return text
  return 'notification'
}

function normalizeNotificationStatus (value) {
  const text = String(value || '').trim().toLowerCase()
  if (['new', 'triaged', 'acted', 'archived'].includes(text)) return text
  return 'new'
}

function normalizeTaskStatus (value) {
  const text = String(value || '').trim().toLowerCase()
  if (['todo', 'in_progress', 'done', 'archived'].includes(text)) return text
  return 'todo'
}

function toIsoString (value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  return String(value)
}

function serializeDocument (snapshot) {
  return { id: snapshot.id, ...snapshot.data() }
}

function sortByNewest (rows, field = 'createdAt') {
  return rows.sort((left, right) => {
    const leftTime = Date.parse(left[field] || '') || 0
    const rightTime = Date.parse(right[field] || '') || 0
    return rightTime - leftTime
  })
}

export function serializeMemory (snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    project: data.project,
    content: data.content,
    agent: data.agent,
    source: data.source,
    kind: data.kind,
    summary: data.summary || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    metadata: data.metadata || {},
    createdAt: toIsoString(data.createdAt)
  }
}

export function serializeNotification (snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    project: data.project,
    title: data.title,
    content: data.content,
    agent: data.agent,
    source: data.source,
    type: data.type,
    priority: data.priority,
    status: data.status,
    read: Boolean(data.read),
    triageAction: data.triageAction || '',
    triageSummary: data.triageSummary || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    metadata: data.metadata || {},
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    actedAt: toIsoString(data.actedAt)
  }
}

export function serializeTask (snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    project: data.project,
    title: data.title,
    content: data.content,
    source: data.source,
    ownerAgent: data.ownerAgent,
    ownerSource: data.ownerSource,
    priority: data.priority,
    status: data.status,
    tags: Array.isArray(data.tags) ? data.tags : [],
    metadata: data.metadata || {},
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    completedAt: toIsoString(data.completedAt)
  }
}

export function validateMemoryPayload (payload = {}) {
  const project = normalizeText(payload.project)
  const content = normalizeText(payload.content)

  if (!project) return { ok: false, error: 'project is required' }
  if (!content) return { ok: false, error: 'content is required' }

  return {
    ok: true,
    value: {
      project,
      content,
      agent: normalizeText(payload.agent, 'unknown'),
      source: normalizeText(payload.source, 'unknown'),
      kind: normalizeText(payload.kind, 'note'),
      summary: normalizeText(payload.summary),
      tags: normalizeTags(payload.tags),
      metadata: normalizeMetadata(payload.metadata),
      createdAt: Timestamp.now()
    }
  }
}

export function validateNotificationPayload (payload = {}) {
  const project = normalizeText(payload.project)
  const content = normalizeText(payload.content)

  if (!project) return { ok: false, error: 'project is required' }
  if (!content) return { ok: false, error: 'content is required' }

  const now = Timestamp.now()

  return {
    ok: true,
    value: {
      project,
      title: normalizeText(payload.title, content.slice(0, 80)),
      content,
      agent: normalizeText(payload.agent, 'unknown'),
      source: normalizeText(payload.source, 'unknown'),
      type: normalizeNotificationType(payload.type),
      priority: normalizePriority(payload.priority),
      status: normalizeNotificationStatus(payload.status),
      read: Boolean(payload.read),
      triageAction: normalizeText(payload.triageAction),
      triageSummary: normalizeText(payload.triageSummary),
      tags: normalizeTags(payload.tags),
      metadata: normalizeMetadata(payload.metadata),
      createdAt: now,
      updatedAt: now,
      actedAt: null
    }
  }
}

export function validateTaskPayload (payload = {}) {
  const project = normalizeText(payload.project)
  const title = normalizeText(payload.title)

  if (!project) return { ok: false, error: 'project is required' }
  if (!title) return { ok: false, error: 'title is required' }

  const now = Timestamp.now()

  return {
    ok: true,
    value: {
      project,
      title,
      content: normalizeText(payload.content),
      source: normalizeText(payload.source, 'unknown'),
      ownerAgent: normalizeText(payload.ownerAgent || payload.agent, 'unknown'),
      ownerSource: normalizeText(payload.ownerSource || payload.source, 'unknown'),
      priority: normalizePriority(payload.priority),
      status: normalizeTaskStatus(payload.status),
      tags: normalizeTags(payload.tags),
      metadata: normalizeMetadata(payload.metadata),
      createdAt: now,
      updatedAt: now,
      completedAt: payload.status === 'done' ? now : null
    }
  }
}

export async function createMemory (payload) {
  const validated = validateMemoryPayload(payload)
  if (!validated.ok) return validated

  const docRef = await memoriesCollection.add(validated.value)
  const snapshot = await docRef.get()

  return { ok: true, value: serializeMemory(snapshot) }
}

export async function listMemories (filters = {}) {
  let query = memoriesCollection

  if (filters.project) query = query.where('project', '==', filters.project)
  if (filters.agent) query = query.where('agent', '==', filters.agent)

  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100)

  const snapshot = await query.get()
  let rows = snapshot.docs.map(serializeMemory)
  if (filters.tag) {
    rows = rows.filter(row => Array.isArray(row.tags) && row.tags.includes(filters.tag))
  }

  return sortByNewest(rows).slice(0, limit)
}

export async function createNotification (payload) {
  const validated = validateNotificationPayload(payload)
  if (!validated.ok) return validated

  const docRef = await notificationsCollection.add(validated.value)
  const snapshot = await docRef.get()

  return { ok: true, value: serializeNotification(snapshot) }
}

export async function listNotifications (filters = {}) {
  let query = notificationsCollection

  if (filters.project) query = query.where('project', '==', filters.project)
  if (filters.status) query = query.where('status', '==', normalizeNotificationStatus(filters.status))
  if (filters.read === 'true' || filters.read === true) query = query.where('read', '==', true)
  if (filters.read === 'false' || filters.read === false) query = query.where('read', '==', false)

  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100)
  const snapshot = await query.get()
  let rows = snapshot.docs.map(serializeNotification)

  if (filters.tag) {
    rows = rows.filter(row => Array.isArray(row.tags) && row.tags.includes(filters.tag))
  }

  return sortByNewest(rows).slice(0, limit)
}

export async function getNotificationById (id) {
  const snapshot = await notificationsCollection.doc(id).get()
  if (!snapshot.exists) return null
  return serializeNotification(snapshot)
}

export async function updateNotification (id, patch = {}) {
  const docRef = notificationsCollection.doc(id)
  const snapshot = await docRef.get()
  if (!snapshot.exists) return { ok: false, error: 'notification not found' }

  const nextPatch = {
    ...patch,
    updatedAt: Timestamp.now()
  }

  await docRef.update(nextPatch)
  const nextSnapshot = await docRef.get()
  return { ok: true, value: serializeNotification(nextSnapshot) }
}

export async function createTask (payload) {
  const validated = validateTaskPayload(payload)
  if (!validated.ok) return validated

  const docRef = await tasksCollection.add(validated.value)
  const snapshot = await docRef.get()

  return { ok: true, value: serializeTask(snapshot) }
}

export async function listTasks (filters = {}) {
  let query = tasksCollection

  if (filters.project) query = query.where('project', '==', filters.project)
  if (filters.status) query = query.where('status', '==', normalizeTaskStatus(filters.status))

  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100)
  const snapshot = await query.get()
  let rows = snapshot.docs.map(serializeTask)

  if (filters.tag) {
    rows = rows.filter(row => Array.isArray(row.tags) && row.tags.includes(filters.tag))
  }

  return sortByNewest(rows).slice(0, limit)
}

export async function applyNotificationTriage ({ notificationId, action, summary, tags, metadata }) {
  const notification = await getNotificationById(notificationId)
  if (!notification) return { ok: false, error: 'notification not found' }

  const triageAction = normalizeText(action).toLowerCase()
  const triageSummary = normalizeText(summary, notification.title)
  const mergedTags = Array.from(new Set([...notification.tags, ...normalizeTags(tags)]))
  const mergedMetadata = {
    ...notification.metadata,
    ...normalizeMetadata(metadata),
    triagedFromNotificationId: notification.id
  }

  let created = null

  if (triageAction === 'memory') {
    const result = await createMemory({
      project: notification.project,
      content: notification.content,
      agent: notification.agent,
      source: notification.source,
      kind: 'notification-summary',
      summary: triageSummary,
      tags: mergedTags,
      metadata: mergedMetadata
    })
    if (!result.ok) return result
    created = { type: 'memory', value: result.value }
  } else if (triageAction === 'task') {
    const result = await createTask({
      project: notification.project,
      title: triageSummary || notification.title,
      content: notification.content,
      source: notification.source,
      agent: notification.agent,
      ownerSource: notification.source,
      priority: notification.priority,
      status: 'todo',
      tags: mergedTags,
      metadata: mergedMetadata
    })
    if (!result.ok) return result
    created = { type: 'task', value: result.value }
  }

  const nextStatus = triageAction === 'archive' ? 'archived' : triageAction === 'ignore' ? 'archived' : created ? 'acted' : 'triaged'

  const updated = await updateNotification(notification.id, {
    status: nextStatus,
    read: true,
    triageAction,
    triageSummary,
    actedAt: created ? Timestamp.now() : null,
    tags: mergedTags,
    metadata: mergedMetadata
  })

  if (!updated.ok) return updated

  return {
    ok: true,
    value: {
      notification: updated.value,
      created
    }
  }
}
