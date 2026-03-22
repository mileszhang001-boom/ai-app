package com.xiaomi.carwidget.widget

import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class WidgetSyncManager(
    private val cache: WidgetCache,
    private val onNewWidget: (WidgetDetail) -> Unit
) {
    companion object {
        private const val API_BASE = "https://ai-widget-api.onrender.com"
        private const val DEVICE_ID = "demo_device"
        private const val POLL_INTERVAL_MS = 5000L
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var pollJob: Job? = null
    private val knownWidgetIds = cache.getKnownWidgetIds().toMutableSet()

    fun start() {
        if (pollJob?.isActive == true) return
        pollJob = scope.launch {
            while (isActive) {
                syncWidgets()
                delay(POLL_INTERVAL_MS)
            }
        }
    }

    fun stop() {
        pollJob?.cancel()
        pollJob = null
    }

    fun destroy() {
        scope.cancel()
    }

    private suspend fun syncWidgets() {
        try {
            val widgetsJson = fetchDeviceWidgets() ?: return
            val widgets = widgetsJson.optJSONArray("widgets") ?: return

            for (i in 0 until widgets.length()) {
                val w = widgets.getJSONObject(i)
                val widgetId = w.optString("widget_id", "")
                val status = w.optString("status", "")

                if (status == "success" && widgetId.isNotEmpty() && widgetId !in knownWidgetIds) {
                    val detail = fetchWidgetDetail(widgetId)
                    if (detail != null) {
                        cache.saveWidget(detail)
                        knownWidgetIds.add(widgetId)
                        cache.saveKnownWidgetIds(knownWidgetIds)
                        withContext(Dispatchers.Main) {
                            onNewWidget(detail)
                        }
                    }
                }
            }
        } catch (_: Exception) {
            // Silent: network may be unavailable
        }
    }

    private fun fetchDeviceWidgets(): JSONObject? {
        val request = Request.Builder()
            .url("$API_BASE/api/device/$DEVICE_ID/widgets")
            .build()
        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                response.body?.string()?.let { JSONObject(it) }
            } else null
        } catch (_: Exception) {
            null
        }
    }

    private fun fetchWidgetDetail(widgetId: String): WidgetDetail? {
        val request = Request.Builder()
            .url("$API_BASE/api/widgets/$widgetId")
            .build()
        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                response.body?.string()?.let { WidgetDetail.fromJson(JSONObject(it)) }
            } else null
        } catch (_: Exception) {
            null
        }
    }
}
