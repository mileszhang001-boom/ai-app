package com.xiaomi.carwidget.switcher

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.webkit.WebView
import android.widget.LinearLayout

class CardSwitcher(
    private val context: Context,
    private val webView: WebView,
    private val dotIndicator: LinearLayout,
    private val onSwitch: (Int) -> Unit
) {
    var currentIndex = 0
        private set
    var totalCount = 0
        private set

    private val dp = { value: Float ->
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, context.resources.displayMetrics)
    }

    private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onFling(
            e1: MotionEvent?,
            e2: MotionEvent,
            velocityX: Float,
            velocityY: Float
        ): Boolean {
            if (e1 == null) return false
            val dx = e2.x - e1.x
            val minDistance = dp(100f)
            val minVelocity = dp(200f)

            if (Math.abs(dx) > minDistance && Math.abs(velocityX) > minVelocity) {
                if (dx < 0 && currentIndex < totalCount - 1) {
                    // Swipe left → next
                    switchTo(currentIndex + 1, direction = 1)
                    return true
                } else if (dx > 0 && currentIndex > 0) {
                    // Swipe right → prev
                    switchTo(currentIndex - 1, direction = -1)
                    return true
                }
            }
            return false
        }
    })

    fun onTouchEvent(event: MotionEvent): Boolean {
        return gestureDetector.onTouchEvent(event)
    }

    fun setCount(count: Int) {
        totalCount = count
        if (currentIndex >= count && count > 0) {
            currentIndex = count - 1
        }
        updateDots()
    }

    fun switchTo(index: Int, direction: Int = 0, animate: Boolean = true) {
        if (index < 0 || index >= totalCount) return
        currentIndex = index

        if (animate && direction != 0) {
            animateCrossfade(direction) {
                onSwitch(index)
            }
        } else {
            onSwitch(index)
        }

        updateDots()
    }

    private fun animateCrossfade(direction: Int, onMidpoint: () -> Unit) {
        val slideOut = dp(30f) * -direction
        val slideIn = dp(30f) * direction

        // Phase 1: fade out current
        val fadeOut = ObjectAnimator.ofFloat(webView, View.ALPHA, 1f, 0f)
        val translateOut = ObjectAnimator.ofFloat(webView, View.TRANSLATION_X, 0f, slideOut)
        val outSet = AnimatorSet().apply {
            playTogether(fadeOut, translateOut)
            duration = 150
            interpolator = DecelerateInterpolator()
        }

        outSet.addListener(object : android.animation.AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
                // Load new content
                onMidpoint()

                // Phase 2: fade in new
                webView.translationX = slideIn
                val fadeIn = ObjectAnimator.ofFloat(webView, View.ALPHA, 0f, 1f)
                val translateIn = ObjectAnimator.ofFloat(webView, View.TRANSLATION_X, slideIn, 0f)
                AnimatorSet().apply {
                    playTogether(fadeIn, translateIn)
                    duration = 150
                    interpolator = DecelerateInterpolator()
                    start()
                }
            }
        })

        outSet.start()
    }

    private fun updateDots() {
        dotIndicator.removeAllViews()
        if (totalCount <= 1) {
            dotIndicator.visibility = View.GONE
            return
        }
        dotIndicator.visibility = View.VISIBLE

        for (i in 0 until totalCount) {
            val isActive = i == currentIndex
            val dot = View(context)

            val widthDp = if (isActive) 16f else 6f
            val heightDp = 6f
            val width = dp(widthDp).toInt()
            val height = dp(heightDp).toInt()

            val params = LinearLayout.LayoutParams(width, height)
            if (i > 0) params.leftMargin = dp(6f).toInt()
            dot.layoutParams = params

            val bg = GradientDrawable()
            bg.cornerRadius = dp(3f)
            if (isActive) {
                bg.setColor(Color.argb(230, 255, 255, 255)) // white 90%
            } else {
                bg.setColor(Color.argb(77, 255, 255, 255)) // white 30%
            }
            dot.background = bg

            dotIndicator.addView(dot)
        }
    }
}
