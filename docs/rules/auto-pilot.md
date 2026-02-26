# 大脑自动运转系统 (Auto-Pilot)

> **核心理念**: 大脑自己运转，不需要手动触发。

## 🚀 自动化机制

### 1. 定时自动运行
```bash
# 每小时自动执行一次
*/1 * * * * node /path/to/scripts/auto-pilot.js >> /path/to/logs/auto-pilot.log 2>&1
```

### 2. 文件变化监听
```javascript
// 监听文件变化，自动记录
const { exec } = require('child_process');
setInterval(() => {
  exec('node scripts/auto-pilot.js');
}, 60000); // 每分钟
```

### 3. CI/CD 集成
```yaml
# 在 .github/workflows/docs-check.yml
- name: Auto pilot check
  run: node scripts/auto-pilot.js
```

## 🤖 自动运转内容

### 自动执行

1. **知识库自检**
   - 检查所有路径引用
   - 验证 sidebar 链接
   - 检查文件完整性

2. **操作日志记录**
   - 自动记录健康检查结果
   - 自动检测文件变化
   - 自动记录 Agent 使用情况

3. **状态更新**
   - 自动写入 memory/journal/
   - 维护公用记忆
   - 记录系统运行状态

## 📊 日志示例

```
🚀 外部大脑自动运转系统启动
============================================================
🧠 执行知识库自检...
✅ router.md 中所有 6 个路径都有效
✅ sidebar 中所有 37 个链接都有效
🔍 检测文件变化...
✅ 检测到 2 个最近修改的文件:
  • docs/rules/vibe_rules.md
  • docs/router.md
🔄 检测 Agent 使用情况...
📋 目录活动状态:
  • memory/journal: 4 个文件 (活跃)
  • rules: 14 个文件 (活跃)
  • skills: 28 个文件 (活跃)

============================================================

✨ 大脑自动运转完成 (耗时: 4523ms)

📝 检测到 2 个文件变化，已自动记录
```

## 🛠️ 配置

### 调整自动频率

```javascript
// 编辑 scripts/auto-pilot.js
setInterval(() => {
  autoPilot();
}, 300000); // 改为 5 分钟执行一次
```

### 自定义检查项

```javascript
// 在 scripts/auto-pilot.js 中添加
function customCheck() {
  // 你的自定义检查逻辑
  return {
    status: 'pass',
    details: '...'
  };
}
```

## 🎯 优势

1. **零人工干预** - 大脑自动运转
2. **状态持续同步** - 每时每刻都知道大脑状态
3. **自动记忆** - 操作自动记录
4. **无需触发** - 自动发现问题、记录进度

---

**现在，大脑可以自己运转了。**