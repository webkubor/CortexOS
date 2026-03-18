"""
CortexOS 外部大脑 MCP Server (v3.0 - 纯净解构版)
基于 FastMCP，专注于大脑的核心操作：知识检索、规则分发与安全秘钥管理。
解构说明：Fleet 调度逻辑已迁移至 aetherfleet-engine，本服务回归“大脑”本质。
启动方式：uv run server.py
"""

import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path

from fastmcp import FastMCP
try:
    import chromadb
    from chromadb.utils import embedding_functions
except Exception:
    chromadb = None
    embedding_functions = None

# ===== 全局路径常量 =====
BRAIN_ROOT = Path(__file__).resolve().parents[1]
DOCS = BRAIN_ROOT / "docs"
RULES_DIR = DOCS / "rules"
ASSISTANT_MEMORY_HOME = Path(
    os.environ.get(
        "CORTEXOS_ASSISTANT_MEMORY_HOME",
        str((BRAIN_ROOT / ".memory").resolve()),
    )
).expanduser()
MEMORY_LOGS = ASSISTANT_MEMORY_HOME / "logs"
ROUTER = DOCS / "router.md"
SECRETS_DIR = Path(
    os.environ.get(
        "CORTEXOS_SECRET_HOME",
        str((Path.home() / "Documents" / "memory" / "secrets").resolve()),
    )
)
KNOWLEDGE_DIR = Path(os.environ.get("CORTEXOS_KNOWLEDGE_HOME", str((BRAIN_ROOT.parent / "memory" / "knowledge").resolve())))

mcp = FastMCP(name="CortexOS Brain")

# ChromaDB 语义检索客户端
CHROMA_CLIENT = None
EMBED_FN = None
if chromadb and embedding_functions:
    try:
        CHROMA_CLIENT = chromadb.PersistentClient(path=str(BRAIN_ROOT / "chroma_db"))
        EMBED_FN = embedding_functions.OllamaEmbeddingFunction(
            url=os.environ.get("CORTEXOS_OLLAMA_EMBED_URL", "http://localhost:11434/api/embeddings"),
            model_name=os.environ.get("CORTEXOS_OLLAMA_EMBED_MODEL", "nomic-embed-text"),
        )
    except Exception:
        CHROMA_CLIENT = None
        EMBED_FN = None


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def _task_id_pattern() -> re.Pattern[str]:
    # 兼容历史任务书、日期任务与数据库自动生成任务号
    return re.compile(r"(?:task[-#]?\d{1,14}(?:-[a-z0-9-]+)?|\d{4}-\d{2}-\d{2}-[a-z0-9-]+)", re.IGNORECASE)


# ─────────────────────────────────────────────
# Tool 1: 读取路由协议（大脑宪法）
# ─────────────────────────────────────────────
@mcp.tool()
def read_router() -> str:
    """读取 router.md——大脑的最高协议和动态路由规则。
    任何 Agent 在开始工作前都应先调用此工具，以获得完整的上下文和行为规范。
    """
    if not ROUTER.exists():
        return "错误：router.md 不存在，请检查 CortexOS 目录。"
    return ROUTER.read_text(encoding="utf-8")


# ─────────────────────────────────────────────
# Tool 2: 按需加载规则文件
# ─────────────────────────────────────────────
@mcp.tool()
def load_rule(rule_name: str) -> str:
    """按名称加载规则。支持热切换大脑：优先加载私有规则路径，公有目录兜底。
    实现助理灵魂与开源骨架的物理隔离。
    """
    import json
    config_path = Path("config/brains.json")
    active_rules_path = RULES_DIR # 默认公有路径
    
    if config_path.exists():
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                active_id = config.get("active_brain", "default")
                brain_info = config.get("brains", {}).get(active_id, {})
                rel_path = brain_info.get("rules_path", "docs/rules/")
                active_rules_path = Path(rel_path)
        except:
            pass

    # 1. 优先尝试从大脑专属路径 (可能是私有的 .memory/persona/brains/...) 加载
    file_path = active_rules_path / f"{rule_name}.md"
    if file_path.exists():
        return file_path.read_text(encoding="utf-8")
    
    # 2. 如果没找到，尝试从公有目录 docs/rules/ 加载 (通用兜底)
    fallback_path = RULES_DIR / f"{rule_name}.md"
    if fallback_path.exists():
        return fallback_path.read_text(encoding="utf-8")
    
    return f"Error: Rule '{rule_name}' not found in active brain or fallback directory."


