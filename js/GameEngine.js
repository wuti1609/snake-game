/**
 * 游戏引擎核心类，管理游戏生命周期和协调各个子系统
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.gameLoopId = null;
        
        // 游戏配置
        this.config = {
            gridSize: 20,
            baseSpeed: 100, // 基础速度（毫秒）
            tileSize: canvas.width / 20
        };

        // 游戏状态
        this.gameState = {
            status: 'menu', // menu, playing, paused, gameOver
            score: 0,
            level: 1,
            speed: this.config.baseSpeed,
            snake: [{ x: 10, y: 10 }],
            food: { x: 15, y: 15 },
            direction: { dx: 1, dy: 0 },
            nextDirection: { dx: 1, dy: 0 }
        };

        // 绑定事件监听器
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听游戏控制事件
        gameEvents.on('game:start', () => this.start());
        gameEvents.on('game:pause', () => this.pause());
        gameEvents.on('game:resume', () => this.resume());
        gameEvents.on('game:stop', () => this.stop());
        gameEvents.on('game:restart', () => this.restart());
        
        // 监听方向改变事件
        gameEvents.on('input:direction', (direction) => this.handleDirectionChange(direction));
        
        // 监听游戏状态变化
        gameEvents.on('game:scoreUpdate', (score) => this.updateScore(score));
    }

    /**
     * 初始化游戏
     */
    init() {
        this.resetGameState();
        this.generateFood();
        gameEvents.emit('game:initialized', this.gameState);
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.gameState.status = 'playing';
        this.lastTime = performance.now();
        
        // 使用 requestAnimationFrame 替代 setInterval
        this.gameLoop();
        
        gameEvents.emit('game:started', this.gameState);
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.gameState.status = 'paused';
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        gameEvents.emit('game:paused', this.gameState);
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.gameState.status = 'playing';
        this.lastTime = performance.now();
        
        this.gameLoop();
        
        gameEvents.emit('game:resumed', this.gameState);
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.gameState.status = 'gameOver';
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        gameEvents.emit('game:stopped', this.gameState);
    }

    /**
     * 重启游戏
     */
    restart() {
        this.stop();
        this.init();
        this.start();
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        // 基于时间的更新，而不是固定帧率
        if (deltaTime >= this.gameState.speed) {
            this.update(deltaTime);
            this.lastTime = currentTime;
        }
        
        // 每帧都渲染，确保画面流畅
        this.render();
        
        // 继续游戏循环
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        // 更新蛇的方向
        this.gameState.direction = { ...this.gameState.nextDirection };
        
        // 移动蛇
        this.moveSnake();
        
        // 检查碰撞
        if (this.checkCollisions()) {
            this.stop();
            return;
        }
        
        // 发送更新事件
        gameEvents.emit('game:updated', { gameState: this.gameState, deltaTime });
    }

    /**
     * 渲染游戏
     */
    render() {
        // 直接调用渲染，而不是通过事件系统
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制蛇
        this.gameState.snake.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.fillStyle = '#008000'; // 蛇头
            } else {
                this.ctx.fillStyle = '#00ff00'; // 蛇身
            }
            
            this.ctx.fillRect(
                segment.x * this.config.tileSize,
                segment.y * this.config.tileSize,
                this.config.tileSize - 1,
                this.config.tileSize - 1
            );
        });
        
        // 绘制食物
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.gameState.food.x * this.config.tileSize,
            this.gameState.food.y * this.config.tileSize,
            this.config.tileSize - 1,
            this.config.tileSize - 1
        );
        
        // 发送渲染事件（用于其他系统）
        gameEvents.emit('game:render', { ctx: this.ctx, gameState: this.gameState });
    }

    /**
     * 移动蛇
     */
    moveSnake() {
        const { dx, dy } = this.gameState.direction;
        const head = { 
            x: this.gameState.snake[0].x + dx, 
            y: this.gameState.snake[0].y + dy 
        };
        
        this.gameState.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.gameState.food.x && head.y === this.gameState.food.y) {
            this.eatFood();
        } else {
            this.gameState.snake.pop();
        }
    }

    /**
     * 处理吃到食物
     */
    eatFood() {
        this.gameState.score += 10;
        this.generateFood();
        
        // 检查是否需要提升难度
        if (this.gameState.score % 100 === 0) {
            this.increaseDifficulty();
            gameEvents.emit('game:milestone', this.gameState.score);
        }
        
        gameEvents.emit('game:foodEaten', { 
            score: this.gameState.score, 
            foodPosition: this.gameState.food 
        });
    }

    /**
     * 提升游戏难度
     */
    increaseDifficulty() {
        this.gameState.level++;
        this.gameState.speed = Math.max(50, this.gameState.speed - 5);
        
        gameEvents.emit('game:levelUp', {
            level: this.gameState.level,
            speed: this.gameState.speed
        });
    }

    /**
     * 生成食物
     */
    generateFood() {
        do {
            this.gameState.food = {
                x: Math.floor(Math.random() * this.config.gridSize),
                y: Math.floor(Math.random() * this.config.gridSize)
            };
        } while (this.isOnSnake(this.gameState.food));
        
        gameEvents.emit('game:foodGenerated', this.gameState.food);
    }

    /**
     * 检查位置是否在蛇身上
     */
    isOnSnake(position) {
        return this.gameState.snake.some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }

    /**
     * 检查碰撞
     */
    checkCollisions() {
        const head = this.gameState.snake[0];
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.config.gridSize || 
            head.y < 0 || head.y >= this.config.gridSize) {
            gameEvents.emit('game:collision', { type: 'wall', position: head });
            return true;
        }
        
        // 检查自身碰撞
        for (let i = 1; i < this.gameState.snake.length; i++) {
            if (head.x === this.gameState.snake[i].x && 
                head.y === this.gameState.snake[i].y) {
                gameEvents.emit('game:collision', { type: 'self', position: head });
                return true;
            }
        }
        
        return false;
    }

    /**
     * 处理方向改变
     */
    handleDirectionChange(newDirection) {
        const { dx: currentDx, dy: currentDy } = this.gameState.direction;
        const { dx: newDx, dy: newDy } = newDirection;
        
        // 防止反向移动
        if ((currentDx === 1 && newDx === -1) || 
            (currentDx === -1 && newDx === 1) ||
            (currentDy === 1 && newDy === -1) || 
            (currentDy === -1 && newDy === 1)) {
            return;
        }
        
        this.gameState.nextDirection = newDirection;
    }

    /**
     * 重置游戏状态
     */
    resetGameState() {
        this.gameState = {
            status: 'menu',
            score: 0,
            level: 1,
            speed: this.config.baseSpeed,
            snake: [{ x: 10, y: 10 }],
            food: { x: 15, y: 15 },
            direction: { dx: 1, dy: 0 },
            nextDirection: { dx: 1, dy: 0 }
        };
    }

    /**
     * 获取游戏状态
     */
    getGameState() {
        return { ...this.gameState };
    }

    /**
     * 获取游戏配置
     */
    getConfig() {
        return { ...this.config };
    }
}