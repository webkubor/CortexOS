import json
import re
import fnmatch
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

# 配置
PROJECT_ROOT = Path(__file__).resolve().parents[2]
CHROMA_DATA_PATH = PROJECT_ROOT / "chroma_db"
COLLECTION_NAME = "cortexos_docs"
SCOPE_CONFIG_PATH = Path(__file__).resolve().parent / "retrieval_scope.json"

DEFAULT_SCOPE = {
    "include": [
        "docs/router.md",
        "docs/rules",
        "../memory/knowledge",
        "../memory/projects",
        "../memory/skills"
    ],
    "exclude_path_contains": [
        "/.vitepress/",
        "/dist/",
        "/build/",
        "/node_modules/",
        "/chroma_db/",
        "/.git/",
        "/.venv/",
        "/.memory/logs/"
    ],
    "exclude_file_patterns": [
        "*.log",
        "*.tmp"
    ],
    "chunk_size": 1000,
    "top_k": 3
}

# 隐私自检正则（匹配 security_boundary.md 中的规范）
SENSITIVE_PATTERNS = [
    r"API_KEY",
    r"SECRET",
    r"TOKEN",
    r"PASSWORD",
    r"BEGIN .* PRIVATE" + r"\s+KEY",
    r"sk-",
    r"ghp_"
]
SENSITIVE_PATTERN = re.compile("|".join(SENSITIVE_PATTERNS), re.IGNORECASE)

ollama_ef = embedding_functions.OllamaEmbeddingFunction(
    url="http://localhost:11434/api/embeddings",
    model_name="nomic-embed-text"
)

def load_scope_config():
    # 在默认规则基础上覆盖，避免配置缺失导致检索不可用
    scope = dict(DEFAULT_SCOPE)
    if not SCOPE_CONFIG_PATH.exists():
        return scope

    try:
        with open(SCOPE_CONFIG_PATH, "r", encoding="utf-8") as file:
            custom_scope = json.load(file)

        if isinstance(custom_scope.get("include"), list):
            scope["include"] = custom_scope["include"]
        if isinstance(custom_scope.get("exclude_path_contains"), list):
            scope["exclude_path_contains"] = custom_scope["exclude_path_contains"]
        if isinstance(custom_scope.get("exclude_file_patterns"), list):
            scope["exclude_file_patterns"] = custom_scope["exclude_file_patterns"]
        if isinstance(custom_scope.get("chunk_size"), int) and custom_scope["chunk_size"] > 0:
            scope["chunk_size"] = custom_scope["chunk_size"]
        if isinstance(custom_scope.get("top_k"), int) and custom_scope["top_k"] > 0:
            scope["top_k"] = custom_scope["top_k"]
    except Exception as error:
        print(f"⚠️ 检索配置读取失败，将使用默认范围: {error}")

    return scope


def resolve_include_paths(scope):
    resolved_paths = []
    for include_path in scope["include"]:
        candidate = Path(include_path)
        if not candidate.is_absolute():
            candidate = (PROJECT_ROOT / candidate).resolve()
        if candidate.exists():
            resolved_paths.append(candidate)
        else:
            print(f"⚠️ 已跳过不存在的检索源: {candidate}")
    return resolved_paths


def get_metadata_path(file_path):
    # 优先项目相对路径，跨仓库目录则回退到上级目录相对路径
    try:
        return file_path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        pass

    try:
        relative_to_parent = file_path.relative_to(PROJECT_ROOT.parent).as_posix()
        return f"../{relative_to_parent}"
    except ValueError:
        return file_path.as_posix()


def iter_markdown_files(source_path):
    if source_path.is_file():
        if source_path.suffix.lower() == ".md":
            yield source_path
        return
    for file_path in source_path.rglob("*.md"):
        if file_path.is_file():
            yield file_path


def should_skip_by_scope(file_path, scope):
    normalized_path = "/" + file_path.as_posix().lstrip("/")
    for fragment in scope["exclude_path_contains"]:
        normalized_fragment = fragment.replace("\\", "/")
        if normalized_fragment in normalized_path:
            return True
    for file_pattern in scope["exclude_file_patterns"]:
        if fnmatch.fnmatch(file_path.name, file_pattern):
            return True
    return False


def is_file_safe(file_path, content, scope):
    # 1. 路径自检：排除非知识目录和高噪音目录
    if should_skip_by_scope(file_path, scope):
        return False
    
    # 2. 内容自检：检测敏感词（遵循 security_boundary.md）
    if SENSITIVE_PATTERN.search(content):
        print(f"🛡️ 隐私拦截: 文件 {file_path.name} 包含敏感信息，已跳过向量化。")
        return False
    
    return True

def start_chroma_ingest():
    scope = load_scope_config()
    include_paths = resolve_include_paths(scope)
    chunk_size = scope["chunk_size"]
    client = chromadb.PersistentClient(path=str(CHROMA_DATA_PATH))
    
    # 彻底清理旧集合，确保脏数据不残留
    if COLLECTION_NAME in [c.name for c in client.list_collections()]:
        client.delete_collection(COLLECTION_NAME)
        print(f"🗑️ 已物理清理旧索引，执行深度脱敏入库...")

    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=ollama_ef
    )
    
    files = []
    for include_path in include_paths:
        files.extend(iter_markdown_files(include_path))

    safe_files_count = 0
    safe_chunks_count = 0
    indexed_paths = set()
    for f in files:
        rel_path = get_metadata_path(f)
        if rel_path in indexed_paths:
            continue

        try:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
                
                # 执行隐私过滤
                if not is_file_safe(f, content, scope):
                    continue
                
                chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]
                if chunks:
                    doc_id_prefix = rel_path.replace("/", "__")
                    collection.add(
                        documents=chunks,
                        metadatas=[{"path": rel_path, "source": "CortexOS"} for _ in chunks],
                        ids=[f"{doc_id_prefix}_{i}" for i in range(len(chunks))]
                    )
                    safe_files_count += 1
                    safe_chunks_count += len(chunks)
                    indexed_paths.add(rel_path)
        except Exception as e:
            print(f"⚠️ 无法处理文件 {f}: {e}")
    
    print(f"✨ 深度脱敏入库完成！[Ollama: nomic-embed-text]")
    print(f"📊 检索范围: {len(include_paths)} 个入口，安全入库文件数: {safe_files_count}，新增切片: {safe_chunks_count}，当前向量切片: {collection.count()}")

if __name__ == "__main__":
    start_chroma_ingest()
