"""
CortexOS 外部大脑 MCP Server（统一版 v2）
基于 FastMCP，暴露大脑的 13 个核心操作 Tool。
启动方式：uv run server.py
接入配置：{ "command": "uv", "args": ["run", "/path/to/CortexOS/mcp_server/server.py"] }
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
FLEET_JSON = BRAIN_ROOT / "docs" / "public" / "data" / "ai_team_status.json"
RULES_DIR = DOCS / "rules"
ASSISTANT_MEMORY_HOME = Path(
    os.environ.get(
        "CORTEXOS_ASSISTANT_MEMORY_HOME",
        str((BRAIN_ROOT / ".memory").resolve()),
    )
).expanduser()
MEMORY_LOGS = ASSISTANT_MEMORY_HOME / "logs"
FLEET_STATUS = ASSISTANT_MEMORY_HOME / "fleet" / "fleet_status.md"
ROUTER = DOCS / "router.md"
SECRETS_DIR = Path(
    os.environ.get(
        "CORTEXOS_SECRET_HOME",
        str((Path.home() / "Documents" / "memory" / "secrets").resolve()),
    )
)
KNOWLEDGE_DIR = Path(os.environ.get("CORTEXOS_KNOWLEDGE_HOME", str((BRAIN_ROOT.parent / "memory" / "knowledge").resolve())))

mcp = FastMCP(name="CortexOS Brain")

# ChromaDB 语义检索客户端（不可用时自动降级为全文检索）
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
# Tool 2: 读取当前舰队状态
# ─────────────────────────────────────────────
@mcp.tool()
def get_fleet_status() -> str:
    """获取当前所有 AI Agent 的实时状态（JSON 格式）。
    返回进行中的任务、队长节点、工作路径信息，用于感知当前是否存在并行冲突。
    """
    if FLEET_JSON.exists():
        return FLEET_JSON.read_text(encoding="utf-8")
    if FLEET_STATUS.exists():
        return FLEET_STATUS.read_text(encoding="utf-8")
    return json.dumps({"error": "fleet status 文件不存在，请先执行 pnpm run fleet:sync-dashboard"}, ensure_ascii=False)


# ─────────────────────────────────────────────
# Tool 3: 登记/更新 Agent 任务（打卡挂牌）
# ─────────────────────────────────────────────
@mcp.tool()
def fleet_claim(
    workspace: str,
    task: str,
    agent: str = "Gemini",
    alias: str = "Candy",
    role: str = "未分配",
) -> str:
    """在 AI 舰队中登记当前 Agent 的工作节点与任务描述（打卡挂牌）。
    必须在开始任何实质性工作之前调用，防止多 Agent 抢占同一工作路径造成冲突。

    参数:
        workspace: 当前工作目录的绝对路径
        task: 本次任务的简短描述（1-2 句话）
        agent: 底层模型名称（Gemini / Claude / Codex）
        alias: 人格名称（Candy / 等）
        role: 节点角色（前端 / 后端）
    """
    cmd = [
        "pnpm", "run", "fleet:claim", "--",
        "--workspace", workspace,
        "--task", task,
        "--agent", agent,
        "--alias", alias,
        "--role", role,
    ]
    try:
        result = subprocess.run(cmd, cwd=str(BRAIN_ROOT), capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return f"挂牌失败（exit {result.returncode}）：\n{result.stderr.strip()}"
        return f"✅ 挂牌成功！\n{result.stdout.strip()}"
    except subprocess.TimeoutExpired:
        return "超时：fleet:claim 命令执行超过 30 秒。"
    except Exception as e:
        return f"执行异常：{e}"


# ─────────────────────────────────────────────
# Tool 4: 队长移交
# ─────────────────────────────────────────────
@mcp.tool()
def fleet_handover(to_node: str) -> str:
    """将队长身份移交给指定的 Agent 节点。

    参数:
        to_node: 目标节点名称（例如 "Codex-3 (Codex)"）
    """
    cmd = ["pnpm", "run", "fleet:handover", "--", "--to-node", to_node]
    try:
        result = subprocess.run(cmd, cwd=str(BRAIN_ROOT), capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return f"移交失败：\n{result.stderr.strip()}"
        return f"✅ 队长移交完成！\n{result.stdout.strip()}"
    except subprocess.TimeoutExpired:
        return "超时：fleet:handover 命令执行超过 30 秒。"
    except Exception as e:
        return f"执行异常：{e}"


# ─────────────────────────────────────────────
# Tool 5: 按需加载规则文件（防上下文污染）
# ─────────────────────────────────────────────
@mcp.tool()
def load_rule(rule_name: str) -> str:
    """按名称加载 docs/rules/ 目录下的特定规则文件（懒加载，防止上下文污染）。

    参数:
        rule_name: 规则文件名（不含 .md，例如 "webkubor_vibe_manifesto"）
    """
    target = RULES_DIR / f"{rule_name}.md"
    if not target.exists():
        available = [f.stem for f in RULES_DIR.glob("*.md")]
        return f"规则 '{rule_name}' 不存在。\n可用规则：{', '.join(available)}"
    return target.read_text(encoding="utf-8")


# ─────────────────────────────────────────────
# Tool 6: 列出所有可用规则
# ─────────────────────────────────────────────
@mcp.tool()
def list_rules() -> str:
    """列出 docs/rules/ 目录下所有可用的规则文件名称。"""
    if not RULES_DIR.exists():
        return "rules 目录不存在。"
    rules = [f.stem for f in sorted(RULES_DIR.glob("*.md"))]
    return json.dumps({"available_rules": rules, "count": len(rules)}, ensure_ascii=False, indent=2)


# ─────────────────────────────────────────────
# Tool 7: 写入任务日志（记忆哨兵）
# ─────────────────────────────────────────────
@mcp.tool()
def log_task(content: str, agent: str = "Gemini") -> str:
    """将操作记录写入今日的助手私有日志目录 $CORTEXOS_ASSISTANT_MEMORY_HOME/logs/YYYY-MM-DD.md。

    参数:
        content: 要记录的内容（Markdown 格式，1-5 句话）
        agent: 操作执行者（模型名称）
    """
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = MEMORY_LOGS / f"{today}.md"
    MEMORY_LOGS.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = f"\n## [{timestamp}] by {agent}\n{content}\n"
    if not log_file.exists():
        log_file.write_text(f"# 操作日志 {today}\n", encoding="utf-8")
    with log_file.open("a", encoding="utf-8") as f:
        f.write(entry)
    return f"✅ 日志已写入 {log_file.name}"


# ─────────────────────────────────────────────
# Tool 8: 同步舰队状态（触发前端刷新）
# ─────────────────────────────────────────────
@mcp.tool()
def fleet_sync() -> str:
    """触发 pnpm run fleet:sync-dashboard 同步舰队状态，刷新 VitePress 看板数据。"""
    try:
        result = subprocess.run(
            ["pnpm", "run", "fleet:sync-dashboard"],
            cwd=str(BRAIN_ROOT),
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            return f"同步失败（exit {result.returncode}）：\n{result.stderr.strip()}"
        return f"✅ 同步完成！\n{result.stdout.strip()}"
    except Exception as e:
        return f"执行异常：{e}"


# ─────────────────────────────────────────────
# Tool 9: 列出密钥文件
# ─────────────────────────────────────────────
@mcp.tool()
def list_secrets() -> list[str]:
    """列出外置秘钥库目录下所有可用的密钥文件名称。"""
    if not SECRETS_DIR.exists():
        return []
    return [f.name for f in SECRETS_DIR.iterdir() if f.is_file() and not f.name.startswith(".")]


# ─────────────────────────────────────────────
# Tool 10: 读取密钥文件
# ─────────────────────────────────────────────
@mcp.tool()
def read_secret(name: str) -> str:
    """读取外置秘钥库目录中的指定密钥文件内容。

    参数:
        name: 密钥文件名（例如 'github.md'、'lark.env'）
    """
    secret_path = (SECRETS_DIR / name).resolve()
    # 路径穿越防护：确保解析后路径仍在 SECRETS_DIR 内
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
# Tool 11: 发送飞书通知
# ─────────────────────────────────────────────
@mcp.tool()
def send_lark_notification(title: str, body: str) -> str:
    """通过飞书 Webhook 向老爹发送通知（仅工作时间 10:00-20:00 有效）。

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
# Tool 12: 知识库关键词检索
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

    # 语义依赖不可用时直接降级
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
# Tool 13: 轻量上下文摘要（冷启动首选，省 Token）
# ─────────────────────────────────────────────
def _strip_md(text: str) -> str:
    cleaned = re.sub(r"\*\*|`", "", text or "")
    cleaned = re.sub(r"^[-#\s]+", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


@mcp.tool()
def get_context_brief() -> str:
    """返回大脑当前状态的 200 字以内极简摘要，供 Agent 冷启动快速定向。
    推荐先调用本工具，再按需调用 read_router()。
    """
    captain = ""
    strategy = ""
    tasks_preview = "无"

    # 1) 从 fleet_status.md 提取队长与最新战略建议首行
    if FLEET_STATUS.exists():
        try:
            content = FLEET_STATUS.read_text(encoding="utf-8")
            lines = content.splitlines()

            for raw in lines:
                if "👑" in raw and "|" in raw:
                    parts = [p.strip() for p in raw.split("|")]
                    if len(parts) > 1:
                        captain = _strip_md(parts[1]).strip("*")
                        break

            in_suggestion = False
            for raw in lines:
                line = raw.strip()
                if line.startswith("### 📌 当班建议"):
                    in_suggestion = True
                    continue
                if in_suggestion and line.startswith("### ") and "当班建议" not in line:
                    break
                if in_suggestion and line.startswith("- **"):
                    strategy = _strip_md(line).strip("*")
                    break
        except Exception:
            captain = ""
            strategy = ""

    # 2) 提取待执行任务
    tasks_dir = ASSISTANT_MEMORY_HOME / "tasks"
    try:
        if tasks_dir.exists():
            pending = sorted(f.stem for f in tasks_dir.glob("task-*.md"))
            if pending:
                tasks_preview = "、".join(pending[:3])
                if len(pending) > 3:
                    tasks_preview += f" 等{len(pending)}项"
    except Exception:
        tasks_preview = "未知"

    parts = []
    if captain:
        parts.append(f"队长:{captain}")
    if strategy:
        parts.append(f"战略:{strategy}")
    parts.append(f"待办:{tasks_preview}")

    if not captain and not strategy and tasks_preview in {"无", "未知"}:
        return "状态摘要不可用，请调用 read_router() 获取完整上下文。"

    summary = " | ".join(parts)
    if len(summary) > 200:
        return f"{summary[:197].rstrip()}..."
    return summary


# ─────────────────────────────────────────────
# 启动服务
# ─────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="stdio")
