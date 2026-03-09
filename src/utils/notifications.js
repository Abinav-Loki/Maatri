/**
 * Web Notifications Utility for Maatri Shield
 * Handles browser-based toast notifications and permission requests.
 */

const browserNotifications = {
    requestPermission: async () => {
        if (!("Notification" in window)) {
            console.error("This browser does not support desktop notification");
            return false;
        }

        if (Notification.permission === "granted") return true;

        const permission = await Notification.requestPermission();
        return permission === "granted";
    },

    send: async (title, body, icon = '/logo192.png') => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(title, { body, icon });
            return true;
        } else {
            console.warn("Notification permission not granted");
            return false;
        }
    }
};

export default browserNotifications;
