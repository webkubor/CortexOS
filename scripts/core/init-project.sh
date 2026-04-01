#!/usr/bin/env bash
set -euo pipefail

# --- 核心颜色定义 ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_CONFIG="${ROOT_DIR}/config/brain-runtime.json"
LOCAL_BIN_DIR="${HOME}/.local/bin"
LOCAL_BRAIN_API_PORT="${BRAIN_API_PORT:-3679}"
LOCAL_BRAIN_API_URL="http://127.0.0.1:${LOCAL_BRAIN_API_PORT}"
ZSHRC_PATH="${HOME}/.zshrc"
PATH_MARKER="# CortexOS local bin"

printf "${BLUE}🚀 正在启动 CortexOS 大脑初始化程序...${NC}\n"

# 1. 检查必备工具
check_tool() {
  if ! command -v "$1" &> /dev/null; then
    printf "${RED}❌ 错误: 未发现 $1。请先安装它！${NC}\n"
    exit 1
  fi
}

check_tool "pnpm"
check_tool "uv"

ensure_local_commands() {
  printf "${GREEN}🔗 正在安装 CortexOS 命令入口...${NC}\n"
  mkdir -p "$LOCAL_BIN_DIR"
  ln -sf "${ROOT_DIR}/bin/cortexos" "${LOCAL_BIN_DIR}/cortexos"
  ln -sf "${ROOT_DIR}/bin/cs" "${LOCAL_BIN_DIR}/cs"

  if [ -f "$ZSHRC_PATH" ] && ! grep -Fq "$PATH_MARKER" "$ZSHRC_PATH"; then
    printf "\n%s\nexport PATH=\"\$HOME/.local/bin:\$PATH\"\n" "$PATH_MARKER" >> "$ZSHRC_PATH"
  fi

  if [[ ":$PATH:" != *":${LOCAL_BIN_DIR}:"* ]]; then
    export PATH="${LOCAL_BIN_DIR}:$PATH"
  fi
}

wait_for_local_brain_api() {
  local tries=15
  while [ "$tries" -gt 0 ]; do
    if curl -fsS "${LOCAL_BRAIN_API_URL}/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    tries=$((tries - 1))
  done
  return 1
}

ensure_local_commands

# 2. 检查并引导安装 PM2
if ! command -v "pm2" &> /dev/null; then
  printf "${YELLOW}⚠️ 未发现 PM2，正在自动安装...${NC}\n"
  npm install -g pm2
fi
printf "${GREEN}✅ PM2 已就绪。${NC}\n"

# 3. 初始化 Node.js 依赖
printf "${GREEN}📦 正在安装 Node.js 依赖 (pnpm)...${NC}\n"
pnpm install

# 4. 初始化 Python 环境
printf "${GREEN}🐍 正在配置 Python 环境 (uv)...${NC}\n"
uv sync

# 5. 检查并拉取 Ollama 语义模型
if command -v "ollama" &> /dev/null; then
  printf "${GREEN}🧠 正在检查 Ollama 语义模型 (nomic-embed-text)...${NC}\n"
  ollama pull nomic-embed-text
else
  printf "${YELLOW}⚠️ 未发现 Ollama，跳过本地语义模型初始化。${NC}\n"
fi

# 6. 密钥模板引导
SECRETS_DIR="${CORTEXOS_SECRET_HOME:-$HOME/Documents/memory/secrets}"
LARK_ENV="$SECRETS_DIR/lark.env"
LARK_STATUS="${RED}OFFLINE (未配置 Webhook)${NC}"
if [ ! -f "$LARK_ENV" ]; then
  printf "${YELLOW}⚠️ 正在生成飞书推送模版...${NC}\n"
  mkdir -p "$SECRETS_DIR"
  echo "LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR_TOKEN" > "$LARK_ENV"
  printf "   ✅ 已生成 ${LARK_ENV}，请填入 Token 即可开启实时战报。\n"
else
  LARK_STATUS="${GREEN}ONLINE${NC}"
fi

# 7. 执行首次知识入库 (ChromaDB)
printf "${GREEN}📥 正在执行首次全量知识入库 (Ingest)...${NC}\n"
uv run ./scripts/ingest/chroma_ingest.py

# 8. 同步 Skills 管理台（原生 + 本机安装态）
printf "${GREEN}🧩 正在同步 Skills 管理台...${NC}\n"
node ./scripts/tools/sync-skills-management.mjs

# 9. 启动或重启自动驾驶进程 (PM2)
if command -v "pm2" &> /dev/null; then
  printf "${GREEN}🔄 正在启动主脑常驻服务与本地 API (PM2)...${NC}\n"
  node ./scripts/actions/brain-stack-up.mjs
fi

# 10. 智商自检
RAG_STATUS="${RED}PHYSICAL MODE (Ollama 未就绪)${NC}"
if command -v "ollama" &> /dev/null && curl -s http://localhost:11434/api/tags | grep -q "nomic-embed-text"; then
  RAG_STATUS="${GREEN}SEMANTIC MODE (Full RAG Ready)${NC}"
fi

LOCAL_API_STATUS="${RED}OFFLINE${NC}"
if wait_for_local_brain_api; then
  LOCAL_API_STATUS="${GREEN}ONLINE (${LOCAL_BRAIN_API_URL})${NC}"
else
  printf "${YELLOW}⚠️ 本地 brain-api 未在预期时间内通过健康检查：${LOCAL_BRAIN_API_URL}/health${NC}\n"
fi

# 11. 完成
printf "\n${GREEN}🎉 恭喜！CortexOS 大脑已全面部署成功。${NC}\n"
printf '%s\n' "----------------------------------------"
printf "🧠 ${BLUE}智商状态: ${NC}$RAG_STATUS\n"
printf "📡 ${BLUE}推送状态: ${NC}$LARK_STATUS\n"
printf "💓 ${BLUE}自动驾驶: ${NC}${GREEN}ONLINE (PM2)${NC}\n"
printf "🫀 ${BLUE}本地 API: ${NC}$LOCAL_API_STATUS\n"
printf "⌨️ ${BLUE}CLI 命令: ${NC}${GREEN}cortexos / cs${NC}\n"
printf "🖥 ${BLUE}主脑控制台: ${NC}${GREEN}pnpm brain:tui${NC}\n"
printf '%s\n' "----------------------------------------"
printf "🛠 ${YELLOW}如何体验大脑的威力？${NC}\n"
printf " 1. ${GREEN}测试语义记忆${NC}: 运行 ${YELLOW}node scripts/xiaozhu_chat.mjs${NC} 并问它关于本项目的规则。\n"
printf " 2. ${GREEN}测试实时战报${NC}: 在 ${BLUE}$LARK_ENV${NC} 填入 Webhook 后，改动任意文档，5 分钟内飞书将收到通知。\n"
printf " 3. ${GREEN}验证物理搜索${NC}: 运行 ${YELLOW}./scripts/rag_probe.sh \"你的查询\"${NC}\n"
printf '%s\n' "----------------------------------------"
printf "💡 ${BLUE}常用管理：${NC}\n"
printf " - 一键初始化: ${YELLOW}pnpm bootstrap${NC}\n"
printf " - 查看主脑统一日志: ${YELLOW}pnpm brain:logs${NC}\n"
printf " - 查看主脑运行状态: ${YELLOW}pnpm brain:status${NC}\n"
printf " - 启动终端主脑控制台: ${YELLOW}pnpm brain:tui${NC}\n"
printf '%s\n' "----------------------------------------"
