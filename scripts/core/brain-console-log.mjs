#!/usr/bin/env node

const color = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
}

const typeStyles = {
  任务: { icon: '🛠', tone: 'cyan' },
  Agent: { icon: '🤖', tone: 'blue' },
  通知: { icon: '📨', tone: 'magenta' },
  状态: { icon: '🧠', tone: 'cyan' },
  前端: { icon: '🖥', tone: 'blue' },
  同步: { icon: '🔄', tone: 'cyan' },
  信息: { icon: 'ℹ', tone: 'dim' },
  错误: { icon: '✖', tone: 'red' }
}

const statusStyles = {
  开始: { tone: 'blue' },
  完成: { tone: 'green' },
  成功: { tone: 'green' },
  在线: { tone: 'green' },
  待命: { tone: 'dim' },
  跳过: { tone: 'dim' },
  警告: { tone: 'yellow' },
  失败: { tone: 'red' },
  异常: { tone: 'red' }
}

function now () {
  return new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    timeZone: 'Asia/Shanghai'
  })
}

function paint (text, tone = 'dim') {
  if (!color[tone]) return text
  return `${color[tone]}${text}${color.reset}`
}

function label (text, tone = 'dim') {
  return paint(`【${text}】`, tone)
}

export function logEvent (type, topic, status, message = '') {
  const typeStyle = typeStyles[type] || typeStyles.信息
  const statusStyle = statusStyles[status] || { tone: 'dim' }
  const parts = [
    paint(typeStyle.icon, typeStyle.tone),
    paint(now(), 'dim'),
    label(type, typeStyle.tone),
    label(topic, 'bold'),
    label(status, statusStyle.tone)
  ]

  if (message) parts.push(message)
  console.log(parts.join(' '))
}

export function logSection (title) {
  console.log(`${paint('─'.repeat(56), 'dim')}`)
  console.log(`${paint('🧠', 'cyan')} ${paint(title, 'bold')}`)
}

export function firstLine (text) {
  const stripAnsi = (value) => value.replace(/\x1B\[[0-9;]*m/g, '')
  const lines = String(text || '')
    .split('\n')
    .map(item => item.trim())
    .map(stripAnsi)
    .filter(Boolean)
    .filter(item => !/^[─-]+$/.test(item))

  return lines[0] || '无输出'
}
