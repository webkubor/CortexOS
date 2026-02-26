import os
import sys
import chromadb
from chromadb.utils import embedding_functions

# 配置
PROJECT_ROOT = "/Users/webkubor/Documents/AI_Common"
CHROMA_DATA_PATH = os.path.join(PROJECT_ROOT, "chroma_db")
COLLECTION_NAME = "ai_common_docs"

def query_brain(user_query):
    # 初始化
    ollama_ef = embedding_functions.OllamaEmbeddingFunction(
        url="http://localhost:11434/api/embeddings",
        model_name="nomic-embed-text"
    )
    
    client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
    collection = client.get_collection(name=COLLECTION_NAME, embedding_function=ollama_ef)
    
    # 检索前 3 条最相关的背景
    results = collection.query(
        query_texts=[user_query],
        n_results=3
    )
    
    # 拼装返回
    context = ""
    for doc in results['documents'][0]:
        context += f"---
{doc}
"
    
    return context

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(query_brain(sys.argv[1]))
