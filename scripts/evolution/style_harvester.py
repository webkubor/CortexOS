import os
import subprocess
import sqlite3
import json
from pathlib import Path

# 配置：只关注这些后缀的文件
CODE_EXTENSIONS = {'.py', '.js', '.ts', '.tsx', '.vue', '.go'}
DB_PATH = ".memory/sqlite/knowledge.db"

def get_recent_diff():
    """只抓取最近一次提交的变动，极大地减少 Token 消耗。"""
    try:
        # 尝试获取最近一次 commit 的 diff
        diff = subprocess.check_output(['git', 'diff', 'HEAD~1', 'HEAD'], stderr=subprocess.STDOUT).decode('utf-8')
        return diff
    except:
        # 如果没有 commit，则抓取当前未提交的改动 (staged)
        return subprocess.check_output(['git', 'diff', '--cached'], stderr=subprocess.STDOUT).decode('utf-8')

def local_filter(diff_text):
    """
    本地预过滤：只保留包含核心逻辑改动的行，剔除空格、注释和配置。
    这是省 Token 的关键！
    """
    high_signal_lines = []
    keywords = ['def ', 'async ', 'class ', 'export ', 'interface ', 'try:', 'except', 'catch', 'if ', 'return ']
    
    for line in diff_text.split('\n'):
        if line.startswith('+') and not line.startswith('+++'):
            clean_line = line[1:].strip()
            if any(kw in clean_line for kw in keywords):
                high_signal_lines.append(clean_line)
                
    return "\n".join(high_signal_lines[:50]) # 限制最多 50 行，防止噪音

def refine_style_logic(patterns_summary):
    """
    将过滤后的高信号片段存入待处理区，等待助理在空闲时（或在下一次任务中）进行批量提炼。
    """
    if not patterns_summary:
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # 存入一条“待审计”的模式记录
    cursor.execute("""
        INSERT INTO coding_patterns (pattern_name, category, description, confidence)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(pattern_name) DO UPDATE SET last_updated=CURRENT_TIMESTAMP
    """, ("Pending_Audit_" + os.urandom(2).hex(), "style_discovery", patterns_summary, 0.5))
    conn.commit()
    conn.close()
    print("✅ High-signal code patterns extracted (Local).")

if __name__ == "__main__":
    diff = get_recent_diff()
    filtered = local_filter(diff)
    if filtered:
        refine_style_logic(filtered)
    else:
        print("ℹ️ No high-signal style changes detected.")
