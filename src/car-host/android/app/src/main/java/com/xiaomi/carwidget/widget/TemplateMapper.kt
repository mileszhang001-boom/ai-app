package com.xiaomi.carwidget.widget

object TemplateMapper {

    /**
     * Maps component_type + theme to the asset path under widget-templates/
     * Returns the directory path (e.g. "anniversary/love")
     */
    fun getAssetPath(componentType: String, theme: String): String? {
        return when (componentType) {
            "anniversary" -> when (theme) {
                "love", "baby", "holiday" -> "anniversary/$theme"
                else -> null
            }
            "news" -> "news"
            "alarm" -> "alarm"
            "weather" -> "weather"
            "music" -> "music"
            "calendar" -> "calendar"
            else -> null
        }
    }

    /**
     * Returns the full asset file path for the index.html
     */
    fun getIndexHtmlPath(componentType: String, theme: String): String? {
        val dir = getAssetPath(componentType, theme) ?: return null
        return "widget-templates/$dir/index.html"
    }
}