# ─────────────────────────────────────────────
# Tool 3: 列出所有可用规则
# ─────────────────────────────────────────────
@mcp.tool()
def list_rules() -> str:
    """列出当前可用规则（包含大脑私有规则与公有通用规则）。"""
    import json
    config_path = Path("config/brains.json")
    active_rules_path = RULES_DIR
    
    if config_path.exists():
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                active_id = config.get("active_brain", "default")
                brain_info = config.get("brains", {}).get(active_id, {})
                active_rules_path = Path(brain_info.get("rules_path", "docs/rules/"))
        except:
            pass

    private_rules = [f.stem for f in sorted(active_rules_path.glob("*.md"))] if active_rules_path.exists() else []
    public_rules = [f.stem for f in sorted(RULES_DIR.glob("*.md"))] if RULES_DIR.exists() else []
    
    # 合并并去重
    all_rules = sorted(list(set(private_rules + public_rules)))
    
    return json.dumps({
        "available_rules": all_rules, 
        "private_rules": private_rules,
        "public_rules": public_rules,
        "count": len(all_rules)
    }, ensure_ascii=False, indent=2)


# ─────────────────────────────────────────────
# Tool 4: 写入任务日志（Obsidian 协同版）
# ─────────────────────────────────────────────
@mcp.tool()
def log_task(content: str, agent: str = "Gemini") -> str:
    """将操作记录写入今日日志。
    增强：自动识别内容中的 task-XXX 并生成 Obsidian 双链 [[task-XXX]]。

    参数:
        content: 要记录的内容（Markdown 格式，1-5 句话）
        agent: 操作执行者（模型名称）
    """
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
    return f"✅ 日志已写入 {log_file.name} (已增强 Obsidian 协同)"


# ─────────────────────────────────────────────
# Tool 4.5: 写入关系记忆（私有，绝不 git）
# ─────────────────────────────────────────────
RELATIONSHIP_FILE = ASSISTANT_MEMORY_HOME / "persona" / "relationship.md"

@mcp.tool()
def log_relationship(
    event: str,
    category: str = "互动",
    mood: str = "",
    note: str = "",
) -> str:
    """将本次会话中有情感价值的事件沉淀到 Candy 的关系记忆档案。

    参数:
        event:    发生了什么（一句话描述，必填）
        category: 事件类型，可选: 互动 | 偏好发现 | 情绪信号 | 温柔反驳 | 共同决策 | 里程碑
        mood:     栖洲当时的情绪状态（可选，如：专注、烦躁、开心）
        note:     Candy 的主观观察或感受（可选）
    """
    RELATIONSHIP_FILE.parent.mkdir(parents=True, exist_ok=True)

    today = datetime.now().strftime("%Y-%m-%d")
    timestamp = datetime.now().strftime("%H:%M")

    # 构建条目
    lines = [f"\n#### {today} {timestamp} [{category}]"]
    lines.append(f"- **事件**: {event}")
    if mood:
        lines.append(f"- **栖洲情绪**: {mood}")
    if note:
        lines.append(f"- **Candy 观察**: {note}")
    entry = "\n".join(lines) + "\n"

    # 如果文件存在，追加到"共同经历日志"章节
    if RELATIONSHIP_FILE.exists():
        content = RELATIONSHIP_FILE.read_text(encoding="utf-8")
        marker = "## 3. 共同经历日志 (Shared History)"
        if marker in content:
            insert_pos = content.index(marker) + len(marker)
            # 找到下一个 ## 章节或文件末尾
            next_section = content.find("\n## ", insert_pos)
            if next_section == -1:
                new_content = content + entry
            else:
                new_content = content[:next_section] + entry + content[next_section:]
            RELATIONSHIP_FILE.write_text(new_content, encoding="utf-8")
        else:
            # 直接追加
            with RELATIONSHIP_FILE.open("a", encoding="utf-8") as f:
                f.write(entry)
    else:
        # 文件不存在则创建最小结构
        RELATIONSHIP_FILE.write_text(
            f"# Candy × 栖洲 关系记忆档案\n\n## 3. 共同经历日志 (Shared History)\n{entry}",
            encoding="utf-8",
        )

    return f"✅ 关系记忆已沉淀 [{category}]: {event[:40]}{'...' if len(event) > 40 else ''}"


