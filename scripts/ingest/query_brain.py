import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMA_AVAILABLE = True
except Exception:
    CHROMA_AVAILABLE = False

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ASSISTANT_MEMORY_HOME = Path(
    os.environ.get(
        "CORTEXOS_ASSISTANT_MEMORY_HOME",
        str((PROJECT_ROOT / ".memory").resolve())
    )
).expanduser()
CHROMA_DATA_PATH = PROJECT_ROOT / "chroma_db"
COLLECTION_NAME = "cortexos_docs"
SCOPE_CONFIG_PATH = Path(__file__).resolve().parent / "retrieval_scope.json"
INDEX_PATH = ASSISTANT_MEMORY_HOME / "index" / "memory_index.json"
POLICY_PATH = Path(__file__).resolve().parent / "injection_policy.json"

DEFAULT_SCOPE = {"top_k": 3}
DEFAULT_POLICY = {
    "modes": {
        "lite": {"tiers": ["L0", "L1"], "index_k": 4, "vector_k": 1, "token_budget": 900},
        "balanced": {"tiers": ["L0", "L1", "L2"], "index_k": 6, "vector_k": 3, "token_budget": 1800},
        "deep": {"tiers": ["L0", "L1", "L2", "L3"], "index_k": 10, "vector_k": 5, "token_budget": 3200}
    }
}
TIER_BONUS = {"L0": 4, "L1": 3, "L2": 2, "L3": 1}


def estimate_tokens(text):
    return max(1, int(len(text) / 3.6))


def load_json(path, fallback):
    if not path.exists():
        return fallback
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            merged = dict(fallback)
            merged.update(data)
            return merged
    except Exception as error:
        print(f"⚠️ 配置读取失败，使用默认配置: {error}", file=sys.stderr)
    return fallback


def load_scope():
    return load_json(SCOPE_CONFIG_PATH, DEFAULT_SCOPE)


def load_policy():
    policy = load_json(POLICY_PATH, DEFAULT_POLICY)
    if "modes" not in policy or not isinstance(policy["modes"], dict):
        policy["modes"] = DEFAULT_POLICY["modes"]
    return policy


def load_index():
    if not INDEX_PATH.exists():
        return {"records": []}
    try:
        payload = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and isinstance(payload.get("records"), list):
            return payload
    except Exception as error:
        print(f"⚠️ 记忆索引读取失败: {error}", file=sys.stderr)
    return {"records": []}


def tokenize(query):
    terms = re.findall(r"[\u4e00-\u9fffA-Za-z0-9_-]{2,}", query.lower())
    stop_words = {"什么", "怎么", "可以", "是否", "以及", "关于", "问题", "这个", "那个", "请问"}
    return [term for term in terms if term not in stop_words]


def score_record(query, terms, record):
    title = str(record.get("title", "")).lower()
    summary = str(record.get("summary", "")).lower()
    path = str(record.get("path", "")).lower()
    keywords = " ".join(record.get("keywords", [])).lower()
    haystack = f"{title} {summary} {path} {keywords}"

    score = 0
    if query.lower() in haystack:
        score += 10
    for term in terms:
        if term in title:
            score += 8
        elif term in keywords:
            score += 4
        elif term in summary:
            score += 3
        elif term in path:
            score += 6
    score += TIER_BONUS.get(record.get("tier", "L3"), 0)
    return score


def select_index_hits(query, mode_cfg, records):
    terms = tokenize(query)
    allowed_tiers = set(mode_cfg.get("tiers", ["L0", "L1", "L2"]))
    scored = []
    for record in records:
        if record.get("tier", "L3") not in allowed_tiers:
            continue
        score = score_record(query, terms, record)
        if score <= 0:
            continue
        scored.append((score, record))
    scored.sort(key=lambda item: (-item[0], item[1].get("path", "")))
    index_k = int(mode_cfg.get("index_k", 6))
    return [{"score": score, **record} for score, record in scored[:index_k]]


def query_vector_context(user_query, n_results):
    if not CHROMA_AVAILABLE:
        return []
    try:
        ollama_ef = embedding_functions.OllamaEmbeddingFunction(
            url="http://localhost:11434/api/embeddings",
            model_name="nomic-embed-text"
        )
        client = chromadb.PersistentClient(path=str(CHROMA_DATA_PATH))
        collection = client.get_collection(name=COLLECTION_NAME, embedding_function=ollama_ef)
        results = collection.query(query_texts=[user_query], n_results=n_results)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        out = []
        for idx, doc in enumerate(docs):
            meta = metas[idx] if idx < len(metas) else {}
            out.append({
                "path": meta.get("path", "unknown"),
                "text": doc
            })
        return out
    except Exception as error:
        print(f"⚠️ 向量检索失败，已回退索引模式: {error}", file=sys.stderr)
        return []


