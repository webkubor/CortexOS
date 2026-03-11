"""
CortexOS 外部大脑 MCP Server（统一版 v2.1 - 协同进化版）
基于 FastMCP，暴露大脑的核心操作 Tool。
新增：秘钥写入工具、Obsidian 协同增强日志。
启动方式：uv run server.py
接入配置：{ "command": "uv", "args": ["run", "/path/to/CortexOS/mcp_server/server.py"] }
"""

import json
import os
import re
import sqlite3
import subprocess
from datetime import UTC, datetime
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
ROUTER = DOCS / "router.md"
SECRETS_DIR = Path(
    os.environ.get(
        "CORTEXOS_SECRET_HOME",
        str((Path.home() / "Documents" / "memory" / "secrets").resolve()),
    )
)
KNOWLEDGE_DIR = Path(os.environ.get("CORTEXOS_KNOWLEDGE_HOME", str((BRAIN_ROOT.parent / "memory" / "knowledge").resolve())))
AI_TEAM_DB = ASSISTANT_MEMORY_HOME / "sqlite" / "ai-team.db"

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
# Helpers
# ─────────────────────────────────────────────
def _task_id_pattern() -> re.Pattern[str]:
    # 兼容历史任务书、日期任务与数据库自动生成任务号
    return re.compile(r"(?:task[-#]?\d{1,14}(?:-[a-z0-9-]+)?|\d{4}-\d{2}-\d{2}-[a-z0-9-]+)", re.IGNORECASE)


def _task_file_name_pattern() -> re.Pattern[str]:
    # 文件名层面的兜底匹配（大小写不敏感）
    return re.compile(r"^task-(?:\d{3}-[a-z0-9-]+|\d{8}-\d{3})\.md$", re.IGNORECASE)


def _iter_task_files(tasks_dir: Path) -> list[Path]:
    if not tasks_dir.exists():
        return []
    seen: set[Path] = set()
    files: list[Path] = []
    pattern = _task_file_name_pattern()
    for file_path in sorted(tasks_dir.glob("*.md")):
        if pattern.match(file_path.name):
            resolved = file_path.resolve()
            if resolved not in seen:
                seen.add(resolved)
                files.append(file_path)
    return files


def _extract_task_code(task_ref: str) -> str:
    raw = (task_ref or "").strip().lower().removesuffix(".md")
    if not raw:
        return ""
    if raw.isdigit():
        return raw.zfill(3)
    m = re.search(r"task[#-]?(\d{1,3})", raw, flags=re.IGNORECASE)
    if m:
        return m.group(1).zfill(3)
    m = re.search(r"-(\d{3})$", raw)
    if m:
        return m.group(1)
    return ""


def _priority_rank(priority: str) -> int:
    text = (priority or "").lower()
    if any(token in text for token in ["high", "紧急", "高", "🔴"]):
        return 0
    if any(token in text for token in ["medium", "重要", "中", "🟡"]):
        return 1
    if any(token in text for token in ["low", "低", "🟢"]):
        return 2
    return 3


