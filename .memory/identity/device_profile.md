# 设备档案

> **作用**: 记录主力设备与系统环境的稳定事实，供 Agent 判断兼容性、安装方式、性能预期与路径约定。
> **最后校验**: 2026-03-13
> **敏感信息策略**: 不记录序列号、硬件 UUID、UDID 等高敏标识。

## 1. 主力设备

- **设备类型**: MacBook Pro
- **型号标识**: Mac15,7
- **机型编号**: MRW13CH/A
- **芯片**: Apple M3 Pro
- **CPU 核心**: 12 Core（6 performance + 6 efficiency）
- **内存**: 18 GB
- **系统架构**: arm64

## 2. 系统环境

- **操作系统**: macOS 15.7.3
- **系统构建号**: 24G419
- **默认 Shell**: /bin/zsh
- **用户主目录**: ~
- **当前时区**: Asia/Shanghai

## 3. 关键路径

- **CortexOS 根目录**: ~/Documents/CortexOS
- **用户记忆库**: ~/Documents/memory
- **高敏凭证目录**: ~/Documents/memory/secrets
- **CortexOS 私有记忆**: ~/Documents/CortexOS/.memory

## 4. 协作约束

- **芯片优先级**: 默认按 Apple Silicon 环境处理安装、编译与性能判断。
- **脚本假设**: 优先兼容 zsh 与 macOS 原生命令。
- **路径约定**: 若任务涉及长期知识、复盘、素材与个人资料，优先写入 `~/Documents/memory`；若涉及 Agent 运行日志、计划、persona 与状态库，优先写入 `~/Documents/CortexOS/.memory`。

## 5. 待补充

- **显示器/外设**: 暂未记录
- **常驻开发服务**: 暂未记录
- **包管理与运行时偏好**: 暂未记录
