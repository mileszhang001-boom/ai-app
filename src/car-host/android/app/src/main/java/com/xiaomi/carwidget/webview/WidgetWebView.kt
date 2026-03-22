package com.xiaomi.carwidget.webview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.view.View
import android.webkit.WebSettings
import android.webkit.WebView
import com.xiaomi.carwidget.widget.TemplateMapper
import com.xiaomi.carwidget.widget.WidgetDetail
import java.io.BufferedReader
import java.io.InputStreamReader

class WidgetWebView(
    private val context: Context,
    private val webView: WebView,
    private val jsBridge: WidgetJsBridge
) {
    init {
        setupWebView()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.apply {
            setBackgroundColor(Color.parseColor("#0E1013"))
            overScrollMode = View.OVER_SCROLL_NEVER
            setLayerType(View.LAYER_TYPE_HARDWARE, null)

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                mediaPlaybackRequiresUserGesture = false
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            addJavascriptInterface(jsBridge, jsBridge.getInterfaceName())
        }
    }

    fun loadWidget(detail: WidgetDetail) {
        val assetPath = TemplateMapper.getAssetPath(detail.componentType, detail.theme) ?: return
        val indexPath = "widget-templates/$assetPath/index.html"

        val html = readAsset(indexPath) ?: return
        val injectedHtml = injectParams(html, detail)

        val baseUrl = "file:///android_asset/widget-templates/$assetPath/"
        webView.loadDataWithBaseURL(baseUrl, injectedHtml, "text/html", "UTF-8", null)
    }

    private fun injectParams(html: String, detail: WidgetDetail): String {
        val paramsScript = "<script>window.__WIDGET_PARAMS__ = ${detail.params.toString()};</script>"
        val carWidgetScript = "<script>window.__CAR_WIDGET__ = true;</script>"
        val injection = "$paramsScript\n$carWidgetScript\n"

        // Inject before </head>
        return if (html.contains("</head>")) {
            html.replace("</head>", "$injection</head>")
        } else {
            // Fallback: prepend
            "$injection$html"
        }
    }

    private fun readAsset(path: String): String? {
        return try {
            context.assets.open(path).use { inputStream ->
                BufferedReader(InputStreamReader(inputStream, "UTF-8")).use { reader ->
                    reader.readText()
                }
            }
        } catch (e: Exception) {
            null
        }
    }
}
