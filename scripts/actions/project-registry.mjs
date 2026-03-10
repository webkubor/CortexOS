#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { ensureFleetPaths } from './fleet-paths.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const { assistantMemoryHome } = ensureFleetPaths(projectRoot)
const projectsDir = path.join(assistantMemoryHome, 'projects')
const plansDir = path.join(assistantMemoryHome, 'plans', 'projects')
const registryFile = path.join(projectsDir, 'registry.json')
const indexFile = path.join(projectsDir, 'index.md')
const readmeFile = path.join(projectsDir, 'README.md')

function nowIso () {
  return new Date().toISOString()
}

function nowLocal () {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function sanitizeText (value) {
  return String(value ?? '').replace(/\|/g, '｜').trim()
}

function displayPath (targetPath) {
  const homeDir = process.env.HOME || ''
  if (homeDir && targetPath.startsWith(homeDir)) {
    return `~${targetPath.slice(homeDir.length)}`
  }
  return targetPath
}

function slugify (value) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project'
}

function readJsonSafe (file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function resolveProjectRoot (workspace) {
  // 优先按 Git 根目录归档，避免同一项目在子目录重复登记多次。
  try {
    const root = execFileSync('git', ['-C', workspace, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    if (root) return path.resolve(root)
  } catch {}
  return path.resolve(workspace)
}

function detectProjectName (rootPath) {
  const dirName = path.basename(rootPath)
  const packageJson = path.join(rootPath, 'package.json')
  if (fs.existsSync(packageJson)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
      if (parsed.name) {
        const packageName = sanitizeText(parsed.name)
        // 包名和目录名仅大小写不同的场景，保留目录名可读性更好。
        if (packageName.toLowerCase() === dirName.toLowerCase()) return dirName
        return packageName
      }
    } catch {}
  }
  return dirName
}

function detectProjectType (rootPath) {
  if (fs.existsSync(path.join(rootPath, 'package.json'))) return 'node'
  if (fs.existsSync(path.join(rootPath, 'pyproject.toml'))) return 'python'
  if (fs.existsSync(path.join(rootPath, 'Cargo.toml'))) return 'rust'
  if (fs.existsSync(path.join(rootPath, '.git'))) return 'git'
  return 'folder'
}

function ensureDirs () {
  fs.mkdirSync(projectsDir, { recursive: true })
  fs.mkdirSync(plansDir, { recursive: true })
}

function parseLegacyIndex () {
  if (!fs.existsSync(indexFile)) return []
  const text = fs.readFileSync(indexFile, 'utf8')
  const lines = text.split('\n')
  const results = []

  for (let i = 0; i < lines.length; i++) {
    // 兼容旧版手写索引，首次切换到 registry.json 时自动导入。
    const headerMatch = lines[i].match(/^- `([^`]+)`（([^）]+)）$/)
    if (!headerMatch) continue
    const name = sanitizeText(headerMatch[1])
    const kind = sanitizeText(headerMatch[2])
    const pathLine = lines[i + 1] || ''
    const relLine = lines[i + 2] || ''
    const pathMatch = pathLine.match(/路径：`([^`]+)`/)
    const relatedMatch = relLine.match(/关联(前端|后端)：`?([^`]+)`?/) || relLine.match(/关联(前端|后端)：(.+)/)
    if (!pathMatch) continue
    const rootPath = path.resolve(pathMatch[1])
    const slug = slugify(name)
    results.push({
      slug,
      name,
      kind,
      rootPath,
      lastWorkspace: rootPath,
      type: detectProjectType(rootPath),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastAgent: '',
      lastRole: kind,
      lastTask: '历史导入',
      lastNodeId: '',
      participants: [],
      relatedProjects: relatedMatch ? [sanitizeText(relatedMatch[2])] : [],
      commandCenter: `${slug}-command-center.md`
    })
  }

  return results
}

function loadRegistry () {
  const fallback = {
    version: 1,
    generatedAt: nowIso(),
    projects: []
  }
  const existing = readJsonSafe(registryFile, null)
  if (existing && Array.isArray(existing.projects)) return existing

  const legacyProjects = parseLegacyIndex()
  return {
    version: 1,
    generatedAt: nowIso(),
    projects: legacyProjects
  }
}

function upsertProject (registry, payload) {
  const rootPath = resolveProjectRoot(payload.workspace)
  const workspace = path.resolve(payload.workspace)
  const name = detectProjectName(rootPath)
  const slug = slugify(name)
  const type = detectProjectType(rootPath)
  const existing = registry.projects.find(item => item.rootPath === rootPath)
  const updatedAt = nowIso()

  // 先构建统一对象，再决定是更新已有条目还是插入新条目。
  const base = existing || {
    slug,
    name,
    kind: payload.role || '未分配',
    rootPath,
    lastWorkspace: workspace,
    type,
    createdAt: updatedAt,
    updatedAt,
    lastAgent: '',
    lastRole: payload.role || '未分配',
    lastTask: payload.task,
    lastNodeId: payload.nodeId || '',
    participants: [],
    relatedProjects: [],
    commandCenter: `${slug}-command-center.md`
  }

  base.slug = slugify(base.slug || slug)
  base.name = name
  base.rootPath = rootPath
  base.lastWorkspace = workspace
  base.type = type
  base.kind = payload.role || base.kind || '未分配'
  base.lastAgent = payload.agent || base.lastAgent || ''
  base.lastRole = payload.role || base.lastRole || '未分配'
  base.lastTask = payload.task || base.lastTask || '待补充任务'
  base.lastNodeId = payload.nodeId || base.lastNodeId || ''
  base.updatedAt = updatedAt
  base.commandCenter = base.commandCenter || `${base.slug}-command-center.md`
  base.participants = Array.from(new Set([...(base.participants || []), payload.agent].filter(Boolean))).sort()

  if (existing) {
    Object.assign(existing, base)
    return existing
  }

  registry.projects.push(base)
  registry.projects.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  return base
}

function renderIndex (registry) {
  const rows = registry.projects
    .slice()
    // 首页优先看最近活跃项目，排序按最后触达时间倒序。
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .map(project => {
      const commandLink = `../plans/projects/${project.commandCenter}`
      return `| ${project.name} | \`${displayPath(project.rootPath)}\` | \`${displayPath(project.lastWorkspace)}\` | ${project.type} | ${project.lastAgent || '-'} | ${project.lastRole || '-'} | ${project.lastTask || '-'} | ${project.updatedAt ? project.updatedAt.slice(0, 16).replace('T', ' ') : '-'} | [打开](${commandLink}) |`
    })
    .join('\n')

  return `# 项目索引（小烛外部大脑）

> 位置：\`$CODEX_HOME/.memory/projects/index.md\`
> 说明：AI Team 一旦对某个项目执行 \`fleet:claim\` 或 \`fleet:checkin\`，项目索引会自动检查路径并登记/刷新。

## 当前活跃项目总表

| 项目 | 项目根路径 | 最近工作路径 | 类型 | 最近 Agent | 最近角色 | 最近任务 | 最后触达 | 指挥中心 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${rows || '| *(暂无项目)* | - | - | - | - | - | - | - | - |'}

## 使用约定

- AI Team 参与新项目时，不需要手工先建索引；首次 \`fleet:claim\` 会自动落盘。
- 同一项目再次参与时，会按项目根路径去重，只刷新最近工作路径、任务、角色与参与 Agent。
- 每个项目会自动生成一个稳定的 command-center 文件，作为后续协作入口。
- 项目正文知识、复盘、方案继续沉淀到 \`~/Documents/memory/knowledge/\`。
`
}