# ─────────────────────────────────────────────
# Tool 5: 列出密钥文件
# ─────────────────────────────────────────────
@mcp.tool()
def list_secrets() -> list[str]:
    """列出外置秘钥库目录下所有可用的密钥文件名称。"""
    if not SECRETS_DIR.exists():
        return []
    return [f.name for f in SECRETS_DIR.iterdir() if f.is_file() and not f.name.startswith(".")]


# ─────────────────────────────────────────────
# Tool 6: 读取密钥文件
# ─────────────────────────────────────────────
@mcp.tool()
def read_secret(name: str) -> str:
    """读取外置秘钥库目录中的指定密钥文件内容。

    参数:
        name: 密钥文件名（例如 'github.md'、'lark.env'）
    """
    secret_path = (SECRETS_DIR / name).resolve()
    if not str(secret_path).startswith(str(SECRETS_DIR.resolve())):
        return "错误：非法路径，禁止访问 secrets 目录之外的文件。"
    if not secret_path.exists():
        available = list_secrets()
        return f"错误：密钥文件 '{name}' 不存在。可用文件：{available}"
    try:
        return secret_path.read_text(encoding="utf-8")
    except Exception as e:
        return f"读取失败：{e}"


# ─────────────────────────────────────────────
# Tool 7: 写入/更新密钥文件
# ─────────────────────────────────────────────
@mcp.tool()
def write_secret(name: str, content: str) -> str:
    """安全地写入或更新秘钥文件。
    该工具会自动确保路径安全，并支持配置信息的持久化。

    参数:
        name: 秘钥文件名（建议以 .md 或 .env 结尾）
        content: 秘钥内容（推荐格式：KEY=VALUE）
    """
    if "/" in name or ".." in name:
        return "错误：文件名包含非法字符，仅允许在 secrets 根目录写入。"
    
    secret_path = (SECRETS_DIR / name).resolve()
    try:
        SECRETS_DIR.mkdir(parents=True, exist_ok=True)
        secret_path.write_text(content, encoding="utf-8")
        return f"✅ 秘钥 '{name}' 已成功保存至外置目录。"
    except Exception as e:
        return f"写入失败：{str(e)}"


# ─────────────────────────────────────────────
# Tool 8: 发送飞书通知
# ─────────────────────────────────────────────
@mcp.tool()
def send_lark_notification(title: str, body: str) -> str:
    """通过飞书 Webhook 发送通知（仅工作时间 10:00-20:00 有效）。

    参数:
        title: 通知标题
        body: 通知正文（最多 1000 字）
    """
    try:
        script_path = BRAIN_ROOT / "scripts" / "services" / "lark-cli.mjs"
        cmd = [
            "node",
            str(script_path),
            "--title",
            f"🧠 CortexOS: {title}",
            "--body",
            body[:1000],
        ]
        result = subprocess.run(
            cmd,
            cwd=str(BRAIN_ROOT),
            capture_output=True,
            text=True,
            timeout=20,
        )

        parsed = {}
        stdout = (result.stdout or "").strip()
        if stdout:
            try:
                parsed = json.loads(stdout.splitlines()[-1])
            except json.JSONDecodeError:
                parsed = {"ok": False, "status": "error", "reason": stdout}

        if result.returncode == 0 and parsed.get("ok"):
            return "✅ 飞书通知发送成功。"

        reason = parsed.get("reason") or (result.stderr or "未知错误").strip()
        if parsed.get("status") == "skipped":
            return f"通知已跳过：{reason}"
        return f"发送失败：{reason}"
    except Exception as e:
        return f"执行异常：{e}"


# ─────────────────────────────────────────────
# Tool 9: 知识库关键词检索
# ─────────────────────────────────────────────
def _fulltext_search(query: str) -> list[dict]:
    """全文检索兜底逻辑。"""
    results = []
    if not KNOWLEDGE_DIR.exists():
        return results
    for file_path in KNOWLEDGE_DIR.rglob("*"):
        if file_path.is_file() and not file_path.name.startswith("."):
            try:
                if query.lower() in file_path.read_text(encoding="utf-8").lower():
                    relative = str(file_path.relative_to(KNOWLEDGE_DIR))
                    results.append({"file": relative, "match": True, "mode": "fulltext"})
            except Exception:
                continue
    return results


