function includesAny (text, keywords) {
  return keywords.some(keyword => text.includes(keyword))
}

function summarizeNotification (notification) {
  return String(notification.title || notification.content || '').trim().slice(0, 120)
}

export function suggestTriageAction (notification = {}) {
  const title = String(notification.title || '').toLowerCase()
  const content = String(notification.content || '').toLowerCase()
  const joined = `${title} ${content}`.trim()

  if (includesAny(joined, ['error', 'failed', 'timeout', 'offline', 'down', '异常', '失败', '挂了', '离线', '超时'])) {
    return {
      action: 'task',
      reason: '检测到异常或故障语义，更适合进入待处理事项。',
      summary: summarizeNotification(notification)
    }
  }

  if (includesAny(joined, ['todo', 'follow up', 'need', 'please', 'review', '待处理', '需要', '请确认', '待办', '确认'])) {
    return {
      action: 'task',
      reason: '检测到后续动作或确认诉求，更适合转为任务。',
      summary: summarizeNotification(notification)
    }
  }

  if (includesAny(joined, ['completed', 'resolved', 'deployed', '上线', '完成', '已修复', '已部署', '结论', '总结'])) {
    return {
      action: 'memory',
      reason: '检测到结论或完成态语义，适合沉淀为重点记忆。',
      summary: summarizeNotification(notification)
    }
  }

  if (includesAny(joined, ['sync', 'heartbeat', 'status', '同步', '心跳', '状态'])) {
    return {
      action: 'archive',
      reason: '更像普通同步状态，默认不沉淀长期记忆。',
      summary: summarizeNotification(notification)
    }
  }

  return {
    action: 'memory',
    reason: '默认按重点摘要沉淀，避免遗漏高价值信息。',
    summary: summarizeNotification(notification)
  }
}
