// Generates a consistent HSL color from a string
export const stringToColor = (str) => {
    if (!str) return '#ccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Use HSL for better pastel colors (Hue: 0-360, Saturation: 60-80%, Lightness: 60-70%)
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 65%)`;
};

// Extracts initials from a name (e.g. "Akdeniz Ticaret" -> "AT")
export const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
