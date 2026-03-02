"""
AI_Common 外部大脑 MCP Server
基于 FastMCP，暴露"大脑"的核心操作为可被 AI 直接调用的 Tool。
启动方式：
  uv run server.py
在 Gemini CLI / Claude 的 MCP 配置中添加：
  { "command": "uv", "args": ["run", "/Users/webkubor/Documents/AI_Common/mcp_server/server.py"] }
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path

from fastmcp import FastMCP

# ===== 全局路径常量 =====
BRAIN_ROOT = Path("/Users/webkubor/Documents/AI_Common")
DOCS = BRAIN_ROOT / "docs"
FLEET_STATUS = DOCS / "memory" / "fleet_status.md"
FLEET_JSON = BRAIN_ROOT / "docs" / "public" / "data" / "ai_team_status.json"
RULES_DIR = DOCS / "rules"
MEMORY_LOGS = DOCS / "memory" / "logs"
ROUTER = DOCS / "router.md"

mcp = FastMCP(name="AI_Common Brain")


# ─────────────────────────────────────────────
# Tool 1: 读取路由协议（大脑宪法）
# ─────────────────────────────────────────────
@mcp.tool()
def read_router() -> str:
    """读取 router.md——大脑的最高协议和动态路由规则。
    任何 Agent 在开始工作前都应先调用此工具，以获得完整的上下文和行为规范。
    """
    if not ROUTER.exists():
        return "错误：router.md 不存在，请检查 AI_Common 目录。"
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
    return json.dumps({"error": "fleet status 文件不存在，请先执行 pnpm run fleet:sync"}, ensure_ascii=False)


# ─────────────────────────────────────────────
# Tool 3: 登记/更新 Agent 任务（打卡挂牌）
# ─────────────────────────────────────────────
@mcp.tool()
def fleet_claim(
    workspace: str,
    task: str,
    agent: str = "Gemini",
    alias: str = "Candy",
) -> str:
    """在 AI 舰队中登记当前 Agent 的工作节点与任务描述（打卡挂牌）。
    必须在开始任何实质性工作之前调用，防止多 Agent 抢占同一工作路径造成冲突。

    参数:
        workspace: 当前工作目录的绝对路径（例如 /Users/webkubor/Desktop/my-project）
        task: 本次任务的简短描述（1-2 句话）
        agent: 底层模型名称（Gemini / Claude / Codex）
        alias: 人格名称（Candy / Opus / 等）
    """
    cmd = [
        "pnpm", "run", "fleet:claim", "--",
        "--workspace", workspace,
        "--task", task,
        "--agent", agent,
        "--alias", alias,
    ]
    try:
        result = subprocess.run(
            cmd,
            cwd=str(BRAIN_ROOT),
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            return f"挂牌失败（exit {result.returncode}）：\n{result.stderr.strip()}"
        return f"✅ 挂牌成功！\n{output}"
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
    当需要切换主控 Agent 时调用。

    参数:
        to_node: 目标节点名称（例如 "Codex-3 (Codex)"）
    """
    cmd = ["pnpm", "run", "fleet:handover", "--", "--to-node", to_node]
    try:
        result = subprocess.run(
            cmd,
            cwd=str(BRAIN_ROOT),
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            return f"移交失败：\n{result.stderr.strip()}"
        return f"✅ 队长移交完成！\n{result.stdout.strip()}"
    except Exception as e:
        return f"执行异常：{e}"


# ─────────────────────────────────────────────
# Tool 5: 按标签按需加载规则文件（防上下文污染）
# ─────────────────────────────────────────────
@mcp.tool()
def load_rule(rule_name: str) -> str:
    """按名称加载 docs/rules/ 目录下的特定规则文件（按需懒加载，防止上下文污染）。
    调用前先用 list_rules() 获取可用的规则列表。

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
    """列出 docs/rules/ 目录下所有可用的规则文件名称。
    用于在 load_rule() 前选择正确的规则标识符。
    """
    if not RULES_DIR.exists():
        return "rules 目录不存在。"
    rules = [f.stem for f in sorted(RULES_DIR.glob("*.md"))]
    return json.dumps(
        {"available_rules": rules, "count": len(rules)},
        ensure_ascii=False,
        indent=2,
    )


# ─────────────────────────────────────────────
# Tool 7: 写入任务日志（记忆哨兵）
# ─────────────────────────────────────────────
@mcp.tool()
def log_task(content: str, agent: str = "Gemini") -> str:
    """将当前操作记录写入今日的 memory/logs/YYYY-MM-DD.md 日志文件。
    任何完成的关键操作都应调用该 Tool 留档，形成可回溯的外脑记忆。

    参数:
        content: 要记录的内容（Markdown 格式，1-5 句话描述发生了什么）
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
    """触发 pnpm run fleet:sync 同步舰队状态，刷新 VitePress 看板数据。
    在任何修改了成员状态后，应调用此 Tool 使前端 Dashboard 实时更新。
    """
    try:
        result = subprocess.run(
            ["pnpm", "run", "fleet:sync"],
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
# 启动服务
# ─────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="stdio")
