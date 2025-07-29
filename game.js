// 游戏主入口文件
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scoreElement = document.getElementById('score');
        
        // 初始化游戏引擎
        this.gameEngine = new GameEngine(this.canvas);
        
        // 初始化渲染器
        this.renderer = new Renderer(this.canvas, this.gameEngine.getConfig());
        
        // 初始化输入管理器
        this.inputManager = new InputManager();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 初始化游戏
        this.init();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听分数更新
        gameEvents.on('game:foodEaten', (data) => {
            this.updateScoreDisplay(data.score);
        });
        
        // 监听游戏结束
        gameEvents.on('game:stopped', () => {
            this.showGameOver();
        });
        
        // 监听里程碑达成
        gameEvents.on('game:milestone', (score) => {
            this.showFireworks();
        });
        
        // 监听暂停切换事件
        gameEvents.on('input:pauseToggle', () => {
            this.togglePause();
        });
        
        // 使用事件委托来处理重启按钮点击
        document.addEventListener('click', (event) => {
            if (event.target && event.target.id === 'restartButton') {
                event.preventDefault();
                this.restart();
            }
        });
    }

    /**
     * 初始化游戏
     */
    init() {
        this.gameEngine.init();
        this.updateScoreDisplay(0);
    }

    /**
     * 开始游戏
     */
    start() {
        this.gameEngine.start();
    }

    /**
     * 重启游戏
     */
    restart() {
        console.log('重启游戏被调用'); // 调试信息
        
        // 隐藏游戏结束界面
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            // 清除之前可能设置的内联样式，让CSS类生效
            gameOverScreen.style.display = '';
            gameOverScreen.style.visibility = '';
            console.log('游戏结束界面已隐藏'); // 调试信息
        }
        
        // 重启游戏引擎（restart方法内部已经包含了start）
        this.gameEngine.restart();
        
        // 重置分数显示
        this.updateScoreDisplay(0);
        
        console.log('游戏重启完成'); // 调试信息
    }



    /**
     * 切换暂停状态
     */
    togglePause() {
        const gameState = this.gameEngine.getGameState();
        if (gameState.status === 'playing') {
            this.gameEngine.pause();
        } else if (gameState.status === 'paused') {
            this.gameEngine.resume();
        }
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay(score) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score;
        }
    }

    /**
     * 显示游戏结束界面
     */
    showGameOver() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        const encouragementText = document.getElementById('encouragementText');
        const gameState = this.gameEngine.getGameState();

        if (encouragementText) {
            if (gameState.score === 0) {
                encouragementText.innerHTML = '😢';
            } else {
                encouragementText.innerHTML = '👍';
            }
        }

        if (gameOverScreen) {
            // 确保游戏结束界面能够显示 - 重置所有可能的隐藏样式
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.style.display = '';
            gameOverScreen.style.visibility = '';
        }
    }

    /**
     * 显示烟花效果
     */
    showFireworks() {
        const fireworksContainer = document.querySelector('.fireworks-container');
        if (!fireworksContainer) return;

        for (let i = 0; i < 30; i++) {
            const firework = document.createElement('div');
            firework.classList.add('firework');
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            firework.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            fireworksContainer.appendChild(firework);

            firework.addEventListener('animationend', () => {
                firework.remove();
            });
        }
    }
}

// 等待DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.snakeGame = new SnakeGame();
    window.snakeGame.start();
});