def trim_to_budget(text, remaining_tokens):
    max_chars = max(0, int(remaining_tokens * 3.6))
    if len(text) <= max_chars:
        return text, estimate_tokens(text)
    trimmed = text[:max_chars]
    return trimmed, estimate_tokens(trimmed)


def build_context(query, mode, budget, index_hits, vector_hits):
    sections = []
    used_tokens = 0

    header = f"[Memory Injection]\nmode={mode} budget={budget} tokens\nquery={query}\n"
    header_tokens = estimate_tokens(header)
    sections.append(header)
    used_tokens += header_tokens

    if index_hits:
        lines = ["\n[Index Hits]"]
        for item in index_hits:
            summary = str(item.get("summary", "")).replace("\n", " ")
            lines.append(f"- [{item.get('tier', 'L3')}] {item.get('path')} | {item.get('title')} | score={item.get('score')} | {summary}")
        block = "\n".join(lines) + "\n"
        block, block_tokens = trim_to_budget(block, max(0, budget - used_tokens))
        if block:
            sections.append(block)
            used_tokens += block_tokens

    if vector_hits and used_tokens < budget:
        lines = ["\n[Vector Context]"]
        for item in vector_hits:
            excerpt = str(item.get("text", "")).replace("\n", " ").strip()
            excerpt = excerpt[:420]
            lines.append(f"---\n来源: {item.get('path')}\n{excerpt}")
        block = "\n".join(lines) + "\n"
        block, block_tokens = trim_to_budget(block, max(0, budget - used_tokens))
        if block:
            sections.append(block)
            used_tokens += block_tokens

    if used_tokens >= budget:
        sections.append("\n[Notice] token budget reached, remaining context truncated.\n")
    return "".join(sections), used_tokens


def parse_args():
    parser = argparse.ArgumentParser(description="CortexOS 记忆检索（分级注入 + token 预算）")
    parser.add_argument("query", help="查询语句")
    parser.add_argument("legacy_top_k", nargs="?", default=None, help="兼容旧参数：向量检索条数")
    parser.add_argument("--mode", default="balanced", help="注入模式: lite|balanced|deep")
    parser.add_argument("--budget", type=int, default=None, help="token 预算（覆盖模式默认值）")
    parser.add_argument("--vector-k", type=int, default=None, help="向量检索条数")
    parser.add_argument("--index-only", action="store_true", help="仅使用索引，不走向量检索")
    parser.add_argument("--json", action="store_true", help="输出 JSON")
    argv = sys.argv[1:]
    if argv and argv[0] == "--":
        argv = argv[1:]
    return parser.parse_args(argv)


def main():
    args = parse_args()
    scope = load_scope()
    policy = load_policy()
    index_payload = load_index()

    modes = policy.get("modes", {})
    mode = args.mode if args.mode in modes else "balanced"
    mode_cfg = modes.get(mode, modes.get("balanced", DEFAULT_POLICY["modes"]["balanced"]))
    budget = args.budget if args.budget and args.budget > 0 else int(mode_cfg.get("token_budget", 1800))

    vector_k = args.vector_k
    if vector_k is None and args.legacy_top_k is not None:
        try:
            vector_k = int(args.legacy_top_k)
        except ValueError:
            vector_k = None
    if vector_k is None:
        vector_k = int(mode_cfg.get("vector_k", scope.get("top_k", 3)))
    if vector_k <= 0:
        vector_k = int(scope.get("top_k", 3))

    records = index_payload.get("records", [])
    index_hits = select_index_hits(args.query, mode_cfg, records)

    vector_hits = []
    if not args.index_only:
        vector_hits = query_vector_context(args.query, vector_k)
        index_paths = {item.get("path") for item in index_hits}
        vector_hits = [item for item in vector_hits if item.get("path") not in index_paths]

    context, used_tokens = build_context(args.query, mode, budget, index_hits, vector_hits)

    if args.json:
        payload = {
            "query": args.query,
            "mode": mode,
            "budget": budget,
            "used_tokens_est": used_tokens,
            "index_hits": index_hits,
            "vector_hits": vector_hits,
            "context": context
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(context)


if __name__ == "__main__":
    main()
