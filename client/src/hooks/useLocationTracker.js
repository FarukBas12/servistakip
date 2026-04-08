import { useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const useLocationTracker = (user) => {
    useEffect(() => {
        if (!user) return;
        
        // Check role case-insensitively or for 'technician'
        const isTech = user.role?.toLowerCase() === 'technician';
        if (!isTech) return;

        let watchId;

        const updatePosition = async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                await api.post('/auth/update-location', { 
                    lat: latitude, 
                    lng: longitude 
                });
                console.log('Location updated live:', latitude, longitude);
                // toast.success('Konum güncellendi', { id: 'loc-update', duration: 1000 }); // Optional feedback
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
