package com.xiaomi.carwidget

import android.animation.ObjectAnimator
import android.os.Build
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.xiaomi.carwidget.switcher.CardSwitcher
import com.xiaomi.carwidget.webview.WidgetJsBridge
import com.xiaomi.carwidget.webview.WidgetWebView
import com.xiaomi.carwidget.widget.WidgetCache
import com.xiaomi.carwidget.widget.WidgetDetail
import com.xiaomi.carwidget.widget.WidgetSyncManager

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var dotIndicator: LinearLayout
    private lateinit var toastView: TextView
    private lateinit var emptyState: LinearLayout

    private lateinit var cache: WidgetCache
    private lateinit var widgetWebView: WidgetWebView
    private lateinit var jsBridge: WidgetJsBridge
    private lateinit var cardSwitcher: CardSwitcher
    private lateinit var syncManager: WidgetSyncManager

    private val widgets = mutableListOf<WidgetDetail>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupImmersiveMode()
        bindViews()
        setupWebView()
        setupSwitcher()
        loadCachedWidgets()
        startSync()
    }

    private fun setupImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }

    private fun bindViews() {
        webView = findViewById(R.id.widgetWebView)
        dotIndicator = findViewById(R.id.dotIndicator)
        toastView = findViewById(R.id.toastView)
        emptyState = findViewById(R.id.emptyState)
    }

    private fun setupWebView() {
        cache = WidgetCache(this)
        jsBridge = WidgetJsBridge(this) { webView }
        widgetWebView = WidgetWebView(this, webView, jsBridge)
    }

    private fun setupSwitcher() {
        cardSwitcher = CardSwitcher(this, webView, dotIndicator) { index ->
            if (index in widgets.indices) {
                widgetWebView.loadWidget(widgets[index])
                cache.lastViewedIndex = index
            }
        }
    }

    private fun loadCachedWidgets() {
        val cached = cache.loadAllWidgets()
        if (cached.isNotEmpty()) {
            widgets.addAll(cached)
            cardSwitcher.setCount(widgets.size)

            val lastIndex = cache.lastViewedIndex.coerceIn(0, widgets.size - 1)
            cardSwitcher.switchTo(lastIndex, animate = false)

            emptyState.visibility = View.GONE
            webView.visibility = View.VISIBLE
        } else {
            emptyState.visibility = View.VISIBLE
            webView.visibility = View.GONE
        }
    }

    private fun startSync() {
        syncManager = WidgetSyncManager(cache) { detail ->
            onNewWidget(detail)
        }
        syncManager.start()
    }

    private fun onNewWidget(detail: WidgetDetail) {
        // Add to list
        widgets.add(detail)
        cardSwitcher.setCount(widgets.size)

        // Auto-switch to new widget
        val newIndex = widgets.size - 1
        cardSwitcher.switchTo(newIndex, direction = 1)

        // Show UI
        emptyState.visibility = View.GONE
        webView.visibility = View.VISIBLE

        // Show toast
        showToast(getString(R.string.new_widget_toast))
    }

    private fun showToast(message: String) {
        toastView.text = message
        toastView.visibility = View.VISIBLE

        // Fade in
        ObjectAnimator.ofFloat(toastView, View.ALPHA, 0f, 1f).apply {
            duration = 200
            start()
        }

        // Fade out after 2s
        toastView.postDelayed({
            ObjectAnimator.ofFloat(toastView, View.ALPHA, 1f, 0f).apply {
                duration = 300
                addListener(object : android.animation.AnimatorListenerAdapter() {
                    override fun onAnimationEnd(animation: android.animation.Animator) {
                        toastView.visibility = View.GONE
                    }
                })
                start()
            }
        }, 2000)
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        // Let CardSwitcher detect horizontal flings
        if (cardSwitcher.onTouchEvent(ev)) {
            return true
        }
        return super.dispatchTouchEvent(ev)
    }

    override fun onResume() {
        super.onResume()
        if (::syncManager.isInitialized) {
            syncManager.start()
        }
        setupImmersiveMode()
    }

    override fun onPause() {
        super.onPause()
        if (::syncManager.isInitialized) {
            syncManager.stop()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::syncManager.isInitialized) {
            syncManager.destroy()
        }
        webView.destroy()
    }
}
