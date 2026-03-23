/**
 * Widget Storage — localStorage 封装
 * 命名空间隔离，增删改查 + 变更通知
 * ~1.5KB
 */

(function() {
  'use strict';

  function WidgetStorage(namespace) {
    if (!(this instanceof WidgetStorage)) return new WidgetStorage(namespace);
    this._key = 'widget_' + namespace + '_items';
    this._listeners = [];
  }

  WidgetStorage.prototype._read = function() {
    try {
      var raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  WidgetStorage.prototype._write = function(items) {
    try {
      localStorage.setItem(this._key, JSON.stringify(items));
    } catch (e) { /* WebView may restrict storage */ }
    this._notify();
  };

  WidgetStorage.prototype._genId = function() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  WidgetStorage.prototype._notify = function() {
    for (var i = 0; i < this._listeners.length; i++) {
      try { this._listeners[i](); } catch (e) {}
    }
  };

  WidgetStorage.prototype.getAll = function() {
    return this._read();
  };

  WidgetStorage.prototype.getById = function(id) {
    var items = this._read();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  };

  WidgetStorage.prototype.add = function(item) {
    var items = this._read();
    if (!item.id) item.id = this._genId();
    items.push(item);
    this._write(items);
    return item;
  };

  WidgetStorage.prototype.update = function(id, patch) {
    var items = this._read();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        for (var k in patch) {
          if (patch.hasOwnProperty(k)) items[i][k] = patch[k];
        }
        this._write(items);
        return items[i];
      }
    }
    return null;
  };

  WidgetStorage.prototype.remove = function(id) {
    var items = this._read();
    var filtered = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id !== id) filtered.push(items[i]);
    }
    this._write(filtered);
  };

  WidgetStorage.prototype.clear = function() {
    this._write([]);
  };

  WidgetStorage.prototype.onChange = function(callback) {
    if (typeof callback === 'function') this._listeners.push(callback);
  };

  WidgetStorage.prototype.seed = function(items) {
    if (this._read().length === 0 && items && items.length) {
      var seeded = [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item.id) item.id = this._genId();
        seeded.push(item);
      }
      this._write(seeded);
    }
  };

  // 简单 KV 存取（用于单值如 selected_city）
  WidgetStorage.prototype.get = function(key) {
    try {
      return JSON.parse(localStorage.getItem('widget_kv_' + key));
    } catch (e) { return null; }
  };

  WidgetStorage.prototype.set = function(key, value) {
    try {
      localStorage.setItem('widget_kv_' + key, JSON.stringify(value));
    } catch (e) {}
  };

  window.WidgetStorage = WidgetStorage;
})();
