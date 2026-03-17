import json
import os
import sys

CONFIG_PATH = "config/brains.json"

def switch_brain(brain_id):
    if not os.path.exists(CONFIG_PATH):
        print(f"Error: Config not found at {CONFIG_PATH}")
        return False

    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)

    if brain_id not in config["brains"]:
        print(f"Error: Brain '{brain_id}' not found in configuration.")
        available = ", ".join(config["brains"].keys())
        print(f"Available brains: {available}")
        return False

    # 更新激活大脑
    config["active_brain"] = brain_id
    
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    brain_info = config["brains"][brain_id]
    print(f"✅ Brain switched to: {brain_info['name']}")
    print(f"ℹ️ Description: {brain_info['description']}")
    print(f"📍 Rules Path: {brain_info['rules_path']}")
    print(f"🔍 Knowledge Scopes: {', '.join(brain_info['knowledge_scope'])}")
    
    # 此处可扩展逻辑：更新环境变量或刷新 MCP 配置
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 switch_brain.py <brain_id>")
        sys.exit(1)
        
    target_id = sys.argv[1]
    if switch_brain(target_id):
        # 触发大脑切换后的同步逻辑
        pass