function renderProjectsReadme () {
  return [
    '# 项目索引目录（小烛外部大脑）',
    '',
    '> 这里是小烛维护的项目控制层，不是用户长期知识库正文。它负责回答两个问题：当前有哪些项目，以及 AI Team 最近在这些项目里做了什么。',
    '',
    '## 这层的职责',
    '',
    '- 记录项目是否已被小烛识别',
    '- 记录最近一次实际工作发生在哪个路径',
    '- 记录最近参与的 Agent、角色、任务与时间',
    '- 为每个项目维护一份稳定命名的 command center',
    '',
    '## 目录说明',
    '',
    '- `registry.json`：机器可维护的数据源，供脚本读写',
    '- `index.md`：给人读的项目总索引，总览所有项目当前状态',
    '- `../plans/projects/*.md`：每个项目对应的协作指挥中心，既有自动区块，也允许人工补充上下文',
    '',
    '## 自动登记规则',
    '',
    '- AI Team 对某个路径执行 `fleet:claim` 或 `fleet:checkin` 时：自动检查该项目是否已登记',
    '- 未登记：创建项目条目、回填基础元信息、生成 command center',
    '- 已登记：刷新最近任务、最近 Agent、最近工作路径、最后触达时间',
    '- 如果项目根目录可解析为 Git 仓库顶层，则统一按 Git 根目录归档，避免同一项目出现多条重复路径',
    '',
    '## command center 约定',
    '',
    '- 文件命名使用稳定格式：`<project>-command-center.md`',
    '- 文件头部 `AUTO:START / AUTO:END` 区块由脚本维护',
    '- 自动区块以下可以人工写入项目目标、阻塞点、里程碑和临时判断，不会被同步脚本覆盖',
    '',
    '## 手动补录',
    '',
    '```bash',
    'node scripts/actions/project-registry.mjs --workspace "$PWD" --agent Codex --role 后端 --task "补录项目"',
    '```',
    '',
    '## 判断是否同步成功',
    '',
    '- `index.md` 出现对应项目行',
    '- `registry.json` 出现对应项目对象',
    '- `../plans/projects/` 下出现对应 command center',
    '- 项目再次开工后，最近任务与最后触达时间会自动刷新',
    ''
  ].join('\n')
}