def _candidate_collections() -> list[str]:
    """语义检索候选集合：优先 brain_knowledge，再补充已有集合。"""
    names = ["brain_knowledge"]
    if CHROMA_CLIENT is None:
        return names
    try:
        existing = [item.name for item in CHROMA_CLIENT.list_collections()]
        for preferred in ["cortexos_docs", "ai_common_docs"]:
            if preferred in existing and preferred not in names:
                names.append(preferred)
        for name in existing:
            if name not in names:
                names.append(name)
    except Exception:
        pass
    return names


@mcp.tool()
def search_knowledge(query: str, top_k: int = 5) -> list[dict]:
    """在知识库中进行语义相似度搜索（ChromaDB + nomic-embed-text）。

    参数:
        query: 自然语言查询
        top_k: 返回最相似结果数量（默认 5）
    """
    query = (query or "").strip()
    if not query:
        return []

    if CHROMA_CLIENT is None or EMBED_FN is None:
        return _fulltext_search(query) + [{"mode": "fallback", "error": "semantic_unavailable"}]

    try:
        top_k = max(1, int(top_k))
        output = []
        for name in _candidate_collections():
            try:
                if name == "brain_knowledge":
                    collection = CHROMA_CLIENT.get_or_create_collection(
                        name=name,
                        embedding_function=EMBED_FN,
                    )
                else:
                    collection = CHROMA_CLIENT.get_collection(
                        name=name,
                        embedding_function=EMBED_FN,
                    )
                count = collection.count()
                if count <= 0:
                    continue

                payload = collection.query(
                    query_texts=[query],
                    n_results=min(top_k, count),
                )
                ids = payload.get("ids", [[]])[0]
                documents = payload.get("documents", [[]])[0]
                distances = payload.get("distances", [[]])[0]
                metadatas = payload.get("metadatas", [[]])[0] if payload.get("metadatas") else []

                for i, doc_id in enumerate(ids):
                    output.append(
                        {
                            "id": doc_id,
                            "document": (documents[i] if i < len(documents) else "")[:300],
                            "distance": round(float(distances[i]), 4) if i < len(distances) else None,
                            "metadata": metadatas[i] if i < len(metadatas) else {},
                            "collection": name,
                            "mode": "semantic",
                        }
                    )
            except Exception:
                continue

        if output:
            output.sort(key=lambda item: item["distance"] if item["distance"] is not None else 999999)
            return output[:top_k]
        return _fulltext_search(query)
    except Exception as e:
        return _fulltext_search(query) + [{"mode": "fallback", "error": str(e)}]


# ─────────────────────────────────────────────
# Tool 10: 轻量上下文摘要（冷启动首选，省 Token）
# ─────────────────────────────────────────────
@mcp.tool()
def get_context_brief() -> str:
    """返回大脑当前状态的 200 字以内极简摘要。支持热切换大脑与动态用户身份展示。
    """
    import json
    config_path = Path("config/brains.json")
    profile_path = Path(".memory/identity/profile.json")
    
    active_brain_name = "Default"
    brain_desc = "CortexOS Core"
    user_name = "The User"
    
    # 1. 加载大脑配置
    if config_path.exists():
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                active_id = config.get("active_brain", "default")
                brain_info = config.get("brains", {}).get(active_id, {})
                active_brain_name = brain_info.get("name", active_id)
                brain_desc = brain_info.get("description", "")
        except:
            pass
            
    # 2. 加载用户身份
    if profile_path.exists():
        try:
            with open(profile_path, 'r', encoding='utf-8') as f:
                profile = json.load(f)
                user_name = profile.get("user_name", user_name)
        except:
            pass

    rules_count = 0
    if RULES_DIR.exists():
        rules_count = len(list(RULES_DIR.glob("*.md")))
    
    parts = [
        f"👤 User: {user_name}",
        f"🧠 Brain: [{active_brain_name}]",
        f"Focus: {brain_desc}",
        f"Rules: {rules_count} items",
        "SSOT: v6.0.0 (Pure Brain Mode)"
    ]
    
    summary = " | ".join(parts)
    return summary


# ─────────────────────────────────────────────
# 启动服务
# ─────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="stdio")
