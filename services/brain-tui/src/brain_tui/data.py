from __future__ import annotations

import json
import os
import re
import socket
import subprocess
from dataclasses import dataclass
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[4]
DOCS_ROOT = PROJECT_ROOT / "docs"
MCP_ROOT = PROJECT_ROOT / "mcp_server"
BRAIN_API_URL = os.environ.get(
    "BRAIN_API_URL",
    "https://brain-api-675793533606.asia-southeast2.run.app",
).strip()
SKILLS_ROOT = Path(os.path.expanduser("~/Desktop/skills"))
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


def count_skills() -> int:
    if not SKILLS_ROOT.exists():
        return 0
    return len(list(SKILLS_ROOT.glob("**/SKILL.md")))


def list_skills(limit: int = 50) -> list[dict]:
    if not SKILLS_ROOT.exists():
        return []
    rows: list[dict] = []
    for skill_file in sorted(SKILLS_ROOT.glob("**/SKILL.md"))[:limit]:
        skill_dir = skill_file.parent
        name = skill_dir.name
        category = skill_dir.parent.name if skill_dir.parent != SKILLS_ROOT else "skills"
        rows.append(
            {
                "name": name,
                "category": category,
                "path": str(skill_dir),
            }
        )
    return rows


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


def count_mcp_servers() -> int:
    config_path = MCP_ROOT / "mcp_config.json"
    if not config_path.exists():
        return 0
    try:
        data = json.loads(config_path.read_text("utf-8"))
        return len(data.get("mcpServers", {}))
    except Exception:
        return 0


def list_mcp_servers() -> list[dict]:
    config_path = MCP_ROOT / "mcp_config.json"
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
            }
            for name, config in servers.items()
        ]
    except Exception:
        return []


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
        api_endpoints=list_api_endpoints(),
        ports=list_ports(),
        recent_logs=recent_log_lines(),
        latest_notification_titles=latest_titles,
        notifications=notifications,
        tasks=tasks,
    )
