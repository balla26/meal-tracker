export const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function sendBrowserNotification(title: string, body: string): void {
  if (!notificationsSupported || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: undefined, tag: title })
  } catch {
    // Some browsers (notably iOS Safari home-screen web apps) restrict this — the
    // in-app toast still covers the notification, so failing silently is fine here.
  }
}
