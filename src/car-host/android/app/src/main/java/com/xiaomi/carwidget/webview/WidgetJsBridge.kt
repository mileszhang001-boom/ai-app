package com.xiaomi.carwidget.webview

import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import android.util.Log
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

    // MediaSession integration
    private var mediaSessionManager: MediaSessionManager? = null
    private var activeMediaCallback: MediaController.Callback? = null
    private var activeMediaController: MediaController? = null

    init {
        try {
            mediaSessionManager = context.getSystemService(Context.MEDIA_SESSION_SERVICE)
                as? MediaSessionManager
            startMediaSessionListener()
        } catch (e: Exception) {
            Log.w("WidgetJsBridge", "MediaSessionManager not available: ${e.message}")
        }
    }

    private fun getListenerComponent(): ComponentName {
        return ComponentName(context, MediaListenerService::class.java)
    }

    private fun startMediaSessionListener() {
        val msm = mediaSessionManager ?: return

        // Try with NotificationListenerService component first, then null (needs MEDIA_CONTENT_CONTROL)
        val componentName = getListenerComponent()

        fun tryGetSessions(): List<MediaController>? {
            return try {
                msm.getActiveSessions(componentName)
            } catch (e: SecurityException) {
                Log.w("WidgetJsBridge", "getActiveSessions with listener denied, trying null: ${e.message}")
                try {
                    msm.getActiveSessions(null)
                } catch (e2: SecurityException) {
                    Log.w("WidgetJsBridge", "getActiveSessions denied: ${e2.message}")
                    null
                }
            }
        }

        val controllers = tryGetSessions()
        if (controllers != null && controllers.isNotEmpty()) {
            watchController(controllers[0])
            Log.i("WidgetJsBridge", "Watching MediaSession: ${controllers[0].packageName}")
        }

        // Listen for session changes
        try {
            msm.addOnActiveSessionsChangedListener({ newControllers ->
                if (!newControllers.isNullOrEmpty()) {
                    watchController(newControllers[0])
                    Log.i("WidgetJsBridge", "MediaSession changed: ${newControllers[0].packageName}")
                } else {
                    unwatchController()
                    fireEvent("mediaSessionChange", JSONObject().apply {
                        put("song_name", "")
                        put("artist", "")
                        put("isPlaying", false)
                    })
                }
            }, componentName)
        } catch (e: SecurityException) {
            Log.w("WidgetJsBridge", "addOnActiveSessionsChangedListener denied: ${e.message}")
        }
    }

    private fun watchController(controller: MediaController) {
        unwatchController()
        activeMediaController = controller
        activeMediaCallback = object : MediaController.Callback() {
            override fun onPlaybackStateChanged(state: PlaybackState?) {
                fireMediaSessionUpdate(controller)
            }
            override fun onMetadataChanged(metadata: MediaMetadata?) {
                fireMediaSessionUpdate(controller)
            }
        }
        controller.registerCallback(activeMediaCallback!!, mainHandler)
    }

    private fun unwatchController() {
        activeMediaCallback?.let { cb ->
            activeMediaController?.unregisterCallback(cb)
        }
        activeMediaCallback = null
        activeMediaController = null
    }

    private fun fireMediaSessionUpdate(controller: MediaController) {
        val data = buildMediaSessionJson(controller)
        fireEvent("mediaSessionChange", data)
    }

    private fun buildMediaSessionJson(controller: MediaController): JSONObject {
        val metadata = controller.metadata
        val playbackState = controller.playbackState
        return JSONObject().apply {
            put("song_name", metadata?.getString(MediaMetadata.METADATA_KEY_TITLE) ?: "")
            put("artist", metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: "")
            put("album", metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM) ?: "")
            put("duration", (metadata?.getLong(MediaMetadata.METADATA_KEY_DURATION) ?: 0L) / 1000)
            put("position", (playbackState?.position ?: 0L) / 1000)
            put("isPlaying", playbackState?.state == PlaybackState.STATE_PLAYING)
            // Album art URL: try ART_URI, fall back to empty
            val artUri = metadata?.getString(MediaMetadata.METADATA_KEY_ART_URI)
                ?: metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI)
                ?: ""
            put("albumArtUrl", artUri)
        }
    }

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

            "getMediaSession" -> getActiveMediaSessionData()

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

    private fun getActiveMediaSessionData(): JSONObject {
        // Try real MediaSession — first with listener component, then with null
        val msm = mediaSessionManager
        if (msm != null) {
            val controllers = try {
                msm.getActiveSessions(getListenerComponent())
            } catch (e: SecurityException) {
                try { msm.getActiveSessions(null) } catch (_: SecurityException) { null }
            } catch (e: Exception) {
                Log.w("WidgetJsBridge", "MediaSession error: ${e.message}")
                null
            }
            if (controllers != null && controllers.isNotEmpty()) {
                return buildMediaSessionJson(controllers[0])
            }
        }
        // No active session — return empty so template shows empty state
        return JSONObject().apply {
            put("song_name", "")
            put("artist", "")
            put("isPlaying", false)
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
