import api from './api';

const VAPID_PUBLIC_KEY = 'BOJ743ZfcZWdjVKL0SDD4TwB_YelkgRpPOFvx41J1cWJDAMXzV8gMZmDUvtOuBaRXqV-_ZlsS68qVA_G7cBphfQ';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeToPush = async () => {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported');
            return;
        }

        // Request permission if not already granted
        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        
        // Subscribe
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // Send to server
        await api.post('/notifications/subscribe', { subscription });
        console.log('Push subscription successful');
    } catch (err) {
        console.error('Push subscription failed:', err);
    }
};
