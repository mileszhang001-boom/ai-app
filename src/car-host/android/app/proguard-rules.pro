# Keep JSBridge interface methods (called from JavaScript)
-keepclassmembers class com.xiaomi.carwidget.webview.WidgetJsBridge {
    @android.webkit.JavascriptInterface <methods>;
}
