from __future__ import annotations

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.reactive import reactive
from textual.widgets import DataTable, Footer, Header, Static

from .data import BrainSnapshot, build_snapshot


class MetricCard(Static):
    def set_content(self, title: str, lines: list[str]) -> None:
        body = "\n".join(f"• {line}" for line in lines)
        self.update(f"[b]{title}[/b]\n{body}")


class BrainTuiApp(App):
    CSS = """
    Screen {
      background: #08111d;
      color: #d8e7ff;
    }

    #layout {
      height: 1fr;
      padding: 1 2;
    }

    #top {
      height: 16;
      margin-bottom: 1;
    }

    #bottom {
      height: 1fr;
    }

    .panel {
      border: round #20476f;
      background: #0d1726;
      padding: 1;
      margin-right: 1;
    }

    .panel-title {
      color: #7ec8ff;
      text-style: bold;
    }

    MetricCard {
      width: 1fr;
      min-width: 24;
      border: round #234f7d;
      background: #101b2d;
      color: #eef5ff;
      padding: 1 2;
      margin-right: 1;
    }

    #log-panel {
      width: 2fr;
    }

    #latest-panel {
      width: 1fr;
    }

    DataTable {
      height: 1fr;
    }
    """

    BINDINGS = [
        ("r", "refresh", "刷新"),
        ("q", "quit", "退出"),
    ]

    snapshot: reactive[BrainSnapshot | None] = reactive(None)

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Container(id="layout"):
            with Horizontal(id="top"):
                yield MetricCard(id="card-overview")
                yield MetricCard(id="card-inventory")
                yield MetricCard(id="card-runtime")
                yield MetricCard(id="card-api")
            with Horizontal(id="bottom"):
                with Vertical(classes="panel"):
                    yield Static("端口占用", classes="panel-title")
                    yield DataTable(id="ports-table")
                with Vertical(id="latest-panel", classes="panel"):
                    yield Static("最近通知", classes="panel-title")
                    yield Static(id="latest-notifications")
                with Vertical(id="log-panel", classes="panel"):
                    yield Static("结构化日志", classes="panel-title")
                    yield Static(id="log-lines")
        yield Footer()

    def on_mount(self) -> None:
        table = self.query_one("#ports-table", DataTable)
        table.add_columns("进程", "PID", "监听端口")
        self.refresh_snapshot()
        self.set_interval(5, self.refresh_snapshot)

    def action_refresh(self) -> None:
        self.refresh_snapshot()

    def refresh_snapshot(self) -> None:
        self.snapshot = build_snapshot()
        self.render_snapshot()

    def render_snapshot(self) -> None:
        snapshot = self.snapshot
        if not snapshot:
            return

        overview = self.query_one("#card-overview", MetricCard)
        inventory = self.query_one("#card-inventory", MetricCard)
        runtime = self.query_one("#card-runtime", MetricCard)
        api = self.query_one("#card-api", MetricCard)

        overview.set_content(
            "Webkubor 主脑",
            [
                f"Cloud Brain：{'在线' if snapshot.cloud_online else '离线'} · v{snapshot.cloud_version}",
                f"通知：总计 {snapshot.notifications_total} · 待处理 {snapshot.notifications_pending}",
                f"任务：总计 {snapshot.tasks_total} · 待处理 {snapshot.tasks_open}",
            ],
        )
        inventory.set_content(
            "本地资产",
            [
                f"MCP：{snapshot.mcp_server_count} 个服务器 · {snapshot.mcp_tool_count} 个工具",
                f"Skills：{snapshot.skills_count} 个",
                f"Agents：{snapshot.agent_count} 个文档档案",
            ],
        )
        runtime.set_content(
            "运行态",
            [
                f"brain-cortex-pilot：{snapshot.pilot_status} · 重启 {snapshot.pilot_restarts} 次",
                "前台形态：终端 TUI（brain-tui）",
                "外部入口：CLI + HTTP API",
            ],
        )
        endpoint_lines = [f"{method} {path}" for method, path in snapshot.api_endpoints[:3]]
        endpoint_lines.append(f"... 共 {len(snapshot.api_endpoints)} 个接口")
        api.set_content("对外 API", endpoint_lines)

        latest_widget = self.query_one("#latest-notifications", Static)
        if snapshot.latest_notification_titles:
            latest_widget.update("\n".join(f"• {line}" for line in snapshot.latest_notification_titles))
        else:
            latest_widget.update("当前没有最近通知")

        log_widget = self.query_one("#log-lines", Static)
        if snapshot.recent_logs:
            log_widget.update("\n".join(f"• {line}" for line in snapshot.recent_logs))
        else:
            log_widget.update("当前没有最近日志")

        table = self.query_one("#ports-table", DataTable)
        table.clear()
        for command, pid, listen in snapshot.ports:
            table.add_row(command, pid, listen)


def run() -> None:
    BrainTuiApp().run()
