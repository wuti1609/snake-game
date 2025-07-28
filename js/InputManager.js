/**
 * 输入管理器 - 统一处理键盘和触摸输入
 * 负责输入验证、手势识别和方向控制
 */
class InputManager {
    constructor() {
        this.currentDirection = { dx: 1, dy: 0 };
        this.isInputEnabled = true;
        this.inputBuffer = [];
        this.lastInputTime = 0;
        this.inputCooldown = 50; // 50ms输入冷却时间，防止过快输入
        
        // 触摸相关属性
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.minSwipeDistance = 30; // 最小滑动距离
        this.isTouch = false;
        
        // 输入统计（用于调试和优化）
        this.inputStats = {
            totalInputs: 0,
            validInputs: 0,
            invalidInputs: 0,
            touchInputs: 0,
            keyboardInputs: 0
        };
        
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 绑定方法以便后续移除监听器
        this.boundHandleKeyboardInput = (event) => this.handleKeyboardInput(event);
        this.boundHandleTouchStart = (event) => this.handleTouchStart(event);
        this.boundHandleTouchEnd = (event) => this.handleTouchEnd(event);
        this.boundHandleTouchMove = (event) => this.handleTouchMove(event);
        this.boundEnableInput = () => this.enableInput();
        this.boundDisableInput = () => this.disableInput();
        this.boundUpdateDirection = (direction) => { this.currentDirection = direction; };
        
        // 键盘事件
        document.addEventListener('keydown', this.boundHandleKeyboardInput);
        
        // 触摸事件
        document.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
        document.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });
        document.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
        
        // 虚拟控制器事件
        this.setupVirtualControls();
        
        // 监听游戏状态变化
        gameEvents.on('game:started', this.boundEnableInput);
        gameEvents.on('game:stopped', this.boundDisableInput);
        gameEvents.on('game:paused', this.boundDisableInput);
        gameEvents.on('game:resumed', this.boundEnableInput);
        
        // 监听方向变化以更新当前方向
        gameEvents.on('input:direction', this.boundUpdateDirection);
    }

    /**
     * 处理键盘输入
     */
    handleKeyboardInput(event) {
        if (!this.isInputEnabled) return;
        
        const now = performance.now();
        if (now - this.lastInputTime < this.inputCooldown) return;
        
        const keyCode = event.keyCode;
        let direction = null;
        let isGameControl = false;

        switch (keyCode) {
            case 37: // Left Arrow
            case 65: // A key
                direction = { dx: -1, dy: 0 };
                break;
            case 38: // Up Arrow  
            case 87: // W key
                direction = { dx: 0, dy: -1 };
                break;
            case 39: // Right Arrow
            case 68: // D key
                direction = { dx: 1, dy: 0 };
                break;
            case 40: // Down Arrow
            case 83: // S key
                direction = { dx: 0, dy: 1 };
                break;
            case 32: // Space (暂停/继续)
                event.preventDefault();
                this.handlePauseToggle();
                isGameControl = true;
                break;
            case 82: // R key (重启)
                if (event.ctrlKey || event.metaKey) return; // 避免与浏览器刷新冲突
                event.preventDefault();
                gameEvents.emit('game:restart');
                isGameControl = true;
                break;
        }

        if (direction) {
            event.preventDefault();
            this.inputStats.totalInputs++;
            this.inputStats.keyboardInputs++;
            
            if (this.validateDirectionChange(direction)) {
                this.inputStats.validInputs++;
                this.lastInputTime = now;
                gameEvents.emit('input:direction', direction);
            } else {
                this.inputStats.invalidInputs++;
            }
        }
        
        if (isGameControl) {
            this.inputStats.totalInputs++;
            this.inputStats.keyboardInputs++;
            this.lastInputTime = now;
        }
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(event) {
        if (!this.isInputEnabled) return;
        
        event.preventDefault();
        this.isTouch = true;
        
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    /**
     * 处理触摸移动（防止页面滚动）
     */
    handleTouchMove(event) {
        if (this.isTouch) {
            event.preventDefault();
        }
    }

    /**
     * 处理触摸结束
     */
    handleTouchEnd(event) {
        if (!this.isInputEnabled || !this.isTouch) return;
        
        event.preventDefault();
        this.isTouch = false;
        
        const touch = event.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        const direction = this.calculateSwipeDirection(
            this.touchStartX, 
            this.touchStartY, 
            touchEndX, 
            touchEndY
        );
        
        this.inputStats.totalInputs++;
        this.inputStats.touchInputs++;
        
        if (direction && this.validateDirectionChange(direction)) {
            const now = performance.now();
            if (now - this.lastInputTime >= this.inputCooldown) {
                this.inputStats.validInputs++;
                this.lastInputTime = now;
                gameEvents.emit('input:direction', direction);
            } else {
                this.inputStats.invalidInputs++;
            }
        } else {
            this.inputStats.invalidInputs++;
        }
    }

    /**
     * 计算滑动方向
     */
    calculateSwipeDirection(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // 检查是否达到最小滑动距离
        if (Math.max(absDeltaX, absDeltaY) < this.minSwipeDistance) {
            return null;
        }
        
        // 确定主要滑动方向
        if (absDeltaX > absDeltaY) {
            // 水平滑动
            return deltaX > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
        } else {
            // 垂直滑动
            return deltaY > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };
        }
    }

    /**
     * 验证方向改变是否有效（防止反向移动）
     */
    validateDirectionChange(newDirection) {
        const { dx: currentDx, dy: currentDy } = this.currentDirection;
        const { dx: newDx, dy: newDy } = newDirection;
        
        // 防止反向移动
        if ((currentDx === 1 && newDx === -1) || 
            (currentDx === -1 && newDx === 1) ||
            (currentDy === 1 && newDy === -1) || 
            (currentDy === -1 && newDy === 1)) {
            return false;
        }
        
        // 防止相同方向的重复输入
        if (currentDx === newDx && currentDy === newDy) {
            return false;
        }
        
        return true;
    }

    /**
     * 设置虚拟控制器
     */
    setupVirtualControls() {
        // 绑定虚拟控制器按钮事件
        this.boundHandleVirtualControl = (event) => this.handleVirtualControlClick(event);
        
        // 等待DOM加载完成后设置虚拟控制器
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initVirtualControls());
        } else {
            this.initVirtualControls();
        }
    }

    /**
     * 初始化虚拟控制器
     */
    initVirtualControls() {
        const virtualControls = document.getElementById('virtualControls');
        if (!virtualControls) return;

        // 检测设备并设置虚拟控制器显示状态
        this.detectAndSetupVirtualControls();

        // 为所有控制按钮添加事件监听器
        const controlButtons = virtualControls.querySelectorAll('.control-btn');
        controlButtons.forEach(button => {
            // 使用 touchstart 而不是 click 以获得更好的响应性
            button.addEventListener('touchstart', this.boundHandleVirtualControl, { passive: false });
            button.addEventListener('click', this.boundHandleVirtualControl);
            
            // 防止按钮的默认行为
            button.addEventListener('touchend', (e) => e.preventDefault());
            button.addEventListener('touchmove', (e) => e.preventDefault());
        });

        // 监听窗口大小变化，动态调整虚拟控制器显示
        window.addEventListener('resize', () => this.detectAndSetupVirtualControls());
    }

    /**
     * 处理虚拟控制器点击
     */
    handleVirtualControlClick(event) {
        if (!this.isInputEnabled) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.target;
        const direction = button.getAttribute('data-direction');
        const now = performance.now();
        
        // 检查输入冷却时间
        if (now - this.lastInputTime < this.inputCooldown) return;
        
        if (direction) {
            // 处理方向按钮
            let directionVector = null;
            
            switch (direction) {
                case 'up':
                    directionVector = { dx: 0, dy: -1 };
                    break;
                case 'down':
                    directionVector = { dx: 0, dy: 1 };
                    break;
                case 'left':
                    directionVector = { dx: -1, dy: 0 };
                    break;
                case 'right':
                    directionVector = { dx: 1, dy: 0 };
                    break;
            }
            
            if (directionVector) {
                this.inputStats.totalInputs++;
                this.inputStats.touchInputs++;
                
                if (this.validateDirectionChange(directionVector)) {
                    this.inputStats.validInputs++;
                    this.lastInputTime = now;
                    gameEvents.emit('input:direction', directionVector);
                    
                    // 添加视觉反馈
                    this.addButtonFeedback(button);
                } else {
                    this.inputStats.invalidInputs++;
                }
            }
        } else if (button.id === 'pauseBtn') {
            // 处理暂停按钮
            this.inputStats.totalInputs++;
            this.inputStats.touchInputs++;
            this.lastInputTime = now;
            this.handlePauseToggle();
            
            // 添加视觉反馈
            this.addButtonFeedback(button);
        }
    }

    /**
     * 添加按钮视觉反馈
     */
    addButtonFeedback(button) {
        // 视觉反馈
        button.style.transform = 'scale(0.9)';
        button.style.backgroundColor = '#e0e0e0';
        
        // 触觉反馈（如果支持）
        if (navigator.vibrate) {
            navigator.vibrate(50); // 50ms 轻微震动
        }
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.backgroundColor = '';
        }, 100);
    }

    /**
     * 检测是否为触摸设备并显示/隐藏虚拟控制器
     */
    detectAndSetupVirtualControls() {
        const virtualControls = document.getElementById('virtualControls');
        if (!virtualControls) return;

        // 检测触摸设备
        const isTouchDevice = (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );

        // 检测移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // 检测屏幕尺寸
        const isSmallScreen = window.innerWidth <= 768;

        // 如果是触摸设备、移动设备或小屏幕，显示虚拟控制器
        if (isTouchDevice || isMobile || isSmallScreen) {
            virtualControls.style.display = 'flex';
        } else {
            virtualControls.style.display = 'none';
        }
    }

    /**
     * 处理暂停切换
     */
    handlePauseToggle() {
        gameEvents.emit('input:pauseToggle');
    }

    /**
     * 启用输入
     */
    enableInput() {
        this.isInputEnabled = true;
    }

    /**
     * 禁用输入
     */
    disableInput() {
        this.isInputEnabled = false;
    }

    /**
     * 设置当前方向（用于同步）
     */
    setCurrentDirection(direction) {
        this.currentDirection = direction;
    }

    /**
     * 获取当前方向
     */
    getCurrentDirection() {
        return { ...this.currentDirection };
    }

    /**
     * 设置输入冷却时间
     */
    setInputCooldown(cooldown) {
        this.inputCooldown = Math.max(0, cooldown);
    }

    /**
     * 设置最小滑动距离
     */
    setMinSwipeDistance(distance) {
        this.minSwipeDistance = Math.max(10, distance);
    }

    /**
     * 获取输入统计信息
     */
    getInputStats() {
        return { ...this.inputStats };
    }

    /**
     * 重置输入统计
     */
    resetInputStats() {
        this.inputStats = {
            totalInputs: 0,
            validInputs: 0,
            invalidInputs: 0,
            touchInputs: 0,
            keyboardInputs: 0
        };
    }

    /**
     * 检查输入是否启用
     */
    isEnabled() {
        return this.isInputEnabled;
    }

    /**
     * 清理资源
     */
    destroy() {
        document.removeEventListener('keydown', this.boundHandleKeyboardInput);
        document.removeEventListener('touchstart', this.boundHandleTouchStart);
        document.removeEventListener('touchend', this.boundHandleTouchEnd);
        document.removeEventListener('touchmove', this.boundHandleTouchMove);
        
        // 清理虚拟控制器事件监听器
        const virtualControls = document.getElementById('virtualControls');
        if (virtualControls && this.boundHandleVirtualControl) {
            const controlButtons = virtualControls.querySelectorAll('.control-btn');
            controlButtons.forEach(button => {
                button.removeEventListener('touchstart', this.boundHandleVirtualControl);
                button.removeEventListener('click', this.boundHandleVirtualControl);
            });
        }
        
        gameEvents.off('game:started', this.boundEnableInput);
        gameEvents.off('game:stopped', this.boundDisableInput);
        gameEvents.off('game:paused', this.boundDisableInput);
        gameEvents.off('game:resumed', this.boundEnableInput);
        gameEvents.off('input:direction', this.boundUpdateDirection);
    }
}