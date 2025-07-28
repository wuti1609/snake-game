/**
 * 渲染器类，负责所有的Canvas绘制操作
 */
class Renderer {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        
        // 设置事件监听器
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        gameEvents.on('game:render', (data) => this.render(data));
    }

    /**
     * 主渲染方法
     */
    render({ ctx, gameState }) {
        this.clear();
        this.drawSnake(gameState.snake);
        this.drawFood(gameState.food);
    }

    /**
     * 清空画布
     */
    clear() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制蛇
     */
    drawSnake(snake) {
        snake.forEach((segment, index) => {
            // 蛇头使用不同颜色
            if (index === 0) {
                this.ctx.fillStyle = '#008000';
            } else {
                this.ctx.fillStyle = '#00ff00';
            }
            
            this.ctx.fillRect(
                segment.x * this.config.tileSize,
                segment.y * this.config.tileSize,
                this.config.tileSize - 1,
                this.config.tileSize - 1
            );
        });
    }

    /**
     * 绘制食物
     */
    drawFood(food) {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            food.x * this.config.tileSize,
            food.y * this.config.tileSize,
            this.config.tileSize - 1,
            this.config.tileSize - 1
        );
    }

    /**
     * 绘制网格（调试用）
     */
    drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += this.config.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += this.config.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
}