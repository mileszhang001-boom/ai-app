/**
 * AI小组件 JSBridge 封装
 *
 * 车端组件与宿主 App 通信的统一接口
 * 在车机 WebView 环境中，这些方法会调用真实的原生 API
 * 在开发环境中，提供 mock 实现
 */

(function(window) {
  'use strict';

  // 检测是否在车机环境中
  const isCarEnvironment = typeof window.XiaomiCar !== 'undefined' ||
                           typeof window.miCarBridge !== 'undefined' ||
                           window.__CAR_WIDGET__ === true;

  /**
   * 原生桥接调用
   * @param {string} method - API 方法名
   * @param {Object} params - 参数对象
   * @returns {Promise<any>}
   */
  function nativeCall(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!isCarEnvironment) {
        // 开发环境：使用 mock 延迟返回
        setTimeout(() => {
          const mockResponse = mockHandlers[method]?.(params);
          if (mockResponse !== undefined) {
            resolve(mockResponse);
          } else {
            resolve({ success: true });
          }
        }, 50);
        return;
      }

      // 车机环境：调用真实桥接
      const bridge = window.XiaomiCar || window.miCarBridge;
      if (!bridge) {
        reject(new Error('Bridge not available'));
        return;
      }

      const callbackId = 'callback_' + Date.now() + '_' + Math.random();

      bridge.call(method, JSON.stringify(params), callbackId);

      // 设置回调
      window[callbackId] = function(response) {
        delete window[callbackId];
        const result = typeof response === 'string' ? JSON.parse(response) : response;
        if (result.success === false) {
          reject(new Error(result.error || 'Bridge call failed'));
        } else {
          resolve(result);
        }
      };

      // 超时保护
      setTimeout(() => {
        if (window[callbackId]) {
          delete window[callbackId];
          reject(new Error('Bridge call timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Mock 处理器（开发环境使用）
   */
  const mockHandlers = {
    getDateTime: () => ({
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }),

    getTheme: () => ({
      mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      accent_color: '#FF6900'
    }),

    storageGet: (params) => {
      const key = params.key;
      try {
        return localStorage.getItem(`widget_${key}`);
      } catch {
        return null;
      }
    },

    storageSet: (params) => {
      try {
        localStorage.setItem(`widget_${params.key}`, params.value);
        return { success: true };
      } catch {
        return { success: false };
      }
    },

    scheduleNotification: () => ({ success: true }),

    cancelNotification: () => ({ success: true }),

    setAlarm: () => ({ success: true, alarm_id: 'alarm_' + Date.now() }),

    getVehicleInfo: () => ({
      mileage_km: 12345,
      battery_percent: 85,
      range_km: 420
    }),

    fetchData: (params) => ({
      data: '{"news": []}',
      status: 200
    }),

    getMediaSession: () => ({
      song_name: '夜曲',
      artist: '周杰伦',
      album: '十一月的萧邦',
      duration: 280,
      position: 45,
      isPlaying: true,
      albumArtUrl: '',
      lyrics_snippet: '一群嗜血的蚂蚁 被腐肉所吸引'
    }),

    mediaControl: (params) => ({ success: true, action: params?.action || 'toggle' })
  };

  /**
   * AIWidgetBridge 公开接口
   */
  const AIWidgetBridge = {
    /**
     * 获取当前时间信息
     * @returns {Promise<{timestamp: number, timezone: string}>}
     */
    getDateTime: function() {
      return nativeCall('getDateTime');
    },

    /**
     * 设置通知
     * @param {Object} params
     * @param {string} params.id - 通知 ID
     * @param {string} params.title - 标题
     * @param {string} params.body - 内容
     * @param {number} params.trigger_at - 触发时间戳
     * @param {string} params.repeat - 重复周期
     */
    scheduleNotification: function(params) {
      return nativeCall('scheduleNotification', params);
    },

    /**
     * 取消通知
     * @param {string} id - 通知 ID
     */
    cancelNotification: function(id) {
      return nativeCall('cancelNotification', { id });
    },

    /**
     * 设置闹钟
     * @param {Object} params
     * @param {number} params.hour - 小时 (0-23)
     * @param {number} params.minute - 分钟 (0-59)
     * @param {string} params.label - 标签
     * @param {string} params.repeat - 重复周期
     */
    setAlarm: function(params) {
      return nativeCall('setAlarm', params);
    },

    /**
     * 组件级本地存储
     * @param {string} key - 键名
     * @returns {Promise<string|null>}
     */
    storageGet: function(key) {
      return nativeCall('storageGet', { key });
    },

    /**
     * 组件级本地存储
     * @param {string} key - 键名
     * @param {string} value - 值
     * @returns {Promise<{success: boolean}>}
     */
    storageSet: function(key, value) {
      return nativeCall('storageSet', { key, value });
    },

    /**
     * 获取当前主题
     * @returns {Promise<{mode: 'light'|'dark', accent_color: string}>}
     */
    getTheme: function() {
      return nativeCall('getTheme');
    },

    /**
     * 监听主题变化
     * @param {Function} callback - 回调函数
     */
    onThemeChange: function(callback) {
      if (typeof callback !== 'function') return;

      // 开发环境：监听系统主题变化
      if (!isCarEnvironment) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
          callback({
            mode: e.matches ? 'dark' : 'light',
            accent_color: '#FF6900'
          });
        };
        mediaQuery.addEventListener('change', handler);

        // 立即触发一次
        handler(mediaQuery);

        return () => mediaQuery.removeEventListener('change', handler);
      }

      // 车机环境：注册主题变化监听
      const handlerName = 'onThemeChange_' + Date.now();
      window[handlerName] = function(theme) {
        callback(JSON.parse(theme));
      };
      const bridge = window.XiaomiCar || window.miCarBridge;
      bridge.on('themeChange', handlerName);

      return () => {
        delete window[handlerName];
        bridge.off('themeChange', handlerName);
      };
    },

    /**
     * 获取车辆基础信息（只读）
     * @returns {Promise<{mileage_km: number, battery_percent: number, range_km: number}>}
     */
    getVehicleInfo: function() {
      return nativeCall('getVehicleInfo');
    },

    /**
     * 网络请求（受限，仅白名单域名）
     * @param {string} url - 请求 URL
     * @returns {Promise<{data: string, status: number}>}
     */
    fetchData: function(url) {
      return nativeCall('fetchData', { url });
    },

    /**
     * 获取当前 MediaSession 信息（音乐播放状态）
     * @returns {Promise<{song_name, artist, album, duration, position, isPlaying, albumArtUrl}|null>}
     */
    getMediaSession: function() {
      return nativeCall('getMediaSession');
    },

    /**
     * 监听 MediaSession 变化（切歌、播放/暂停、进度跳转）
     * @param {Function} callback - 回调函数，参数为 MediaSession 数据或 null
     * @returns {Function} 取消监听的函数
     */
    onMediaSessionChange: function(callback) {
      if (typeof callback !== 'function') return function() {};

      if (!isCarEnvironment) {
        // 开发环境：模拟每 3 秒更新进度
        var session = {
          song_name: '晴天', artist: '周杰伦', album: '叶惠美',
          duration: 269, position: 45, isPlaying: true, albumArtUrl: ''
        };
        var timer = setInterval(function() {
          if (session.isPlaying) {
            session.position = (session.position + 3) % session.duration;
          }
          callback(Object.assign({}, session));
        }, 3000);
        return function() { clearInterval(timer); };
      }

      // 车机环境：注册 MediaSession 变化监听
      var handlerName = 'onMediaSessionChange_' + Date.now();
      window[handlerName] = function(data) {
        callback(typeof data === 'string' ? JSON.parse(data) : data);
      };
      var bridge = window.XiaomiCar || window.miCarBridge;
      bridge.on('mediaSessionChange', handlerName);
      return function() {
        delete window[handlerName];
        bridge.off('mediaSessionChange', handlerName);
      };
    },

    /**
     * 媒体控制（播放/暂停/上一首/下一首）
     * @param {string} action - 'play'|'pause'|'next'|'prev'
     * @returns {Promise<{success: boolean}>}
     */
    mediaControl: function(action) {
      return nativeCall('mediaControl', { action: action });
    },

    /**
     * 检测环境
     * @returns {boolean} 是否在车机环境中运行
     */
    isCarEnvironment: function() {
      return isCarEnvironment;
    }
  };

  // 导出到全局
  window.AIWidgetBridge = AIWidgetBridge;

  // 兼容旧版本
  window.miWidgetBridge = AIWidgetBridge;

})(typeof window !== 'undefined' ? window : global);
