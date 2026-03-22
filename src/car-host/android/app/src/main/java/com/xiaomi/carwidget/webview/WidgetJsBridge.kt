package com.xiaomi.carwidget.webview

import android.content.Context
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.TimeZone
import java.util.concurrent.TimeUnit

/**
 * JSBridge implementation for XiaomiCar native interface.
 *
 * bridge.js calls: bridge.call(method, JSON.stringify(params), callbackId)
 * We handle the method, then invoke the JS callback with the result.
 */
class WidgetJsBridge(
    private val context: Context,
    private val webViewProvider: () -> WebView?
) {
    companion object {
        private const val API_BASE = "https://ai-widget-api.onrender.com"
        private const val JS_INTERFACE_NAME = "XiaomiCar"
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val storagePrefs: SharedPreferences =
        context.getSharedPreferences("widget_storage", Context.MODE_PRIVATE)

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    // Event handlers registered by JS
    private val eventHandlers = mutableMapOf<String, MutableList<String>>()

    fun getInterfaceName(): String = JS_INTERFACE_NAME

    @JavascriptInterface
    fun call(method: String, paramsJson: String, callbackId: String) {
        Thread {
            val params = try { JSONObject(paramsJson) } catch (_: Exception) { JSONObject() }
            val result = handleMethod(method, params)
            invokeCallback(callbackId, result)
        }.start()
    }

    @JavascriptInterface
    fun on(event: String, handlerName: String) {
        synchronized(eventHandlers) {
            eventHandlers.getOrPut(event) { mutableListOf() }.add(handlerName)
        }
    }

    @JavascriptInterface
    fun off(event: String, handlerName: String) {
        synchronized(eventHandlers) {
            eventHandlers[event]?.remove(handlerName)
        }
    }

    private fun handleMethod(method: String, params: JSONObject): JSONObject {
        return when (method) {
            "getDateTime" -> JSONObject().apply {
                put("timestamp", System.currentTimeMillis())
                put("timezone", TimeZone.getDefault().id)
            }

            "getTheme" -> JSONObject().apply {
                put("mode", "dark")
                put("accent_color", "#FF6900")
            }

            "storageGet" -> {
                val key = params.optString("key", "")
                val value = storagePrefs.getString("widget_$key", null)
                if (value != null) {
                    // Return raw value — bridge.js expects the stored value directly
                    JSONObject().apply { put("value", value) }
                } else {
                    JSONObject.NULL as? JSONObject ?: JSONObject().apply { put("value", JSONObject.NULL) }
                }
            }

            "storageSet" -> {
                val key = params.optString("key", "")
                val value = params.optString("value", "")
                storagePrefs.edit().putString("widget_$key", value).apply()
                JSONObject().apply { put("success", true) }
            }

            "getVehicleInfo" -> JSONObject().apply {
                put("battery_percent", 85)
                put("mileage_km", 12345)
                put("range_km", 420)
            }

            "fetchData" -> handleFetchData(params)

            "getMediaSession" -> JSONObject().apply {
                put("song_name", "晴天")
                put("artist", "周杰伦")
                put("album", "叶惠美")
                put("duration", 269)
                put("position", 45)
                put("isPlaying", true)
                put("albumArtUrl", "")
            }

            "mediaControl" -> JSONObject().apply { put("success", true) }

            "scheduleNotification" -> JSONObject().apply { put("success", true) }

            "cancelNotification" -> JSONObject().apply { put("success", true) }

            "setAlarm" -> JSONObject().apply {
                put("success", true)
                put("alarm_id", "alarm_${System.currentTimeMillis()}")
            }

            else -> JSONObject().apply { put("success", true) }
        }
    }

    private fun handleFetchData(params: JSONObject): JSONObject {
        val url = params.optString("url", "")
        if (url.isEmpty()) {
            return JSONObject().apply {
                put("data", "")
                put("status", 400)
            }
        }

        // Resolve relative URLs against API base
        val fullUrl = if (url.startsWith("http://") || url.startsWith("https://")) {
            url
        } else if (url.startsWith("/")) {
            "$API_BASE$url"
        } else {
            "$API_BASE/$url"
        }

        return try {
            val request = Request.Builder().url(fullUrl).build()
            val response = httpClient.newCall(request).execute()
            val body = response.body?.string() ?: ""
            JSONObject().apply {
                put("data", body)
                put("status", response.code)
            }
        } catch (e: Exception) {
            JSONObject().apply {
                put("data", "")
                put("status", 0)
                put("error", e.message ?: "Network error")
            }
        }
    }

    private fun invokeCallback(callbackId: String, result: JSONObject) {
        val js = "window['$callbackId'](${result.toString()})"
        mainHandler.post {
            webViewProvider()?.evaluateJavascript(js) {}
        }
    }

    /**
     * Fire an event to all registered JS handlers
     */
    fun fireEvent(event: String, data: JSONObject) {
        val handlers: List<String>
        synchronized(eventHandlers) {
            handlers = eventHandlers[event]?.toList() ?: return
        }
        mainHandler.post {
            val webView = webViewProvider() ?: return@post
            for (handler in handlers) {
                webView.evaluateJavascript(
                    "window['$handler']('${data.toString().replace("'", "\\'")}')"
                ) {}
            }
        }
    }
}
