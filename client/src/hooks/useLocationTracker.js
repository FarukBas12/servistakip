import { useEffect } from 'react';
import api from '../utils/api';

const useLocationTracker = (user) => {
    useEffect(() => {
        if (!user || user.role !== 'technician') return;

        let watchId;

        const updatePosition = async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                await api.post('/auth/update-location', { 
                    lat: latitude, 
                    lng: longitude 
                });
                console.log('Location updated live');
            } catch (err) {
                console.error('Failed to update location:', err);
            }
        };

        const handleError = (error) => {
            console.error('Location error:', error.message);
        };

        // Get initial position
        navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
            enableHighAccuracy: true
        });

        // Watch position continuosly
        watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
            enableHighAccuracy: true,
            distanceFilter: 50 // Update only if moved 50 meters
        });

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [user]);

    return null;
};

export default useLocationTracker;
