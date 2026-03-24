package com.xiaomi.carwidget.widget

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class WidgetCache(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("widget_cache", Context.MODE_PRIVATE)

    fun saveWidget(detail: WidgetDetail) {
        val widgets = loadAllWidgets().toMutableList()
        // Replace if exists, otherwise add
        val idx = widgets.indexOfFirst { it.widgetId == detail.widgetId }
        if (idx >= 0) {
            widgets[idx] = detail
        } else {
            widgets.add(detail)
        }
        saveWidgetList(widgets)

        // Update known IDs
        val knownIds = getKnownWidgetIds().toMutableSet()
        knownIds.add(detail.widgetId)
        saveKnownWidgetIds(knownIds)
    }

    fun loadAllWidgets(): List<WidgetDetail> {
        val json = prefs.getString("widgets", null) ?: return emptyList()
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { WidgetDetail.fromJson(arr.getJSONObject(it)) }
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun getKnownWidgetIds(): Set<String> {
        return prefs.getStringSet("known_widget_ids", emptySet()) ?: emptySet()
    }

    fun saveKnownWidgetIds(ids: Set<String>) {
        prefs.edit().putStringSet("known_widget_ids", ids).apply()
    }

    fun deleteWidget(widgetId: String) {
        val widgets = loadAllWidgets().toMutableList()
        widgets.removeAll { it.widgetId == widgetId }
        saveWidgetList(widgets)

        val knownIds = getKnownWidgetIds().toMutableSet()
        knownIds.remove(widgetId)
        saveKnownWidgetIds(knownIds)
    }

    fun reorderWidgets(orderedIds: List<String>) {
        val widgets = loadAllWidgets().toMutableList()
        val idToWidget = widgets.associateBy { it.widgetId }
        val reordered = orderedIds.mapNotNull { idToWidget[it] }
        saveWidgetList(reordered)
    }

    var lastViewedIndex: Int
        get() = prefs.getInt("last_viewed_index", 0)
        set(value) { prefs.edit().putInt("last_viewed_index", value).apply() }

    private fun saveWidgetList(widgets: List<WidgetDetail>) {
        val arr = JSONArray()
        widgets.forEach { arr.put(it.toJson()) }
        prefs.edit().putString("widgets", arr.toString()).apply()
    }
}
