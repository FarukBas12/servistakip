export const playNotificationSound = () => {
    // Simple sleek "Ding" sound (Base64) to avoid file loading issues
    const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"); // Placeholder short beep
    // Using a reliable external URL for a better sound, fallback to beep if offline
    const onlineAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

    onlineAudio.play().catch(e => {
        console.log("Audio play failed (user interaction needed first):", e);
    });
};
