import os
import re
import sys

def harvest_logs(log_path):
    if not os.path.exists(log_path):
        print(f"Log not found: {log_path}")
        return []

    with open(log_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 改进正则：匹配 ## [时间] by Agent 这一行作为起始
    # 然后提取直到下一个 ## [时间] 之前的内容
    pattern = r'## \[\d{2}:\d{2}:\d{2}\] by (.*?)\n(.*?)(?=\n## \[\d{2}:\d{2}:\d{2}\] by |$)'
    matches = re.findall(pattern, content, re.DOTALL)
    
    extracted = []
    # 关键词：修复, 故障, 解决, Error, Fail, 排查
    keywords = ["修复", "故障", "解决", "Error", "Fail", "排查", "修正", "fix", "error"]
    
    for agent, body in matches:
        body_clean = body.strip()
        if any(kw.lower() in body_clean.lower() for kw in keywords):
            extracted.append({
                "agent": agent.strip(),
                "body": body_clean,
                "summary": body_clean.split('\n')[0][:100] # 取第一行前100字
            })
            
    return extracted

if __name__ == "__main__":
    target_log = sys.argv[1] if len(sys.argv) > 1 else ""
    if not target_log:
        print("Usage: python3 harvest_retry_patterns.py <log_file>")
        sys.exit(1)
        
    results = harvest_logs(target_log)
    for res in results:
        import json; print(json.dumps(results, ensure_ascii=False))
