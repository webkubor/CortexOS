#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys
from typing import Any, Dict, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIGS_DIR = os.path.join(BASE_DIR, "configs")


def _load_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"批量配置必须是 JSON 对象: {path}")
    return data


def _resolve_batch_path(batch_arg: str) -> str:
    if os.path.isabs(batch_arg):
        return batch_arg
    if batch_arg.startswith("configs/"):
        return os.path.join(BASE_DIR, batch_arg)
    return os.path.join(CONFIGS_DIR, batch_arg)


def _resolve_main_arg(config_value: str) -> str:
    """将配置路径转换为 main.py 可接受参数（相对 configs 的路径）。"""
    if os.path.isabs(config_value):
        abs_path = config_value
    elif config_value.startswith("configs/"):
        abs_path = os.path.join(BASE_DIR, config_value)
    else:
        abs_path = os.path.join(CONFIGS_DIR, config_value)

    abs_path = os.path.abspath(abs_path)
    if not abs_path.startswith(os.path.abspath(CONFIGS_DIR) + os.sep):
        raise ValueError(f"配置越界，仅允许 configs 目录内文件: {config_value}")

    rel = os.path.relpath(abs_path, CONFIGS_DIR)
    return rel.replace("\\", "/")


def run_batch(batch_path: str, dry_run: bool = False) -> int:
    data = _load_json(batch_path)
    if data.get("type") != "design_batch":
        raise ValueError("批量配置 type 必须为 design_batch")

    items: List[Dict[str, Any]] = data.get("items", [])
    if not isinstance(items, list) or not items:
        raise ValueError("批量配置 items 不能为空")

    print(f"📚 批量配置: {os.path.relpath(batch_path, BASE_DIR)}")
    success = 0
    failed = 0

    for i, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            print(f"⚠️ 跳过第 {i} 项：格式非法")
            continue
        if item.get("enabled") is False:
            print(f"⏭️ 跳过第 {i} 项（disabled）")
            continue

        name = str(item.get("name") or f"任务{i}")
        cfg_arg = _resolve_main_arg(str(item.get("config") or ""))
        cmd = [sys.executable, os.path.join(BASE_DIR, "main.py"), cfg_arg]

        print(f"\n[{i}] 🎙️ {name}")
        print("    命令:", " ".join(cmd))

        if dry_run:
            continue

        ret = subprocess.run(cmd, cwd=BASE_DIR)
        if ret.returncode == 0:
            success += 1
        else:
            failed += 1
            print(f"❌ 失败: {name} (code={ret.returncode})")

    print("\n==== 批量结果 ====")
    print(f"✅ 成功: {success}")
    print(f"❌ 失败: {failed}")
    return 0 if failed == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="批量执行 VoiceDesign 配置")
    parser.add_argument(
        "batch",
        nargs="?",
        default="presets/AI女友_批量设计.json",
        help="批量 JSON 路径（相对 configs/ 或绝对路径）",
    )
    parser.add_argument("--dry-run", action="store_true", help="只打印将执行的命令")
    args = parser.parse_args()

    batch_path = _resolve_batch_path(args.batch)
    if not os.path.exists(batch_path):
        print(f"❌ 批量配置不存在: {batch_path}")
        return 1

    try:
        return run_batch(batch_path, dry_run=args.dry_run)
    except Exception as e:
        print(f"❌ 批量执行失败: {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
