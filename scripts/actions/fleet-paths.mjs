import fs from 'fs'
import os from 'os'
import path from 'path'

function expandHomePath (input, homeDir) {
  if (!input) return input
  if (input === '~') return homeDir
  if (input.startsWith('~/')) return path.join(homeDir, input.slice(2))
  return input
}

function resolveAssistantMemoryHome (projectRoot) {
  const homeDir = process.env.HOME || os.homedir()
  const assistantMemoryRaw = process.env.CORTEXOS_ASSISTANT_MEMORY_HOME || path.join(projectRoot, '.memory')
  return path.resolve(expandHomePath(assistantMemoryRaw, homeDir))
}

function writeDefaultFleetFile (fleetFile) {
  const template = `# 🌐 星际舰队任务编排板 (Multi-Agent Fleet Status)

---

## 🟢 当前活跃并发节点 (Active Nodes)

| 节点 ID (模型/别名) | 模型标签 (Agent) | 角色 (Role) | 物理坐标 (绝对工作路径) | 当前执行的核心任务 (含目标) | 领命时间 | 状态与锁 (Status & Locks) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *(示例节点)* | *(Gemini/Codex/Claude...)* | *(前端/后端)* | \`~/Desktop/some-project\` | *(示例任务)* | *YYYY-MM-DD HH:MM* | \`[ 等待分配 ]\` |
`
  fs.writeFileSync(fleetFile, template, 'utf8')
}

function copyIfMissing (targetFile, legacyFile) {
  if (fs.existsSync(targetFile) || !fs.existsSync(legacyFile)) return
  fs.copyFileSync(legacyFile, targetFile)
}

export function ensureFleetPaths (projectRoot) {
  const assistantMemoryHome = resolveAssistantMemoryHome(projectRoot)
  const fleetDir = path.join(assistantMemoryHome, 'fleet')
  const fleetFile = path.join(fleetDir, 'fleet_status.md')
  const fleetMetaFile = path.join(fleetDir, 'fleet_meta.json')
  const legacyFleetFile = path.join(projectRoot, 'docs/memory/fleet_status.md')
  const legacyMetaFile = path.join(projectRoot, 'docs/memory/fleet_meta.json')

  fs.mkdirSync(fleetDir, { recursive: true })
  copyIfMissing(fleetFile, legacyFleetFile)
  copyIfMissing(fleetMetaFile, legacyMetaFile)
  if (!fs.existsSync(fleetFile)) writeDefaultFleetFile(fleetFile)

  return {
    assistantMemoryHome,
    fleetDir,
    fleetFile,
    fleetMetaFile,
    legacyFleetFile,
    legacyMetaFile
  }
}
