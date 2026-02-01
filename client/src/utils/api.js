import axios from 'axios';

const api = axios.create({
    baseURL: 'https://servistakip-backend.onrender.com/api',
    timeout: 300000, // 5 minutes timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    error => Promise.reject(error)
);

export default api;
