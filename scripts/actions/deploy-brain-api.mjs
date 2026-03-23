import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = process.cwd()
const servicePath = resolve(repoRoot, 'services/brain-api')

function fail (message) {
  console.error(`brain-api:deploy 失败: ${message}`)
  process.exit(1)
}

function run (command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options
  })

  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} 执行失败`)
  }

  return result
}

function capture (command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8'
  })

  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} 执行失败`)
  }

  return String(result.stdout || '').trim()
}

if (!existsSync(servicePath)) {
  fail(`找不到服务目录: ${servicePath}`)
}

const project = process.env.GCP_PROJECT || capture('gcloud', ['config', 'get-value', 'project'])
const region = process.env.CLOUD_RUN_REGION || 'asia-southeast2'
const serviceName = process.env.BRAIN_API_SERVICE || 'brain-api'
const token = String(process.env.BRAIN_API_TOKEN || '').trim()

if (!project || project === '(unset)') {
  fail('当前没有可用的 gcloud project，请先执行 gcloud config set project <项目名>')
}

if (!token) {
  fail('缺少 BRAIN_API_TOKEN，请先 export BRAIN_API_TOKEN=<随机长 token>')
}

const serviceAccount = `brain-api@${project}.iam.gserviceaccount.com`

console.log(`开始部署 ${serviceName}`)
console.log(`项目: ${project}`)
console.log(`区域: ${region}`)
console.log(`服务目录: ${servicePath}`)
console.log(`服务账号: ${serviceAccount}`)

run('gcloud', [
  'run',
  'deploy',
  serviceName,
  '--source',
  servicePath,
  '--region',
  region,
  '--service-account',
  serviceAccount,
  '--allow-unauthenticated',
  '--set-env-vars',
  `BRAIN_API_TOKEN=${token}`
], {
  cwd: repoRoot
})
