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

    #ports-panel {
      width: 1.1fr;
    }

    #center-panel {
      width: 1.6fr;
    }

    #right-panel {
      width: 1.3fr;
    }

    DataTable {
      height: 1fr;
    }

    #notifications-table, #tasks-table {
      height: 1fr;
    }

    #detail-body, #log-lines {
      height: 1fr;
      overflow: auto;
    }
    """

    BINDINGS = [
        ("r", "refresh", "刷新"),
        ("n", "focus_notifications", "通知"),
        ("t", "focus_tasks", "任务"),
        ("a", "show_api", "API"),
        ("s", "show_skills", "Skills"),
        ("m", "show_mcp", "MCP"),
        ("q", "quit", "退出"),
    ]

    snapshot: reactive[BrainSnapshot | None] = reactive(None)
    selected_notification_id: reactive[str | None] = reactive(None)
    selected_task_id: reactive[str | None] = reactive(None)
    detail_mode: reactive[str] = reactive("notification")

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Container(id="layout"):
            with Horizontal(id="top"):
                yield MetricCard(id="card-overview")
                yield MetricCard(id="card-inventory")
                yield MetricCard(id="card-runtime")
                yield MetricCard(id="card-api")
            with Horizontal(id="bottom"):
                with Vertical(id="ports-panel", classes="panel"):
                    yield Static("端口占用", classes="panel-title")
                    yield DataTable(id="ports-table")
                with Vertical(id="center-panel", classes="panel"):
                    yield Static("通知收件箱", classes="panel-title")
                    yield DataTable(id="notifications-table")
                    yield Static("任务面板", classes="panel-title")
                    yield DataTable(id="tasks-table")
                with Vertical(id="right-panel", classes="panel"):
                    yield Static("详情", classes="panel-title")
                    yield Static(id="detail-body")
                    yield Static("结构化日志", classes="panel-title")
                    yield Static(id="log-lines")
        yield Footer()

    def on_mount(self) -> None:
        ports = self.query_one("#ports-table", DataTable)
        ports.add_columns("进程", "PID", "端口", "地址", "状态")
        ports.cursor_type = "row"

        notifications = self.query_one("#notifications-table", DataTable)
        notifications.add_columns("状态", "标题", "来源", "时间")
        notifications.cursor_type = "row"

        tasks = self.query_one("#tasks-table", DataTable)
        tasks.add_columns("状态", "任务", "优先级", "来源")
        tasks.cursor_type = "row"

        self.refresh_snapshot()
        self.set_interval(5, self.refresh_snapshot)

    def action_refresh(self) -> None:
        self.refresh_snapshot()

    def action_focus_notifications(self) -> None:
        self.detail_mode = "notification"
        self.query_one("#notifications-table", DataTable).focus()
        self.update_detail()

    def action_focus_tasks(self) -> None:
        self.detail_mode = "task"
        self.query_one("#tasks-table", DataTable).focus()
        self.update_detail()

    def action_show_skills(self) -> None:
        self.detail_mode = "skills"
        self.update_detail()

    def action_show_mcp(self) -> None:
        self.detail_mode = "mcp"
        self.update_detail()

    def action_show_api(self) -> None:
        self.detail_mode = "api"
        self.update_detail()

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
                "按 S 看 Skills · 按 M 看 MCP",
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
        endpoint_lines = [f"{method} {path}" for method, path, _ in snapshot.api_endpoints[:3]]
        endpoint_lines.append(f"按 A 看全部 {len(snapshot.api_endpoints)} 个接口")
        api.set_content("对外 API", endpoint_lines)

        log_widget = self.query_one("#log-lines", Static)
        if snapshot.recent_logs:
            log_widget.update("\n".join(f"• {line}" for line in snapshot.recent_logs))
        else:
            log_widget.update("当前没有最近日志")

        table = self.query_one("#ports-table", DataTable)
        table.clear(columns=False)
        for command, pid, port, host, state in snapshot.ports:
            table.add_row(command, pid, port, host, state)

        notification_table = self.query_one("#notifications-table", DataTable)
        notification_table.clear(columns=False)
        for item in snapshot.notifications:
            row_key = str(item.get("id") or item.get("title") or len(notification_table.rows))
            notification_table.add_row(
                str(item.get("status") or "new"),
                str(item.get("title") or item.get("id") or "未命名通知"),
                str(item.get("source") or item.get("agent") or "unknown"),
                str(item.get("createdAt") or "")[:19].replace("T", " "),
                key=row_key,
            )

        if snapshot.notifications:
            if not self.selected_notification_id or not any(
                str(item.get("id") or item.get("title")) == self.selected_notification_id
                for item in snapshot.notifications
            ):
                self.selected_notification_id = str(
                    snapshot.notifications[0].get("id") or snapshot.notifications[0].get("title")
                )

        tasks_table = self.query_one("#tasks-table", DataTable)
        tasks_table.clear(columns=False)
        for item in snapshot.tasks:
            row_key = str(item.get("id") or item.get("taskId") or item.get("title") or len(tasks_table.rows))
            tasks_table.add_row(
                str(item.get("status") or "待处理"),
                str(item.get("title") or item.get("taskId") or "未命名任务"),
                str(item.get("priority") or "中"),
                str(item.get("source") or item.get("agent") or "brain"),
                key=row_key,
            )

        if snapshot.tasks:
            if not self.selected_task_id or not any(
                str(item.get("id") or item.get("taskId") or item.get("title")) == self.selected_task_id
                for item in snapshot.tasks
            ):
                self.selected_task_id = str(
                    snapshot.tasks[0].get("id") or snapshot.tasks[0].get("taskId") or snapshot.tasks[0].get("title")
                )

        self.update_detail()

    def update_detail(self) -> None:
        detail_widget = self.query_one("#detail-body", Static)
        snapshot = self.snapshot
        if not snapshot:
            detail_widget.update("暂无详情")
            return

        selected_notification = None
        if self.detail_mode == "skills":
            skills = snapshot.skills
            if not skills:
                detail_widget.update("当前没有检测到 skills。")
                return
            detail_widget.update(
                "\n".join(
                    ["[b]Skills 清单[/b]"]
                    + [
                        f"{index + 1}. {item['name']}  [{item['category']}]\n   {item['path']}"
                        for index, item in enumerate(skills[:12])
                    ]
                )
            )
            return

        if self.detail_mode == "mcp":
            servers = snapshot.mcp_servers
            tools = snapshot.mcp_tools
            server_lines = (
                [
                    f"{index + 1}. {item['name']} · {item['command']}"
                    for index, item in enumerate(servers[:8])
                ]
                if servers
                else ["当前没有检测到 MCP Server。"]
            )
            tool_lines = (
                [f"{index + 1}. {name}" for index, name in enumerate(tools[:12])]
                if tools
                else ["当前没有检测到 MCP Tools。"]
            )
            detail_widget.update(
                "\n".join(
                    ["[b]MCP 清单[/b]", "", "Server:"]
                    + server_lines
                    + ["", "Tools:"]
                    + tool_lines
                )
            )
            return

        if self.detail_mode == "api":
            endpoint_lines = []
            for index, (method, path, description) in enumerate(snapshot.api_endpoints, start=1):
                endpoint_lines.append(f"{index}. {method} {path}")
                endpoint_lines.append(f"   {description}")
            detail_widget.update(
                "\n".join(
                    ["[b]对外 API 清单[/b]", "", *endpoint_lines]
                    if endpoint_lines
                    else ["当前没有检测到对外 API。"]
                )
            )
            return

        if self.selected_notification_id:
            selected_notification = next(
                (
                    item
                    for item in snapshot.notifications
                    if str(item.get("id") or item.get("title")) == self.selected_notification_id
                ),
                None,
            )

        if selected_notification:
            detail_widget.update(
                "\n".join(
                    [
                        f"[b]{selected_notification.get('title') or selected_notification.get('id') or '未命名通知'}[/b]",
                        f"状态：{selected_notification.get('status') or 'new'}",
                        f"来源：{selected_notification.get('source') or selected_notification.get('agent') or 'unknown'}",
                        f"时间：{str(selected_notification.get('createdAt') or '')[:19].replace('T', ' ')}",
                        "",
                        str(selected_notification.get("content") or "这条通知没有更多内容。"),
                    ]
                )
            )
            return

        selected_task = None
        if self.selected_task_id:
            selected_task = next(
                (
                    item
                    for item in snapshot.tasks
                    if str(item.get("id") or item.get("taskId") or item.get("title")) == self.selected_task_id
                ),
                None,
            )

        if selected_task:
            detail_widget.update(
                "\n".join(
                    [
                        f"[b]{selected_task.get('title') or selected_task.get('taskId') or '未命名任务'}[/b]",
                        f"状态：{selected_task.get('status') or '待处理'}",
                        f"优先级：{selected_task.get('priority') or '中'}",
                        f"来源：{selected_task.get('source') or selected_task.get('agent') or 'brain'}",
                        "",
                        str(
                            selected_task.get("content")
                            or selected_task.get("summary")
                            or "这条任务当前没有更多描述。"
                        ),
                    ]
                )
            )
            return

        detail_widget.update("当前没有可展示的通知或任务详情。")

    def on_data_table_row_highlighted(self, event: DataTable.RowHighlighted) -> None:
        table_id = event.data_table.id or ""
        row_key = str(event.row_key.value)
        if table_id == "notifications-table":
            self.detail_mode = "notification"
            self.selected_notification_id = row_key
        elif table_id == "tasks-table":
            self.detail_mode = "task"
            self.selected_task_id = row_key
        self.update_detail()


def run() -> None:
    BrainTuiApp().run()
