package com.xiaomi.carwidget.widget

import org.json.JSONObject

data class WidgetDetail(
    val widgetId: String,
    val componentType: String,
    val theme: String,
    val stylePreset: String,
    val params: JSONObject,
    val createdAt: String
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("widget_id", widgetId)
        put("component_type", componentType)
        put("theme", theme)
        put("style_preset", stylePreset)
        put("params", params)
        put("created_at", createdAt)
    }

    companion object {
        fun fromJson(json: JSONObject): WidgetDetail = WidgetDetail(
            widgetId = json.optString("widget_id", ""),
            componentType = json.optString("component_type", ""),
            theme = json.optString("theme", ""),
            stylePreset = json.optString("style_preset", ""),
            params = json.optJSONObject("params") ?: JSONObject(),
            createdAt = json.optString("created_at", "")
        )
    }
}
