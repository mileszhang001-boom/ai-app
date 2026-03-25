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
                useWideViewPort = false
                loadWithOverviewMode = false
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            addJavascriptInterface(jsBridge, jsBridge.getInterfaceName())
        }
    }

    fun loadWidget(detail: WidgetDetail) {
        // Code-mode: AI 生成的完整 HTML，直接加载
        if (detail.isCodeMode) {
            val html = injectZoom(detail.htmlContent!!)
            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
            return
        }

        // Template-mode: 从本地 assets 加载模板
        val assetPath = TemplateMapper.getAssetPath(detail.componentType, detail.theme) ?: return
        val indexPath = "widget-templates/$assetPath/index.html"

        val html = readAsset(indexPath) ?: return
        val injectedHtml = injectParams(html, detail)

        val baseUrl = "file:///android_asset/widget-templates/$assetPath/"
        webView.loadDataWithBaseURL(baseUrl, injectedHtml, "text/html", "UTF-8", null)
    }

    private fun injectZoom(html: String): String {
        val zoomScript = """<script>(function(){
            var dw=896;
            function applyZoom(){
                var w=window.innerWidth;
                if(w>0&&w!==dw){document.documentElement.style.zoom=w/dw;}
            }
            if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',applyZoom);}
            else{applyZoom();}
        })();</script>"""
        return if (html.contains("</head>")) {
            html.replace("</head>", "$zoomScript</head>")
        } else {
            "$zoomScript$html"
        }
    }

    private fun injectParams(html: String, detail: WidgetDetail): String {
        val paramsScript = "<script>window.__WIDGET_PARAMS__ = ${detail.params.toString()};</script>"
        val carWidgetScript = "<script>window.__CAR_WIDGET__ = true;</script>"

        // CSS zoom: 模板设计宽度 896px，自动适配实际 WebView 宽度
        // 同时移除圆角（车端全屏填充，不需要 border-radius）
        val zoomScript = """<script>(function(){
            var dw=896;
            function applyZoom(){
                var w=window.innerWidth;
                if(w>0&&w!==dw){document.documentElement.style.zoom=w/dw;}
                // 车端移除卡片圆角（全屏填充）
                var root=document.querySelector('[class*="widget-"]');
                if(root){root.style.borderRadius='0';root.style.overflow='hidden';}
            }
            if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',applyZoom);}
            else{applyZoom();}
        })();</script>"""

        val dataModeScript = "<script>window.__WIDGET_DATA_MODE__ = 'live';</script>"
        val injection = "$paramsScript\n$carWidgetScript\n$dataModeScript\n$zoomScript\n"

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
