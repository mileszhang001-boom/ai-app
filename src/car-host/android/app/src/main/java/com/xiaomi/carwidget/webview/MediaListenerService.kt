package com.xiaomi.carwidget.webview

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * NotificationListenerService stub.
 * Required for MediaSessionManager.getActiveSessions(componentName) permission.
 * User must enable notification access in Settings for this app.
 */
class MediaListenerService : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification?) {}
    override fun onNotificationRemoved(sbn: StatusBarNotification?) {}
}
