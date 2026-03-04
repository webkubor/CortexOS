import fnmatch
import hashlib
import json
import os
import re
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ASSISTANT_MEMORY_HOME = Path(
    os.environ.get(
        "CORTEXOS_ASSISTANT_MEMORY_HOME",
        str((PROJECT_ROOT / ".memory").resolve())
    )
).expanduser()
INDEX_DIR = ASSISTANT_MEMORY_HOME / "index"
SCOPE_CONFIG_PATH = Path(__file__).resolve().parent / "retrieval_scope.json"
POLICY_PATH = Path(__file__).resolve().parent / "injection_policy.json"
INDEX_PATH = INDEX_DIR / "memory_index.json"
STATE_PATH = INDEX_DIR / "memory_index_state.json"

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
        "/.memory/logs/",
        "/memory/journal/",
        "/archive/logs/"
    ],
    "exclude_file_patterns": [
        "*.log",
        "*.tmp"
    ]
}

DEFAULT_POLICY = {
    "summary_chars": 180,
    "tier_rules": [
        {"pattern": "docs/router.md", "tier": "L0"},
        {"pattern": "docs/rules/*.md", "tier": "L1"},
        {"pattern": "docs/sops/*.md", "tier": "L1"},
        {"pattern": "docs/ops/*.md", "tier": "L2"},
        {"pattern": "docs/skills/*.md", "tier": "L2"},
        {"pattern": "docs/guide/*.md", "tier": "L2"},
        {"pattern": "../memory/projects/*.md", "tier": "L2"},
        {"pattern": "../memory/skills/*.md", "tier": "L2"},
        {"pattern": "../memory/knowledge/*.md", "tier": "L3"}
    ]
}


def load_json(path, fallback):
    if not path.exists():
        return fallback
    try:
        with open(path, "r", encoding="utf-8") as file:
            data = json.load(file)
            if isinstance(data, dict):
                merged = dict(fallback)
                merged.update(data)
                return merged
    except Exception:
        pass
    return fallback


def resolve_include_paths(scope):
    resolved = []
    for include_path in scope.get("include", []):
        candidate = Path(include_path)
        if not candidate.is_absolute():
            candidate = (PROJECT_ROOT / candidate).resolve()
        if candidate.exists():
            resolved.append(candidate)
    return resolved


def iter_markdown_files(source_path):
    if source_path.is_file():
        if source_path.suffix.lower() == ".md":
            yield source_path
        return
    for file_path in source_path.rglob("*.md"):
        if file_path.is_file():
            yield file_path


def normalize_rel_path(file_path):
    try:
        return file_path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        pass
    try:
        rel = file_path.relative_to(PROJECT_ROOT.parent).as_posix()
        return f"../{rel}"
    except ValueError:
        return file_path.as_posix()


def should_skip(file_path, scope):
    normalized_path = "/" + file_path.as_posix().lstrip("/")
    for fragment in scope.get("exclude_path_contains", []):
        if fragment.replace("\\", "/") in normalized_path:
            return True
    for pattern in scope.get("exclude_file_patterns", []):
        if fnmatch.fnmatch(file_path.name, pattern):
            return True
    return False


def strip_frontmatter(text):
    if not text.startswith("---"):
        return text
    lines = text.splitlines()
    if len(lines) < 3:
        return text
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            return "\n".join(lines[idx + 1:])
    return text


def extract_title(rel_path, body):
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("#").strip()
    return Path(rel_path).stem.replace("_", " ")


def extract_summary(body, max_chars):
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            continue
        if stripped.startswith(">"):
            continue
        return stripped[:max_chars]
    compact = body.replace("\n", " ").strip()
    return compact[:max_chars]


def extract_keywords(title, body, limit=24):
    text_chunks = [title]
    heading_lines = []
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            heading_lines.append(stripped.lstrip("#").strip())
    text_chunks.extend(heading_lines[:10])
    raw = " ".join(text_chunks).lower()
    words = re.findall(r"[\u4e00-\u9fffA-Za-z0-9_-]{2,}", raw)
    seen = set()
    keywords = []
    for word in words:
        if word in seen:
            continue
        seen.add(word)
        keywords.append(word)
        if len(keywords) >= limit:
            break
    return keywords


def estimate_tokens(text):
    return max(1, int(len(text) / 3.6))


def assign_tier(rel_path, policy):
    for rule in policy.get("tier_rules", []):
        pattern = rule.get("pattern")
        tier = rule.get("tier")
        if not pattern or not tier:
            continue
        if fnmatch.fnmatch(rel_path, pattern):
            return tier
    return "L3"


def build_fingerprint(items):
    payload = json.dumps(items, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


def main():
    scope = load_json(SCOPE_CONFIG_PATH, DEFAULT_SCOPE)
    policy = load_json(POLICY_PATH, DEFAULT_POLICY)
    summary_chars = int(policy.get("summary_chars", 180))
    include_paths = resolve_include_paths(scope)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    files = []
    for include_path in include_paths:
        files.extend(iter_markdown_files(include_path))

    files = sorted(set(files), key=lambda p: p.as_posix())

    fingerprint_items = []
    for file_path in files:
        if should_skip(file_path, scope):
            continue
        stat = file_path.stat()
        fingerprint_items.append({
            "path": file_path.as_posix(),
            "size": stat.st_size,
            "mtime_ns": stat.st_mtime_ns
        })

    fingerprint_payload = {
        "sources": fingerprint_items,
        "scope": scope,
        "policy": policy
    }
    source_fingerprint = build_fingerprint(fingerprint_payload)
    if STATE_PATH.exists() and INDEX_PATH.exists():
        try:
            state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
            if state.get("source_fingerprint") == source_fingerprint:
                print("ℹ️ 记忆索引无变化，跳过重建。")
                return
        except Exception:
            pass

    records = []
    for file_path in files:
        if should_skip(file_path, scope):
            continue
        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except Exception:
            continue

        body = strip_frontmatter(raw_text)
        rel_path = normalize_rel_path(file_path)
        title = extract_title(rel_path, body)
        summary = extract_summary(body, summary_chars)
        keywords = extract_keywords(title, body)
        tier = assign_tier(rel_path, policy)

        records.append({
            "path": rel_path,
            "tier": tier,
            "title": title,
            "summary": summary,
            "keywords": keywords,
            "tokens_est": estimate_tokens(body[:4000]),
            "mtime": int(file_path.stat().st_mtime)
        })

    records.sort(key=lambda item: (item["tier"], item["path"]))

    tier_counts = {"L0": 0, "L1": 0, "L2": 0, "L3": 0}
    for item in records:
        tier_counts[item["tier"]] = tier_counts.get(item["tier"], 0) + 1

    payload = {
        "generated_at": int(time.time()),
        "source_fingerprint": source_fingerprint,
        "total": len(records),
        "tier_counts": tier_counts,
        "records": records
    }
    INDEX_PATH.write_text(f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n", encoding="utf-8")
    STATE_PATH.write_text(f"{json.dumps({'source_fingerprint': source_fingerprint}, ensure_ascii=False, indent=2)}\n", encoding="utf-8")

    print("✅ 记忆索引已更新:")
    print(f"- {INDEX_PATH}")
    print(f"- total: {payload['total']} | L0:{tier_counts.get('L0', 0)} L1:{tier_counts.get('L1', 0)} L2:{tier_counts.get('L2', 0)} L3:{tier_counts.get('L3', 0)}")


if __name__ == "__main__":
    main()
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
