import sqlite3
import json
import os
from pathlib import Path

DB_PATH = ".memory/sqlite/knowledge.db"

def refine_coding_pattern(name, category, desc, examples, confidence=0.8):
    """
    将提取的编程模式存入 SQLite。
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO coding_patterns (pattern_name, category, description, examples, confidence)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(pattern_name) DO UPDATE SET
                description=excluded.description,
                examples=excluded.examples,
                confidence=excluded.confidence,
                last_updated=CURRENT_TIMESTAMP
        """, (name, category, desc, json.dumps(examples, ensure_ascii=False), confidence))
        conn.commit()
        print(f"✅ Pattern Refined: {name} ({category})")
    except Exception as e:
        print(f"❌ Error refining pattern: {e}")
    finally:
        conn.close()

def seed_initial_knowledge():
    """
    初始导入：从已有的 retry_patterns.md 提取一部分逻辑注入数据库。
    """
    # 这里只是模拟从文件提取，后续会接入 LLM 自动提取逻辑
    initial_patterns = [
        {
            "name": "SecretPathProtection",
            "category": "security",
            "desc": "敏感凭证统一映射至 logic path 'memory/secrets/'，docs/ 下仅保留模板。",
            "examples": ["!.memory/persona/brains/ in .gitignore", "read_secret() tool use"]
        },
        {
            "name": "MCP-Hot-Path-Python",
            "category": "performance",
            "desc": "优先使用 Python 直连 SQLite 访问 AI Team 状态，避开 Node CLI 冗余链路。",
            "examples": ["get_context_brief implementation in server.py"]
        },
        {
            "name": "RAG-Density-Control",
            "category": "rag",
            "desc": "Deep 模式摘要优先，命中专项 Knowledge 后减少通用向量库补位。",
            "examples": ["query_brain.py --mode deep optimization"]
        }
    ]
    
    for p in initial_patterns:
        refine_coding_pattern(p["name"], p["category"], p["desc"], p["examples"])

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print("Database not found. Initialize it first.")
    else:
        seed_initial_knowledge()
