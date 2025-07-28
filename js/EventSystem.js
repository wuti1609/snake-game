/**
 * 简单的事件系统，用于组件间通信
 */
class EventSystem {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 注册事件监听器
     * @param {string} eventType 事件类型
     * @param {Function} callback 回调函数
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} eventType 事件类型
     * @param {Function} callback 回调函数
     */
    off(eventType, callback) {
        if (!this.listeners.has(eventType)) return;
        
        const callbacks = this.listeners.get(eventType);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} eventType 事件类型
     * @param {*} data 事件数据
     */
    emit(eventType, data = null) {
        if (!this.listeners.has(eventType)) return;
        
        const callbacks = this.listeners.get(eventType);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventType}:`, error);
            }
        });
    }

    /**
     * 清除所有监听器
     */
    clear() {
        this.listeners.clear();
    }
}

// 创建全局事件系统实例
window.gameEvents = new EventSystem();