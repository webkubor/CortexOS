#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo '用法: ./scripts/rag_probe.sh "查询" [根目录]'
  exit 1
fi

query="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
root="${2:-$ROOT_DIR}"
log_dir="${RAG_LOG_DIR:-$ROOT_DIR/.memory/rag_logs}"

ts_file_stamp="$(date '+%Y-%m-%d_%H-%M-%S')"
log_file="$log_dir/${ts_file_stamp}_rag_probe.md"

mkdir -p "$log_dir"

# --- 核心状态检查 ---
printf "正在进行大脑体检...\n"
VECTOR_STATUS="✅ ONLINE"
if ! curl -s http://localhost:11434/api/tags | grep -q "nomic-embed-text"; then
  VECTOR_STATUS="🚨 OFFLINE (Model 'nomic-embed-text' not found)"
fi

{
  echo "# RAG Probe (V3.0 - Intelligent Status)"
  echo "- 时间: $(date '+%F %T')"
  echo "- 查询: $query"
  echo "- 智力状态: $VECTOR_STATUS"
  echo "- 根目录: $root"
} > "$log_file"

# ChromaDB (语义检索)
start_ts=$(date +%s)
chroma_out="$(python3 "$root/scripts/ingest/query_brain.py" "$query" 2>&1 || true)"
end_ts=$(date +%s)
chroma_secs=$((end_ts - start_ts))

{
  echo
  echo "## [Semantic] ChromaDB (Ollama)"
  echo "- 耗时(秒): $chroma_secs"
  echo "- 输出:"
  echo '```text'
  if [ -z "$chroma_out" ] || [[ "$chroma_out" == *"Error"* ]]; then
    echo "(语义检索失效，请检查 Ollama 模型)"
  else
    echo "$chroma_out"
  fi
  echo '```'
} >> "$log_file"

# rg (物理检索)
start_ts=$(date +%s)
rg_out="$(rg -n -F --no-heading --color=never --no-ignore "$query" "$root" 2>&1 || true)"
end_ts=$(date +%s)
rg_secs=$((end_ts - start_ts))
rg_count=$(printf '%s\n' "$rg_out" | sed '/^$/d' | wc -l | tr -d ' ')

{
  echo
  echo "## [Physical] Ripgrep (Keyword)"
  echo "- 耗时(秒): $rg_secs"
  echo "- 命中行数: $rg_count"
  echo "- 输出 (前20行):"
  echo '```text'
  if [ -z "$rg_out" ]; then
    echo "(无匹配)"
  else
    echo "$rg_out" | head -n 20
  fi
  echo '```'
} >> "$log_file"

printf '✅ 探测完成！智力状态: %s\n' "$VECTOR_STATUS"
printf '详情见: %s\n' "$log_file"
