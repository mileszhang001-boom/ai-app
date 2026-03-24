package com.xiaomi.carwidget

import android.animation.ObjectAnimator
import android.app.AlertDialog
import android.os.Build
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebView
import android.widget.FrameLayout
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

    private lateinit var editOverlay: FrameLayout
    private lateinit var editDeleteBtn: View
    private lateinit var editDoneBtn: View

    private lateinit var cache: WidgetCache
    private lateinit var widgetWebView: WidgetWebView
    private lateinit var jsBridge: WidgetJsBridge
    private lateinit var cardSwitcher: CardSwitcher
    private lateinit var syncManager: WidgetSyncManager

    private val widgets = mutableListOf<WidgetDetail>()
    private var isEditMode = false

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
        editOverlay = findViewById(R.id.editOverlay)
        editDeleteBtn = findViewById(R.id.editDeleteBtn)
        editDoneBtn = findViewById(R.id.editDoneBtn)

        editDeleteBtn.setOnClickListener { confirmDeleteCurrentWidget() }
        editDoneBtn.setOnClickListener { exitEditMode() }
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
        cardSwitcher.onLongPress = { enterEditMode() }
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

    // ── 编辑态 ──

    private fun enterEditMode() {
        if (isEditMode || widgets.isEmpty()) return
        isEditMode = true
        cardSwitcher.isEditMode = true

        editOverlay.visibility = View.VISIBLE
        dotIndicator.visibility = View.GONE

        // 缩放 WebView 到 80%
        webView.animate()
            .scaleX(0.8f).scaleY(0.8f)
            .setDuration(300)
            .start()
    }

    private fun exitEditMode() {
        isEditMode = false
        cardSwitcher.isEditMode = false

        editOverlay.visibility = View.GONE
        cardSwitcher.setCount(widgets.size) // 恢复 dot indicator

        // 恢复 WebView 缩放
        webView.animate()
            .scaleX(1f).scaleY(1f)
            .setDuration(300)
            .start()
    }

    private fun confirmDeleteCurrentWidget() {
        val index = cardSwitcher.currentIndex
        if (index !in widgets.indices) return
        val widget = widgets[index]
        val label = "${widget.componentType}/${widget.theme}"

        AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle("删除卡片")
            .setMessage("确定删除「$label」？")
            .setPositiveButton("删除") { _, _ -> deleteWidget(index) }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun deleteWidget(index: Int) {
        if (index !in widgets.indices) return
        val widget = widgets.removeAt(index)
        cache.deleteWidget(widget.widgetId)

        if (widgets.isEmpty()) {
            exitEditMode()
            emptyState.visibility = View.VISIBLE
            webView.visibility = View.GONE
            return
        }

        val newIndex = if (index >= widgets.size) widgets.size - 1 else index
        cardSwitcher.setCount(widgets.size)
        cardSwitcher.switchTo(newIndex, animate = false)
        showToast("已删除卡片")
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
        // 编辑态下点击 WebView 区域退出编辑
        if (isEditMode && ev.action == MotionEvent.ACTION_UP) {
            val overlayRect = IntArray(2)
            editOverlay.getLocationOnScreen(overlayRect)
            // 如果不在删除/完成按钮上，检查是否点击了卡片区域
            if (!isViewTouched(editDeleteBtn, ev) && !isViewTouched(editDoneBtn, ev)) {
                exitEditMode()
                return true
            }
        }

        // Let CardSwitcher detect horizontal flings + long-press
        if (cardSwitcher.onTouchEvent(ev)) {
            return true
        }
        return super.dispatchTouchEvent(ev)
    }

    private fun isViewTouched(view: View, ev: MotionEvent): Boolean {
        val loc = IntArray(2)
        view.getLocationOnScreen(loc)
        val x = ev.rawX
        val y = ev.rawY
        return x >= loc[0] && x <= loc[0] + view.width && y >= loc[1] && y <= loc[1] + view.height
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
