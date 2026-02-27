#!/usr/bin/env bash
set -euo pipefail

# --- 核心颜色定义 ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

printf "${BLUE}🚀 正在启动 AI_Common 大脑初始化程序...${NC}\n"

# 1. 检查必备工具
check_tool() {
  if ! command -v "$1" &> /dev/null; then
    printf "${RED}❌ 错误: 未发现 $1。请先安装它！${NC}\n"
    exit 1
  fi
}

check_tool "pnpm"
check_tool "uv"
check_tool "ollama"

# 2. 初始化 Node.js 依赖
printf "${GREEN}📦 正在安装 Node.js 依赖 (pnpm)...${NC}\n"
pnpm install

# 3. 初始化 Python 虚拟环境与依赖
printf "${GREEN}🐍 正在配置 Python 环境 (uv)...${NC}\n"
uv sync

# 4. 检查并拉取 Ollama 语义模型
printf "${GREEN}🧠 正在检查 Ollama 语义模型 (nomic-embed-text)...${NC}\n"
ollama pull nomic-embed-text

# 5. 密钥模板引导
SECRETS_DIR="./docs/secrets"
LARK_ENV="$SECRETS_DIR/lark.env"
LARK_STATUS="${RED}OFFLINE${NC}"
if [ ! -f "$LARK_ENV" ]; then
  printf "${YELLOW}⚠️ 未发现飞书推送配置。正在生成模版...${NC}\n"
  mkdir -p "$SECRETS_DIR"
  echo "LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/YOUR_TOKEN" > "$LARK_ENV"
  printf "   ✅ 已生成 $LARK_ENV，请填入 Token 即可生效。\n"
else
  LARK_STATUS="${GREEN}ONLINE${NC}"
fi

# 6. 执行首次知识入库 (ChromaDB)
printf "${GREEN}📥 正在执行首次全量知识入库 (Ingest)...${NC}\n"
uv run ./scripts/ingest/chroma_ingest.py

# 7. 智商自检
RAG_STATUS="${RED}PHYSICAL MODE${NC}"
if curl -s http://localhost:11434/api/tags | grep -q "nomic-embed-text"; then
  RAG_STATUS="${GREEN}SEMANTIC MODE (Full Intelligence)${NC}"
fi

# 8. 完成
printf "\n${GREEN}🎉 恭喜！AI_Common 大脑已部署成功。${NC}\n"
printf "----------------------------------------\n"
printf "🧠 ${BLUE}智商状态: ${NC}$RAG_STATUS\n"
printf "📡 ${BLUE}推送状态: ${NC}$LARK_STATUS\n"
printf "----------------------------------------\n"
printf "🛠 ${YELLOW}接下来的进化步骤 (Evolution Steps)：${NC}\n"
printf " 1. ${GREEN}激活全量智力${NC}: 确保 Ollama 已开启，并拉取了 nomic-embed-text 模型。\n"
printf " 2. ${GREEN}配置飞书实时战报${NC}: 前往 ${BLUE}$LARK_ENV${NC} 填入 Webhook Token。\n"
printf " 3. ${GREEN}验证检索${NC}: 尝试运行 ${YELLOW}./scripts/rag_probe.sh \"你的查询\"${NC}\n"
printf "----------------------------------------\n"
printf "💡 ${BLUE}常用命令：${NC}\n"
printf " - 启动预览: ${YELLOW}pnpm dev${NC}\n"
printf " - 自动驾驶: ${YELLOW}node ./scripts/auto-pilot.js${NC}\n"
printf "----------------------------------------\n"