function renderCommandCenterAutoBlock (project) {
  const participants = (project.participants || []).join('、') || '待登记'
  return [
    '<!-- AUTO:START -->',
    `更新时间：${nowLocal()}`,
    '',
    '## 项目快照',
    '',
    `- 项目索引：\`$CODEX_HOME/.memory/projects/index.md\``,
    `- 项目根路径：\`${displayPath(project.rootPath)}\``,
    `- 最近工作路径：\`${displayPath(project.lastWorkspace)}\``,
    `- 最近任务：${project.lastTask || '待补充任务'}`,
    `- 最近活跃 Agent：${project.lastAgent || '待登记'}`,
    `- 最近角色：${project.lastRole || '未分配'}`,
    `- 参与过的 Agent：${participants}`,
    '<!-- AUTO:END -->'
  ].join('\n')
}

function ensureCommandCenter (project) {
  const filePath = path.join(plansDir, project.commandCenter)
  const title = `# ${project.name} 项目指挥中心`
  const autoBlock = renderCommandCenterAutoBlock(project)

  if (!fs.existsSync(filePath)) {
    const content = [
      title,
      '',
      autoBlock,
      '',
      '## 协作约定',
      '',
      '- 队长公告：写在本文件顶部追加。',
      '- 队友回报：使用固定格式追加（完成 / 下一步 / 阻塞）。',
      '- 阻塞升级：直接在本文件标记 `BLOCKED` 并同步 fleet 任务字段。',
      '',
      '## 项目备注',
      '',
      '- 待补充。',
      ''
    ].join('\n')
    fs.writeFileSync(filePath, content, 'utf8')
    return filePath
  }

  const text = fs.readFileSync(filePath, 'utf8')
  // 只覆盖自动区块，保留人工补充的背景、阻塞和判断。
  if (text.includes('<!-- AUTO:START -->') && text.includes('<!-- AUTO:END -->')) {
    const next = text.replace(/<!-- AUTO:START -->[\s\S]*?<!-- AUTO:END -->/, autoBlock)
    fs.writeFileSync(filePath, next, 'utf8')
    return filePath
  }

  const next = [title, '', autoBlock, '', text].join('\n')
  fs.writeFileSync(filePath, next, 'utf8')
  return filePath
}

export function syncProjectRegistry (payload) {
  const dryRun = Boolean(payload?.dryRun)
  ensureDirs()
  const registry = loadRegistry()
  const project = upsertProject(registry, payload)
  registry.generatedAt = nowIso()
  const commandCenterFile = path.join(plansDir, project.commandCenter)
  if (!dryRun) {
    // 每次同步都顺手兜底全部 command center，防止历史项目缺文件。
    registry.projects.forEach(item => ensureCommandCenter(item))
    fs.writeFileSync(registryFile, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
    fs.writeFileSync(indexFile, `${renderIndex(registry)}\n`, 'utf8')
    fs.writeFileSync(readmeFile, `${renderProjectsReadme()}\n`, 'utf8')
  }
  return {
    project,
    registryFile,
    indexFile,
    commandCenterFile
  }
}

function parseArgs (argv) {
  const args = {
    workspace: process.cwd(),
    agent: '',
    role: '未分配',
    task: '待补充任务',
    nodeId: '',
    dryRun: false
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === '--workspace' && argv[i + 1]) args.workspace = argv[++i]
    else if (token === '--agent' && argv[i + 1]) args.agent = argv[++i]
    else if (token === '--role' && argv[i + 1]) args.role = argv[++i]
    else if (token === '--task' && argv[i + 1]) args.task = argv[++i]
    else if (token === '--node-id' && argv[i + 1]) args.nodeId = argv[++i]
    else if (token === '--dry-run') args.dryRun = true
  }

  args.workspace = path.resolve(args.workspace)
  args.agent = sanitizeText(args.agent)
  args.role = sanitizeText(args.role)
  args.task = sanitizeText(args.task)
  args.nodeId = sanitizeText(args.nodeId)
  return args
}

function main () {
  const args = parseArgs(process.argv.slice(2))
  const preview = syncProjectRegistry(args)
  console.log(JSON.stringify({
    ok: true,
    dryRun: args.dryRun,
    project: {
      name: preview.project.name,
      rootPath: preview.project.rootPath,
      lastWorkspace: preview.project.lastWorkspace,
      commandCenter: preview.project.commandCenter
    },
    files: {
      registryFile: preview.registryFile,
      indexFile: preview.indexFile,
      commandCenterFile: preview.commandCenterFile
    }
  }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
