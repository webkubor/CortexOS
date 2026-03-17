#!/usr/bin/env python3
import os
import re
import sys
import argparse
from datetime import datetime
from pathlib import Path

# ===== 配置与路径 =====
BRAIN_ROOT = Path(__file__).resolve().parents[1]
ASSISTANT_MEMORY_HOME = Path(
    os.environ.get(
        "CORTEXOS_ASSISTANT_MEMORY_HOME",
        str((BRAIN_ROOT / ".memory").resolve()),
    )
).expanduser()
MEMORY_LOGS = ASSISTANT_MEMORY_HOME / "logs"

def _task_id_pattern():
    return re.compile(r"(?:task[-#]?\d{1,14}(?:-[a-z0-9-]+)?|\d{4}-\d{2}-\d{2}-[a-z0-9-]+)", re.IGNORECASE)

def log_task(content, agent="Gemini"):
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = MEMORY_LOGS / f"{today}.md"
    MEMORY_LOGS.mkdir(parents=True, exist_ok=True)
    
    task_match = _task_id_pattern().search(content)
    task_link = f" [[{task_match.group(0)}]]" if task_match else ""
    
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = f"\n## [{timestamp}] by {agent}{task_link}\n{content}\n"
    
    if not log_file.exists():
        log_file.write_text(f"# 操作日志 {today}\ntags: #journal/agent\n", encoding="utf-8")
    
    with log_file.open("a", encoding="utf-8") as f:
        f.write(entry)
    
    print(f"✅ [CLI] 日志已成功写入 {log_file.name}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CortexOS CLI Log Task")
    parser.add_argument("content", help="要记录的内容")
    parser.add_argument("--agent", default="Gemini", help="操作执行者名称")
    
    args = parser.parse_args()
    log_task(args.content, args.agent)