def _complete_ai_team_db_task(task_id: str, agent: str = "Codex", summary: str = "") -> dict[str, object]:
    normalized_task_id = (task_id or "").strip()
    if not normalized_task_id or not AI_TEAM_DB.exists():
        return {"found": False}

    now_iso = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    now_local = datetime.now().strftime("%Y-%m-%d %H:%M")

    with sqlite3.connect(AI_TEAM_DB) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT task_id, title, assignee_member_id, completed, status
            FROM tasks
            WHERE lower(task_id) = lower(?)
            LIMIT 1
            """,
            (normalized_task_id,),
        ).fetchone()
        if not row:
            return {"found": False}

        if int(row["completed"] or 0) != 1 and (row["status"] or "").strip() != "已完成":
            conn.execute(
                """
                UPDATE tasks
                SET status = '已完成', completed = 1, updated_at = ?, synced_at = ?
                WHERE lower(task_id) = lower(?)
                """,
                (now_iso, now_iso, normalized_task_id),
            )

        assignee_member_id = (row["assignee_member_id"] or "").strip()
        if assignee_member_id:
            agent_row = conn.execute(
                """
                SELECT member_id, task
                FROM agents
                WHERE lower(member_id) = lower(?)
                LIMIT 1
                """,
                (assignee_member_id,),
            ).fetchone()
            if agent_row and normalized_task_id.lower() in (agent_row["task"] or "").lower():
                conn.execute(
                    """
                    UPDATE agents
                    SET task = '待分配任务', updated_at = ?, heartbeat_at = COALESCE(NULLIF(heartbeat_at, ''), ?)
                    WHERE lower(member_id) = lower(?)
                    """,
                    (now_local, now_local, assignee_member_id),
                )

        conn.execute(
            """
            INSERT INTO operation_logs (action, target_type, target_id, payload_json)
            VALUES (?, ?, ?, ?)
            """,
            (
                "complete-task",
                "tasks",
                row["task_id"],
                json.dumps(
                    {
                        "operator": (agent or "Codex").strip() or "Codex",
                        "reason": "mcp:task_handoff_check",
                        "taskId": row["task_id"],
                        "title": row["title"] or row["task_id"],
                        "summary": (summary or "").strip(),
                    },
                    ensure_ascii=False,
                ),
            ),
        )

    return {"found": True, "task_id": row["task_id"], "already_done": int(row["completed"] or 0) == 1 or (row["status"] or "").strip() == "已完成"}

def _strip_md(text: str) -> str:
    cleaned = re.sub(r"\*\*|`", "", text or "")
    cleaned = re.sub(r"^[-#\s]+", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


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
    cmd = ["pnpm", "run", "fleet:status", "--", "--json"]
    try:
        result = subprocess.run(cmd, cwd=str(BRAIN_ROOT), capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return json.dumps({"error": result.stderr.strip() or result.stdout.strip() or "fleet:status 执行失败"}, ensure_ascii=False)
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return json.dumps({"error": "fleet:status 执行超时"}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": f"fleet:status 执行异常: {e}"}, ensure_ascii=False)


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
# Tool 7: 写入任务日志（Obsidian 协同版）
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
    
    # 尝试匹配 Task ID 并注入双链，方便在 Obsidian 中反向链接
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
# Tool 11: 写入/更新密钥文件 (NEW)
# ─────────────────────────────────────────────
@mcp.tool()
def write_secret(name: str, content: str) -> str:
    """安全地写入或更新秘钥文件。
    该工具会自动确保路径安全，并支持配置信息的持久化。

    参数:
        name: 秘钥文件名（建议以 .md 或 .env 结尾）
        content: 秘钥内容（推荐格式：KEY=VALUE）
    """
    # 强制安全检查
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
# Tool 12: 发送飞书通知
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
# Tool 13: 知识库关键词检索
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
# Tool 14: 轻量上下文摘要（冷启动首选，省 Token）
# ─────────────────────────────────────────────
@mcp.tool()
def get_context_brief() -> str:
    """返回大脑当前状态的 200 字以内极简摘要，供 Agent 冷启动快速定向。
    推荐先调用本工具，再按需调用 read_router()。
    """
    captain = ""
    tasks_preview = "无"
    try:
        state_raw = get_fleet_status()
        state = json.loads(state_raw)
        captain = str(state.get("captain") or "").strip()
    except Exception:
        captain = ""

    try:
        queue = _collect_task_queue()
        pending = [item["task_id"] for item in queue if not item["completed"]]
        if pending:
            tasks_preview = "、".join(pending[:3])
            if len(pending) > 3:
                tasks_preview += f" 等{len(pending)}项"
    except Exception:
        tasks_preview = "未知"

    parts = []
    if captain:
        parts.append(f"队长:{captain}")
    parts.append(f"待办:{tasks_preview}")

    if not captain and tasks_preview in {"无", "未知"}:
        return "状态摘要不可用，请调用 read_router() 获取完整上下文。"

    summary = " | ".join(parts)
    if len(summary) > 200:
        return f"{summary[:197].rstrip()}..."
    return summary


# ─────────────────────────────────────────────
# Tool 15: 任务完工与待认领检查 (NEW)
# ─────────────────────────────────────────────
def _tasks_dir() -> Path:
    return ASSISTANT_MEMORY_HOME / "tasks"


def _extract_active_claimed_task_ids() -> set[str]:
    task_ids: set[str] = set()
    try:
        state = json.loads(get_fleet_status())
        agents = state.get("members") or state.get("agents") or []
        for agent in agents:
            for matched in _task_id_pattern().findall(str(agent.get("task", ""))):
                task_ids.add(matched.lower())
    except Exception:
        return set()
    return task_ids


def _resolve_task_file(task_id: str) -> Path | None:
    tasks_dir = _tasks_dir()
    if not tasks_dir.exists():
        return None
    normalized = (task_id or "").strip().lower()
    if not normalized:
        return None
    normalized = normalized.removesuffix(".md")
    task_code = _extract_task_code(normalized)

    for file_path in _iter_task_files(tasks_dir):
        stem = file_path.stem.lower()
        if normalized == stem:
            return file_path
        if normalized.isdigit() and stem.startswith(f"task-{normalized.zfill(3)}-"):
            return file_path
        if task_code and (stem.startswith(f"task-{task_code}-") or stem.endswith(f"-{task_code}")):
            return file_path
        if normalized in stem:
            return file_path
    return None


def _task_is_completed(content: str) -> bool:
    return bool(re.search(r"^>\s*状态[:：].*(?:✅\s*)?已完成", content, flags=re.MULTILINE))


def _extract_task_status(content: str) -> str:
    status_match = re.search(r"^>\s*状态[:：]\s*(.+)$", content, flags=re.MULTILINE)
    if not status_match:
        return "未知"
    status_text = _strip_md(status_match.group(1))
    if "已完成" in status_text:
        return "已完成"
    if any(token in status_text for token in ["执行中", "进行中"]):
        return "执行中"
    if any(token in status_text for token in ["待启动", "待处理", "待办", "待分配"]):
        return "待启动"
    return status_text


def _extract_task_priority(content: str) -> str:
    # 优先读取带“优先级”字段的头信息
    inline_match = re.search(r"^\s*>\s*执行人[:：].*?\|\s*优先级[:：]\s*([^|\n]+)", content, flags=re.MULTILINE)
    if inline_match:
        return _strip_md(inline_match.group(1))
    block_match = re.search(r"^##\s*优先级\s*$\n([^\n]+)", content, flags=re.MULTILINE)
    if block_match:
        return _strip_md(block_match.group(1))
    return "未标注"


def _upsert_task_completed(task_file: Path, agent: str, summary: str) -> dict:
    raw = task_file.read_text(encoding="utf-8")
    if _task_is_completed(raw):
        return {"task_id": task_file.stem, "changed": False, "already_done": True}

    now_local = datetime.now().strftime("%Y-%m-%d %H:%M")
    status_line = f"> 状态: ✅ 已完成 | 完成人: {agent} | 完成时间: {now_local}"
    updated = raw

    if re.search(r"^>\s*状态[:：].*$", updated, flags=re.MULTILINE):
        updated = re.sub(r"^>\s*状态[:：].*$", status_line, updated, count=1, flags=re.MULTILINE)
    elif re.search(r"^>\s*执行人[:：].*$", updated, flags=re.MULTILINE):
        updated = re.sub(r"^(>\s*执行人[:：].*$)", rf"\1\n{status_line}", updated, count=1, flags=re.MULTILINE)
    else:
        updated = f"{status_line}\n{updated}"

    section_title = "## ✅ 完成记录"
    summary_text = (summary or "").strip() or "已完成并通过验收。"
    record_block = (
        f"\n\n{section_title}\n"
        f"- 完成人: {agent}\n"
        f"- 完成时间: {now_local}\n"
        f"- 结果: {summary_text}\n"
    )
    if section_title in updated:
        updated += f"\n- [{now_local}] {agent}: {summary_text}\n"
    else:
        updated = updated.rstrip() + record_block

    task_file.write_text(updated.rstrip() + "\n", encoding="utf-8")
    return {"task_id": task_file.stem, "changed": True, "already_done": False}


def _collect_task_queue() -> list[dict]:
    if AI_TEAM_DB.exists():
        try:
            with sqlite3.connect(AI_TEAM_DB) as conn:
                conn.row_factory = sqlite3.Row
                rows = conn.execute(
                    """
                    SELECT
                      task_id,
                      title,
                      assignee,
                      completed,
                      status,
                      priority,
                      priority_rank
                    FROM tasks
                    ORDER BY completed ASC, priority_rank ASC, updated_at DESC, task_id ASC
                    """
                ).fetchall()
            return [
                {
                    "task_id": str(row["task_id"]).lower(),
                    "title": row["title"] or "",
                    "assignee": row["assignee"] or "",
                    "completed": bool(row["completed"]),
                    "status": row["status"] or ("已完成" if row["completed"] else "待启动"),
                    "priority": row["priority"] or "未标注",
                    "priority_rank": int(row["priority_rank"] or 3),
                }
                for row in rows
            ]
        except Exception:
            pass

    tasks_dir = _tasks_dir()
    if not tasks_dir.exists():
        return []

    queue: list[dict] = []
    for file_path in _iter_task_files(tasks_dir):
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception:
            continue

        title = ""
        assignee = ""
        title_match = re.search(r"^#\s+(.+)$", content, flags=re.MULTILINE)
        if title_match:
            title = _strip_md(title_match.group(1))
        assignee_match = re.search(r"^\s*>\s*执行人[:：]\s*(.+)$", content, flags=re.MULTILINE)
        if assignee_match:
            assignee = _strip_md(assignee_match.group(1)).split("|", 1)[0].strip()

        priority = _extract_task_priority(content)
        status = _extract_task_status(content)

        queue.append(
            {
                "task_id": file_path.stem.lower(),
                "title": title,
                "assignee": assignee,
                "completed": _task_is_completed(content),
                "status": status,
                "priority": priority,
                "priority_rank": _priority_rank(priority),
            }
        )
    # 调度视图：未完成优先，其次高优先级优先
    queue.sort(key=lambda item: (item["completed"], item["priority_rank"], item["task_id"]))
    return queue


@mcp.tool()
def task_handoff_check(task_id: str = "", agent: str = "Codex", summary: str = "") -> str:
    """任务收工检查：可选标记任务已完成，并返回仍未认领的待办任务列表。

    推荐在每次任务交付后调用：
    1) 传入 task_id 标记完成
    2) 自动检查未认领任务，便于下一位 Agent 接单
    """
    messages: list[str] = []
    normalized_agent = (agent or "Codex").strip() or "Codex"

    if task_id.strip():
        task_file = _resolve_task_file(task_id)
        db_result = _complete_ai_team_db_task(task_id, normalized_agent, summary)

        if task_file:
            result = _upsert_task_completed(task_file, normalized_agent, summary)
            if result.get("already_done"):
                messages.append(f"任务已是完成状态: {result['task_id']}")
            else:
                messages.append(f"已标记完成: {result['task_id']}")
        elif db_result.get("found"):
            messages.append(f"未找到任务书文件，已按数据库任务收工: {db_result['task_id']}")
        else:
            messages.append(f"未找到任务文件: {task_id}")

        if db_result.get("found"):
            if db_result.get("already_done"):
                messages.append(f"数据库任务已是完成状态: {db_result['task_id']}")
            else:
                messages.append(f"数据库任务已标记完成: {db_result['task_id']}")

    queue = _collect_task_queue()
    claimed_ids = _extract_active_claimed_task_ids()
    pending = [item for item in queue if not item["completed"]]
    unclaimed = [item for item in pending if item["task_id"] not in claimed_ids]
    high_pending = [item for item in pending if item["priority_rank"] == 0]

    messages.append(
        f"任务池: 总计{len(queue)} | 待完成{len(pending)} | 高优待完成{len(high_pending)} | 未认领{len(unclaimed)}"
    )
    if unclaimed:
        preview = "；".join(
            f"{item['task_id']}（{item['priority']}｜{item['assignee'] or '未指定执行人'}）"
            for item in unclaimed[:5]
        )
        if len(unclaimed) > 5:
            preview += f"；...共{len(unclaimed)}项"
        messages.append(f"未认领待办: {preview}")
    else:
        messages.append("未认领待办: 无")

    if high_pending:
        high_preview = "；".join(item["task_id"] for item in high_pending[:5])
        if len(high_pending) > 5:
            high_preview += f"；...共{len(high_pending)}项"
        messages.append(f"高优任务提示: {high_preview}")

    return "\n".join(messages)


# ─────────────────────────────────────────────
# 启动服务
# ─────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="stdio")
