# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

这是一个基于原生JavaScript开发的贪吃蛇游戏，采用模块化架构设计，支持桌面端键盘操作和移动端触摸控制。

## 运行方式

这是一个纯前端HTML/CSS/JavaScript项目，无需构建步骤：
- 直接在浏览器中打开 `index.html` 即可运行游戏
- 或使用本地HTTP服务器提供文件服务
- `test.html` 是简化版本，用于测试核心功能

## 架构设计

### 核心模块结构
项目采用事件驱动的模块化架构，各模块职责分离：

1. **EventSystem** (`js/EventSystem.js`) - 全局事件系统
   - 提供组件间解耦通信
   - 全局实例 `window.gameEvents`

2. **GameEngine** (`js/GameEngine.js`) - 游戏核心引擎
   - 管理游戏生命周期和状态
   - 处理蛇的移动、碰撞检测、食物生成
   - 使用 requestAnimationFrame 实现平滑游戏循环

3. **InputManager** (`js/InputManager.js`) - 输入管理系统
   - 统一处理键盘（WASD/方向键）和触摸输入
   - 支持虚拟控制器（移动设备）
   - 防反向移动和输入节流控制

4. **Renderer** (`js/Renderer.js`) - 渲染系统
   - 负责Canvas绘制操作
   - 响应游戏状态变化进行渲染

5. **SnakeGame** (`game.js`) - 主游戏类
   - 协调各个子系统
   - 处理UI交互（分数显示、游戏结束界面、烟花效果）

### 关键事件流
- `input:direction` - 方向输入事件
- `input:pauseToggle` - 暂停切换事件
- `game:started/paused/resumed/stopped` - 游戏状态事件
- `game:foodEaten` - 食物被吃事件
- `game:milestone` - 里程碑达成事件（触发烟花）
- `game:collision` - 碰撞事件

### 游戏配置
- 网格大小：20x20
- 基础速度：100ms
- 画布尺寸：400x400像素
- 每100分提升一个难度等级

## 开发注意事项

### 响应式设计
- 自动检测触摸设备显示虚拟控制器
- 支持移动端触摸手势控制
- 小屏幕设备优化

### 性能优化
- 使用 requestAnimationFrame 替代 setInterval
- 输入节流防止过快操作
- 事件委托处理UI交互

### 调试功能
- 输入统计信息记录（`InputManager.getInputStats()`）
- Renderer 包含网格绘制功能（调试用）
- 控制台调试信息输出

## 扩展建议

添加新功能时需要考虑：
- 通过事件系统进行模块间通信
- 在 GameEngine 中添加游戏状态管理
- 在 InputManager 中处理新的输入类型
- 在 Renderer 中添加新的视觉效果
- 保持模块间的低耦合性