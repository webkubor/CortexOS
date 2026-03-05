# 根目录遗留文档归档说明

## 背景
2026-03-05 对项目根目录单文件文档做体检，发现部分文档长期不被代码或文档引用，且内容与 `docs/` 体系有重复，继续放在根目录会增加认知噪音。

## 归档策略
- 保留根目录作为“项目入口面”，只留 `README.md`、`CHANGELOG.md`、`AGENTS.md`、`CLAUDE.md`、`TODO.md` 等高频入口文档。
- 将无引用、历史阶段性草稿移入 `docs/archive/root-legacy/`。

## 已归档文件（2026-03-05）
- `CortexOS_Control_Center.md`
- `temp_gemini_brain_v2.md`

## 处理原则
- 仅迁移，不删内容。
- 若后续确认仍有使用价值，可从本目录回迁到 `docs/` 的正式位置并补引用。
