import os
import glob
import re
import chromadb
from chromadb.utils import embedding_functions

# 配置
PROJECT_ROOT = "/Users/webkubor/Documents/AI_Common"
CHROMA_DATA_PATH = os.path.join(PROJECT_ROOT, "chroma_db")
COLLECTION_NAME = "ai_common_docs"

# 隐私自检正则（匹配 privacy_excludes.md 中的规范）
SENSITIVE_PATTERN = re.compile(r"API_KEY|SECRET|TOKEN|PASSWORD|BEGIN .* PRIVATE KEY|sk-|ghp_", re.IGNORECASE)

ollama_ef = embedding_functions.OllamaEmbeddingFunction(
    url="http://localhost:11434/api/embeddings",
    model_name="nomic-embed-text"
)

def is_file_safe(file_path, content):
    # 1. 路径自检：排除敏感目录
    ignore_paths = ["node_modules", "chroma_db", ".git", ".venv", "dist"]
    if any(p in file_path for p in ignore_paths):
        return False
    
    # 2. 内容自检：检测敏感词（遵循 privacy_excludes.md）
    if SENSITIVE_PATTERN.search(content):
        print(f"🛡️ 隐私拦截: 文件 {os.path.basename(file_path)} 包含敏感信息，已跳过向量化。")
        return False
    
    return True

def start_chroma_ingest():
    client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
    
    # 彻底清理旧集合，确保脏数据不残留
    if COLLECTION_NAME in [c.name for c in client.list_collections()]:
        client.delete_collection(COLLECTION_NAME)
        print(f"🗑️ 已物理清理旧索引，执行深度脱敏入库...")

    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=ollama_ef
    )
    
    docs_dir = os.path.join(PROJECT_ROOT, "docs")
    files = glob.glob(os.path.join(docs_dir, "**/*.md"), recursive=True)
    
    safe_files_count = 0
    for f in files:
        rel_path = os.path.relpath(f, PROJECT_ROOT)
        try:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
                
                # 执行隐私过滤
                if not is_file_safe(f, content):
                    continue
                
                chunks = [content[i:i+1000] for i in range(0, len(content), 1000)]
                if chunks:
                    collection.add(
                        documents=chunks,
                        metadatas=[{"path": rel_path, "source": "AI_Common"} for _ in chunks],
                        ids=[f"{rel_path}_{i}" for i in range(len(chunks))]
                    )
                    safe_files_count += 1
        except Exception as e:
            print(f"⚠️ 无法处理文件 {f}: {e}")
    
    print(f"✨ 深度脱敏入库完成！[Ollama: nomic-embed-text]")
    print(f"📊 安全入库文件数: {safe_files_count}，当前向量切片: {collection.count()}")

if __name__ == "__main__":
    start_chroma_ingest()
