#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REF_DIR="$ROOT_DIR/assets/reference_audio"
ARCHIVE_DIR="$REF_DIR/_archive/$(date +%Y%m%d_%H%M%S)"

if [[ ! -d "$REF_DIR" ]]; then
  echo "❌ reference_audio 目录不存在: $REF_DIR"
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"

archive_file() {
  local file_name="$1"
  if [[ -f "$REF_DIR/$file_name" ]]; then
    mv "$REF_DIR/$file_name" "$ARCHIVE_DIR/$file_name"
    echo "📦 归档: $file_name -> _archive/"
  fi
}

rename_file() {
  local src="$1"
  local dst="$2"
  if [[ ! -f "$REF_DIR/$src" ]]; then
    return
  fi
  if [[ -f "$REF_DIR/$dst" ]]; then
    local src_hash dst_hash
    src_hash="$(shasum -a 256 "$REF_DIR/$src" | awk '{print $1}')"
    dst_hash="$(shasum -a 256 "$REF_DIR/$dst" | awk '{print $1}')"
    if [[ "$src_hash" == "$dst_hash" ]]; then
      archive_file "$src"
      echo "♻️ 跳过重命名(内容重复): $src == $dst"
      return
    fi
    echo "⚠️ 跳过重命名(目标已存在且内容不同): $src -> $dst"
    return
  fi
  mv "$REF_DIR/$src" "$REF_DIR/$dst"
  echo "✏️ 重命名: $src -> $dst"
}

dedupe_alias() {
  local keep="$1"
  local drop="$2"
  if [[ ! -f "$REF_DIR/$keep" || ! -f "$REF_DIR/$drop" ]]; then
    return
  fi
  local keep_hash drop_hash
  keep_hash="$(shasum -a 256 "$REF_DIR/$keep" | awk '{print $1}')"
  drop_hash="$(shasum -a 256 "$REF_DIR/$drop" | awk '{print $1}')"
  if [[ "$keep_hash" == "$drop_hash" ]]; then
    archive_file "$drop"
    echo "🧹 去重: 保留 $keep, 移除 $drop"
  else
    echo "⚠️ 未去重(内容不同): $keep / $drop"
  fi
}

# 1) 清理系统垃圾文件
if [[ -f "$REF_DIR/.DS_Store" ]]; then
  rm -f "$REF_DIR/.DS_Store"
  echo "🗑️ 删除 .DS_Store"
fi

# 2) 统一命名为 <角色名>_参考.<ext>
rename_file "梦竹.wav" "梦竹_参考.wav"
rename_file "水烟.wav" "水烟_参考.wav"
rename_file "狐妖.wav" "狐妖_参考.wav"
rename_file "江南名伶婉儿.wav" "婉儿_参考.wav"
rename_file "江湖老人.mp3" "江湖老人_参考.mp3"

# 3) 同角色别名去重（保留规范命名）
dedupe_alias "宁观尘_参考.mp3" "宁观尘.mp3"

echo "✅ reference_audio 规范化完成。归档目录: $ARCHIVE_DIR"
