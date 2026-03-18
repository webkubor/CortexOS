import os
import re
import sys
import sqlite3
from datetime import datetime

DB_PATH = ".memory/sqlite/knowledge.db"

def extract_corrections(log_path):
    """
    通过正则过滤，只提取栖洲对助理进行“纠偏”或“否定”的负面反馈。
    正面确认不产生进化动力，负面反馈才是进化的核心 Token。
    """
    if not os.path.exists(log_path):
        return []

    with open(log_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 负面反馈关键词：不对、不对、错误、改、别、不准、no、wrong、don't、incorrect
    negative_keywords = ["不对", "不对", "错误", "改", "别", "不准", "no", "wrong", "don't", "incorrect", "bug"]
    
    # 匹配 ## [时间] by Agent 块
    blocks = re.findall(r'## \[\d{2}:\d{2}:\d{2}\] by (.*?)\n(.*?)(?=\n## |$)', content, re.DOTALL)
    
    corrections = []
    for agent, body in blocks:
        if any(kw.lower() in body.lower() for kw in negative_keywords):
            corrections.append(body.strip())
            
    return corrections

def store_reflection(corrections):
    if not corrections:
        print("ℹ️ 今日无纠偏反馈，大脑维持现状。")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for c in corrections:
        # 存入“反思池”
        cursor.execute("""
            INSERT INTO architectural_decisions (decision_id, topic, rationale)
            VALUES (?, ?, ?)
            ON CONFLICT(decision_id) DO UPDATE SET rationale=excluded.rationale
        """, ("Reflection_" + datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + os.urandom(2).hex(), "User Correction", c))
        
    conn.commit()
    conn.close()
    print(f"✅ Extracted {len(corrections)} high-signal corrections for reflection.")

if __name__ == "__main__":
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = f".memory/logs/{today}.md"
    
    corrections = extract_corrections(log_file)
    store_reflection(corrections)
