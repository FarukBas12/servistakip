const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Helper to extract coords from final URL
const extractCoords = (url) => {
    try {
        // Regex for standard coordinates (e.g. @39.123,32.456)
        const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const atMatch = url.match(atRegex);
        if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

        // Regex for q=lat,lng
        const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
        const qMatch = url.match(qRegex);
        if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

        // Regex for plain lat,lng
        const plainRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
        const plainMatch = url.match(plainRegex);
        if (plainMatch) return { lat: parseFloat(plainMatch[1]), lng: parseFloat(plainMatch[2]) };

        // Regex for !3d (Google Maps embed style) if needed
        const d3Regex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
        const d3Match = url.match(d3Regex);
        if (d3Match) return { lat: parseFloat(d3Match[1]), lng: parseFloat(d3Match[2]) };

        return null;
    } catch (e) {
        return null;
    }
};

router.post('/resolve', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL required' });

        // Simple fetch with redirect follow
        // User-Agent is important for Google Maps sometimes
        const response = await fetch(url, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const finalUrl = response.url;
        console.log('Original URL:', url);
        console.log('Resolved URL:', finalUrl);

        const coords = extractCoords(finalUrl);

        if (coords) {
            res.json({ success: true, ...coords, resolvedUrl: finalUrl });
        } else {
            // Fallback: Sometimes the page HTML contains the meta tags with coords
            // For now, return fail but with resolved url so client can try? 
            // Or just return fail.
            res.status(404).json({ error: 'Coordinates not found in resolved URL', resolvedUrl: finalUrl });
        }

    } catch (err) {
        console.error('Map resolve error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
