from __future__ import annotations

import json
import os
import re
import socket
import sqlite3
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[4]
DOCS_ROOT = PROJECT_ROOT / "docs"
MCP_ROOT = PROJECT_ROOT / "mcp_server"
GEMINI_ROOT = Path(os.path.expanduser("~/.gemini"))
GEMINI_SETTINGS = GEMINI_ROOT / "settings.json"
GEMINI_MEMORY_FILE = GEMINI_ROOT / "GEMINI.md"
GEMINI_STATE_FILE = GEMINI_ROOT / "state.json"
GEMINI_PROJECTS_FILE = GEMINI_ROOT / "projects.json"
GEMINI_HISTORY_DIR = GEMINI_ROOT / "history"
CLAUDE_ROOT = Path(os.path.expanduser("~/.claude"))
CLAUDE_MEMORY_FILE = CLAUDE_ROOT / "CLAUDE.md"
CLAUDE_HISTORY_FILE = CLAUDE_ROOT / "history.jsonl"
CLAUDE_PROJECTS_ROOT = CLAUDE_ROOT / "projects"
CLAUDE_CORTEXOS_INDEX = CLAUDE_PROJECTS_ROOT / "-Users-webkubor-Documents-CortexOS" / "sessions-index.json"
OPENCLAW_ROOT = Path(os.path.expanduser("~/.openclaw"))
OPENCLAW_CONFIG_FILE = OPENCLAW_ROOT / "openclaw.json"
OPENCLAW_MEMORY_FILE = OPENCLAW_ROOT / "memory/main.sqlite"
OPENCLAW_MAIN_SESSIONS_FILE = OPENCLAW_ROOT / "agents/main/sessions/sessions.json"
BRAIN_API_URL = os.environ.get(
    "BRAIN_API_URL",
    "https://brain-api-675793533606.asia-southeast2.run.app",
).strip()
SKILL_SCAN_DIRS = [
    PROJECT_ROOT / "skills",
    Path(os.path.expanduser("~/.agents/skills")),
    Path(os.path.expanduser("~/.agent/skills")),
    Path(os.path.expanduser("~/.codex/skills")),
]
PM2_ERROR_LOG = Path(os.path.expanduser("~/.pm2/logs/brain-cortex-pilot-error.log"))
PM2_OUT_LOG = Path(os.path.expanduser("~/.pm2/logs/brain-cortex-pilot-out.log"))


@dataclass
class BrainSnapshot:
    api_base_url: str
    local_node: dict[str, str]
    remote_nodes: list[dict[str, str]]
    cloud_online: bool
    cloud_version: str
    notifications_total: int
    notifications_pending: int
    tasks_total: int
    tasks_open: int
    pilot_status: str
    pilot_restarts: int
    skills_count: int
    agent_count: int
    mcp_server_count: int
    mcp_tool_count: int
    skills: list[dict]
    mcp_servers: list[dict]
    mcp_tools: list[str]
    agent_memories: list[dict]
    memory_daily_summary: list[str]
    api_endpoints: list[tuple[str, str, str]]
    ports: list[tuple[str, str, str, str, str]]
    recent_logs: list[str]
    latest_notification_titles: list[str]
    notifications: list[dict]
    tasks: list[dict]


def _run(cmd: list[str]) -> str:
    try:
        result = subprocess.run(
            cmd,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            return ""
        return result.stdout.strip()
    except Exception:
        return ""


def _fetch_json(pathname: str, query: dict[str, str] | None = None) -> dict:
    url = f"{BRAIN_API_URL}{pathname}"
    if query:
        url += "?" + urlencode(query)
    request = Request(url, headers={"accept": "application/json"})
    with urlopen(request, timeout=5) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def get_cloud_data() -> tuple[bool, str, list[dict], list[dict]]:
    try:
        health = _fetch_json("/health")
        notifications = _fetch_json("/notifications", {"project": "cortexos", "limit": "20"})
        tasks = _fetch_json("/tasks", {"project": "cortexos", "limit": "20"})
        return (
            True,
            str(health.get("version", "-")),
            list(notifications.get("notifications", [])),
            list(tasks.get("tasks", [])),
        )
    except (URLError, TimeoutError, json.JSONDecodeError, OSError):
        return False, "-", [], []


def get_pm2_processes() -> dict[str, dict]:
    raw = _run(["pm2", "jlist"])
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return {item.get("name", ""): item for item in data if item.get("name")}


def normalize_status(value: str) -> str:
    text = (value or "").strip().lower()
    if text == "online":
        return "在线"
    if text == "stopped":
        return "已停止"
    if text == "errored":
        return "异常"
    if text == "launching":
        return "启动中"
    return value or "未运行"


def canonical_skill_name(name: str) -> str:
    return (
        str(name or "")
        .strip()
        .lower()
        .removeprefix("gemini-skill-")
        .removesuffix("-skills")
        .removesuffix("-skill")
    )


def _collect_skill_rows() -> list[dict]:
    rows: dict[str, dict] = {}
    for base_dir in SKILL_SCAN_DIRS:
        if not base_dir.exists():
            continue
        try:
            entries = list(base_dir.iterdir())
        except Exception:
            continue
        for entry in entries:
            if entry.name.startswith("."):
                continue
            if not entry.is_dir() and not entry.is_symlink():
                continue
            try:
                resolved = entry.resolve()
            except Exception:
                resolved = entry
            skill_file = resolved / "SKILL.md"
            alt_skill_file = resolved / "skill.md"
            if not skill_file.exists() and not alt_skill_file.exists():
                continue
            canonical = canonical_skill_name(entry.name)
            row = rows.setdefault(
                canonical,
                {
                    "name": entry.name,
                    "category": resolved.parent.name if resolved.parent != base_dir else "skills",
                    "canonical": canonical,
                    "sources": set(),
                    "paths": set(),
                },
            )
            row["name"] = entry.name
            row["sources"].add(str(base_dir))
            row["paths"].add(str(resolved))

    output = []
    for row in rows.values():
        output.append(
            {
                "name": row["name"],
                "category": row["category"],
                "canonical": row["canonical"],
                "sources": sorted(row["sources"]),
                "path": sorted(row["paths"])[0],
            }
        )
    return sorted(output, key=lambda item: item["name"].lower())


def count_skills() -> int:
    return len(_collect_skill_rows())


def list_skills(limit: int = 50) -> list[dict]:
    return _collect_skill_rows()[:limit]


def count_agents() -> int:
    agents_dir = DOCS_ROOT / "agents"
    if not agents_dir.exists():
        return 0
    count = 0
    for child in agents_dir.iterdir():
        if not child.is_dir():
            continue
        if (child / "README.md").exists():
            count += 1
    return count


def _load_mcp_servers(config_path: Path) -> list[dict]:
    if not config_path.exists():
        return []
    try:
        data = json.loads(config_path.read_text("utf-8"))
        servers = data.get("mcpServers", {})
        return [
            {
                "name": name,
                "command": str(config.get("command", "")),
                "description": str(config.get("description", "")),
                "source": str(config_path),
            }
            for name, config in servers.items()
        ]
    except Exception:
        return []


def count_mcp_servers() -> int:
    names = {item["name"] for item in (_load_mcp_servers(MCP_ROOT / "mcp_config.json") + _load_mcp_servers(GEMINI_SETTINGS))}
    return len(names)


def list_mcp_servers() -> list[dict]:
    rows = _load_mcp_servers(MCP_ROOT / "mcp_config.json") + _load_mcp_servers(GEMINI_SETTINGS)
    deduped: dict[str, dict] = {}
    for item in rows:
        deduped[item["name"]] = item
    return sorted(deduped.values(), key=lambda item: item["name"].lower())


def count_mcp_tools() -> int:
    server_py = MCP_ROOT / "server.py"
    if not server_py.exists():
        return 0
    content = server_py.read_text("utf-8")
    return content.count("@mcp.tool()")


def list_mcp_tools(limit: int = 50) -> list[str]:
    server_py = MCP_ROOT / "server.py"
    if not server_py.exists():
        return []
    lines = server_py.read_text("utf-8").splitlines()
    tools: list[str] = []
    for index, line in enumerate(lines):
        if "@mcp.tool()" not in line:
            continue
        for next_line in lines[index + 1 : index + 7]:
            stripped = next_line.strip()
            if stripped.startswith("def "):
                tools.append(stripped.split("def ", 1)[1].split("(", 1)[0])
                break
        if len(tools) >= limit:
            break
    return tools


def list_api_endpoints() -> list[tuple[str, str, str]]:
    return [
        ("GET", "/health", "健康检查，确认 Cloud Brain 在线状态、版本和能力清单。"),
        ("GET", "/notifications", "读取主脑收件箱通知，可按 project 和 limit 拉取最近消息。"),
        ("POST", "/notifications", "由 subagent 或外部系统上报通知，进入主脑收件箱。"),
        ("DELETE", "/notifications/:id", "删除单条通知，适合清理测试数据或误写入记录。"),
        ("POST", "/notifications/delete-batch", "按一组 ids 批量删除通知。"),
        ("POST", "/notifications/:id/triage", "把指定通知分诊为 memory、task 或 archive。"),
        ("GET", "/memories", "读取长期记忆，供主脑或外部 agent 取上下文。"),
        ("POST", "/memories", "写入长期记忆，沉淀高价值事实、结论和经验。"),
        ("GET", "/tasks", "读取任务列表，查看主脑当前待办和执行状态。"),
        ("POST", "/tasks", "创建任务，供主脑或外部系统分发后续动作。"),
    ]


def get_local_node() -> dict[str, str]:
    hostname = socket.gethostname()
    ip = ""
    for iface in ("en0", "en1", "bridge0"):
        try:
            out = subprocess.check_output(["ipconfig", "getifaddr", iface], text=True).strip()
            if out:
                ip = out
                break
        except Exception:
            continue
    if not ip:
        try:
            ip = socket.gethostbyname(hostname)
        except Exception:
            ip = "未识别"
    return {
        "name": "本机终端",
        "node_id": "local-terminal",
        "hostname": hostname,
        "ip": ip or "未识别",
        "environment": "local",
        "region": "asia-shanghai",
        "source": "cortexos",
    }


def _extract_public_ip(item: dict) -> str:
    metadata = item.get("metadata") or {}
    for key in ("publicIp", "public_ip", "nodeIp", "node_ip", "ip"):
        value = str(metadata.get(key) or "").strip()
        if value:
            return value
    content = str(item.get("content") or "")
    matches = re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", content)
    for ip in matches:
        if not ip.startswith("127."):
            return ip
    return "未上报"


def list_remote_nodes(notifications: list[dict], limit: int = 8) -> list[dict[str, str]]:
    seen: set[str] = set()
    nodes: list[dict[str, str]] = []
    for item in notifications:
        metadata = item.get("metadata") or {}
        node_id = str(
            metadata.get("nodeId")
            or metadata.get("node_id")
            or item.get("source")
            or item.get("agent")
            or ""
        ).strip()
        if not node_id or node_id == "cortexos":
            continue
        if node_id in seen:
            continue
        seen.add(node_id)
        nodes.append(
            {
                "name": str(metadata.get("nodeName") or metadata.get("node_name") or item.get("source") or node_id),
                "node_id": node_id,
                "source": str(item.get("source") or item.get("agent") or "unknown"),
                "model": str(metadata.get("model") or item.get("agent") or "unknown"),
                "environment": str(metadata.get("environment") or "unknown"),
                "region": str(metadata.get("region") or "unknown"),
                "hostname": str(metadata.get("hostname") or "unknown"),
                "ip": _extract_public_ip(item),
            }
        )
        if len(nodes) >= limit:
            break
    return nodes


def _parse_listen_name(name: str) -> tuple[str, str, str]:
    text = (name or "").strip()
    if not text:
        return "-", "-", "监听"

    match = re.search(r"(.+):(\d+)$", text)
    if match:
        host = match.group(1)
        port = match.group(2)
    else:
        host = text
        port = "-"

    host = host.replace("*", "全部地址")
    host = host.replace("127.0.0.1", "本地回环")
    host = host.replace("[::1]", "本地 IPv6")

    return port, host, "监听"


def list_ports(limit: int = 18) -> list[tuple[str, str, str, str, str]]:
    raw = _run(["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"])
    lines = raw.splitlines()
    if len(lines) <= 1:
        return []
    rows: list[tuple[str, str, str, str, str]] = []
    seen: set[tuple[str, str, str, str]] = set()
    for line in lines[1:]:
        parts = re.split(r"\s+", line.strip())
        if len(parts) < 10:
            continue
        command = parts[0]
        pid = parts[1]
        name = parts[-2]
        port, host, state = _parse_listen_name(name)
        dedupe_key = (command, pid, port, host)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        rows.append((command, pid, port, host, state))
        if len(rows) >= limit:
            break
    return rows


def _tail_lines(path: Path, limit: int = 10) -> list[str]:
    if not path.exists():
        return []
    try:
        lines = path.read_text("utf-8", errors="ignore").splitlines()
        cleaned = [line.strip() for line in lines if line.strip()]
        return cleaned[-limit:]
    except Exception:
        return []


def recent_log_lines() -> list[str]:
    lines = _tail_lines(PM2_OUT_LOG, 8)
    if not lines:
        lines = _tail_lines(PM2_ERROR_LOG, 8)
    return lines


def _format_timestamp(value: int | float | None, milliseconds: bool = False) -> str:
    if not value:
        return "未记录"
    try:
        ts = float(value)
        if milliseconds:
            ts /= 1000.0
        return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return "未记录"


def _read_markdown_summary(path: Path, limit: int = 4) -> list[str]:
    if not path.exists():
        return []
    lines = path.read_text("utf-8", errors="ignore").splitlines()
    summary: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            summary.append(stripped.lstrip("# "))
        elif stripped.startswith(("- ", "* ")):
            summary.append(stripped[2:])
        elif stripped.startswith(">"):
            summary.append(stripped.lstrip("> "))
        else:
            summary.append(stripped)
        if len(summary) >= limit:
            break
    return summary


def _gemini_latest_project() -> tuple[str, str]:
    latest_label = "未识别"
    latest_time = "未记录"
    if GEMINI_HISTORY_DIR.exists():
        try:
            files = [p for p in GEMINI_HISTORY_DIR.rglob("*") if p.is_file()]
            if files:
                latest = max(files, key=lambda p: p.stat().st_mtime)
                latest_label = latest.parent.name
                latest_time = _format_timestamp(latest.stat().st_mtime)
        except Exception:
            pass
    return latest_label, latest_time


def load_gemini_memory() -> dict:
    summary = _read_markdown_summary(GEMINI_MEMORY_FILE, limit=5)
    latest_project, latest_time = _gemini_latest_project()
    project_count = 0
    if GEMINI_PROJECTS_FILE.exists():
        try:
            projects = json.loads(GEMINI_PROJECTS_FILE.read_text("utf-8")).get("projects", {})
            project_count = len(projects)
        except Exception:
            project_count = 0
    tips_shown = "-"
    if GEMINI_STATE_FILE.exists():
        try:
            state = json.loads(GEMINI_STATE_FILE.read_text("utf-8"))
            tips_shown = str(state.get("tipsShown", "-"))
        except Exception:
            tips_shown = "-"
    return {
        "agent_id": "gemini-local",
        "name": "Gemini",
        "source": str(GEMINI_MEMORY_FILE),
        "summary": summary or ["当前没有读取到 Gemini 长期记忆摘要。"],
        "status": "可读取" if GEMINI_MEMORY_FILE.exists() else "缺失",
        "current_focus": latest_project,
        "last_active_at": latest_time,
        "progress_hint": f"项目映射 {project_count} 个 · tipsShown {tips_shown}",
        "memory_scope": "markdown + state/history",
    }


def _claude_latest_session() -> tuple[str, str, str]:
    if not CLAUDE_CORTEXOS_INDEX.exists():
        return "未识别", "未记录", "当前没有 CortexOS 会话索引"
    try:
        data = json.loads(CLAUDE_CORTEXOS_INDEX.read_text("utf-8"))
        entries = data.get("entries", [])
    except Exception:
        return "未识别", "未记录", "CortexOS sessions-index 无法解析"
    if not entries:
        return "未识别", "未记录", "当前没有 CortexOS 会话记录"

    latest = max(entries, key=lambda item: str(item.get("modified") or item.get("created") or ""))
    focus = str(latest.get("firstPrompt") or "未识别").strip().replace("\n", " ")
    if len(focus) > 48:
        focus = focus[:48] + "..."
    message_count = int(latest.get("messageCount") or 0)
    last_active = str(latest.get("modified") or latest.get("created") or "")
    if last_active:
        last_active = last_active[:16].replace("T", " ")
    else:
        last_active = "未记录"
    return focus, last_active, f"CortexOS 会话：{len(entries)} 条 · 最近消息 {message_count} 条"


def load_claude_memory() -> dict:
    summary = _read_markdown_summary(CLAUDE_MEMORY_FILE, limit=5)
    focus, last_active, progress = _claude_latest_session()
    history_time = _format_timestamp(CLAUDE_HISTORY_FILE.stat().st_mtime) if CLAUDE_HISTORY_FILE.exists() else "未记录"
    if last_active == "未记录":
        last_active = history_time
    return {
        "agent_id": "claude-local",
        "name": "Claude",
        "source": str(CLAUDE_MEMORY_FILE),
        "summary": summary or ["当前没有读取到 Claude 长期记忆摘要。"],
        "status": "可读取" if CLAUDE_MEMORY_FILE.exists() else "缺失",
        "current_focus": focus,
        "last_active_at": last_active,
        "progress_hint": progress,
        "memory_scope": "markdown + sessions-index",
    }


def _safe_session_label(origin: dict | None, session_key: str) -> str:
    if not isinstance(origin, dict):
        return session_key
    for key in ("label", "provider", "surface", "from", "to"):
        value = str(origin.get(key) or "").strip()
        if value:
            return value
    return session_key


def _load_openclaw_config_summary() -> tuple[list[str], str]:
    if not OPENCLAW_CONFIG_FILE.exists():
        return ["当前没有读取到 OpenClaw 配置。"], "未记录"
    try:
        config = json.loads(OPENCLAW_CONFIG_FILE.read_text("utf-8"))
    except Exception:
        return ["OpenClaw 配置存在，但当前无法解析。"], "未记录"

    agents_list = config.get("agents", {}).get("list", [])
    channels = sorted((config.get("channels") or {}).keys())
    skills_entries = len((config.get("skills") or {}).get("entries", []))
    summary = [
        f"已注册 agent：{len(agents_list)} 个",
        f"频道绑定：{', '.join(channels) if channels else '无'}",
        f"技能条目：{skills_entries} 个",
    ]
    primary = (
        config.get("agents", {})
        .get("defaults", {})
        .get("model", {})
        .get("primary")
    )
    if primary:
        summary.append(f"主模型：{primary}")
    updated = _format_timestamp(OPENCLAW_CONFIG_FILE.stat().st_mtime)
    return summary, updated


def _load_openclaw_memory_summary() -> tuple[str, str]:
    if not OPENCLAW_MEMORY_FILE.exists():
        return "主记忆库缺失", "未记录"
    try:
        conn = sqlite3.connect(OPENCLAW_MEMORY_FILE)
        files_count = conn.execute("select count(*) from files").fetchone()[0]
        chunks_count = conn.execute("select count(*) from chunks").fetchone()[0]
        meta = conn.execute("select value from meta where key = 'memory_index_meta_v1'").fetchone()
        provider = "未知"
        model = "未知"
        if meta and meta[0]:
            meta_json = json.loads(meta[0])
            provider = str(meta_json.get("provider") or "未知")
            model = str(meta_json.get("model") or "未知")
        conn.close()
        return f"主记忆库：files {files_count} · chunks {chunks_count}", f"索引：{model} / {provider}"
    except Exception:
        return "主记忆库可见，但当前无法解析", "索引：未识别"


def _load_openclaw_sessions_summary() -> tuple[str, str, str]:
    if not OPENCLAW_MAIN_SESSIONS_FILE.exists():
        return "未识别", "未记录", "当前没有 main sessions.json"
    try:
        sessions = json.loads(OPENCLAW_MAIN_SESSIONS_FILE.read_text("utf-8"))
    except Exception:
        return "未识别", "未记录", "main sessions.json 无法解析"
    if not isinstance(sessions, dict) or not sessions:
        return "未识别", "未记录", "当前没有 main session 数据"

    latest_key, latest_value = max(
        sessions.items(),
        key=lambda item: float((item[1] or {}).get("updatedAt") or 0),
    )
    latest_value = latest_value or {}
    focus = _safe_session_label(latest_value.get("origin"), latest_key)
    last_active = _format_timestamp(latest_value.get("updatedAt"), milliseconds=True)
    progress = f"main sessions：{len(sessions)} 条"
    return focus, last_active, progress


def load_openclaw_memory() -> dict:
    config_summary, config_time = _load_openclaw_config_summary()
    memory_summary, index_summary = _load_openclaw_memory_summary()
    focus, last_active, session_progress = _load_openclaw_sessions_summary()
    return {
        "agent_id": "openclaw-main",
        "name": "OpenClaw",
        "source": f"{OPENCLAW_CONFIG_FILE} + {OPENCLAW_MEMORY_FILE}",
        "summary": config_summary + [memory_summary, index_summary],
        "status": "可读取" if OPENCLAW_CONFIG_FILE.exists() else "缺失",
        "current_focus": focus,
        "last_active_at": last_active if last_active != "未记录" else config_time,
        "progress_hint": session_progress,
        "memory_scope": "config + main.sqlite + main sessions",
    }


def build_memory_daily_summary(items: list[dict]) -> list[str]:
    lines: list[str] = []
    for item in items:
        lines.append(
            f"{item['name']}：{item.get('current_focus') or '未识别'} · 最近 {item.get('last_active_at') or '未记录'}"
        )
        progress = str(item.get("progress_hint") or "").strip()
        if progress:
            lines.append(f"  {progress}")
        summary = item.get("summary") or []
        if summary:
            lines.append(f"  摘要：{summary[0]}")
    return lines


def list_agent_memories() -> list[dict]:
    items = [load_claude_memory(), load_gemini_memory(), load_openclaw_memory()]
    return sorted(items, key=lambda item: item["name"].lower())


def build_snapshot() -> BrainSnapshot:
    cloud_online, cloud_version, notifications, tasks = get_cloud_data()
    pending_notifications = [
        item for item in notifications if str(item.get("status", "")).lower() in {"new", "triaged"}
    ]
    open_tasks = [item for item in tasks if str(item.get("status", "")) != "已完成"]

    pm2_processes = get_pm2_processes()
    pilot = pm2_processes.get("brain-cortex-pilot", {})
    pilot_status = normalize_status(str(pilot.get("pm2_env", {}).get("status", "未运行")))
    pilot_restarts = int(pilot.get("pm2_env", {}).get("restart_time", 0) or 0)

    latest_titles = []
    for item in notifications[:3]:
        title = str(item.get("title") or item.get("id") or "未命名通知")
        created = str(item.get("createdAt") or "")
        latest_titles.append(f"{title} · {created[:19].replace('T', ' ')}")

    agent_memories = list_agent_memories()

    return BrainSnapshot(
        api_base_url=BRAIN_API_URL,
        local_node=get_local_node(),
        remote_nodes=list_remote_nodes(notifications),
        cloud_online=cloud_online,
        cloud_version=cloud_version,
        notifications_total=len(notifications),
        notifications_pending=len(pending_notifications),
        tasks_total=len(tasks),
        tasks_open=len(open_tasks),
        pilot_status=pilot_status,
        pilot_restarts=pilot_restarts,
        skills_count=count_skills(),
        agent_count=count_agents(),
        mcp_server_count=count_mcp_servers(),
        mcp_tool_count=count_mcp_tools(),
        skills=list_skills(),
        mcp_servers=list_mcp_servers(),
        mcp_tools=list_mcp_tools(),
        agent_memories=agent_memories,
        memory_daily_summary=build_memory_daily_summary(agent_memories),
        api_endpoints=list_api_endpoints(),
        ports=list_ports(),
        recent_logs=recent_log_lines(),
        latest_notification_titles=latest_titles,
        notifications=notifications,
        tasks=tasks,
    )
