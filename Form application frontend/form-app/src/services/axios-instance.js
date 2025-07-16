// src/services/axios-instance.js
import axios from 'axios';
import { getAxiosMainTabStatus, setAxiosMultipleTabsDetectedCallback } from '../Utils/useSingleTabEnforcer'; // Import the status getter

// Create an Axios instance
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api', // Your backend API base URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the JWT token to headers and check tab status
axiosInstance.interceptors.request.use(
    (config) => {
        // Check if this tab is the main active tab before making a request
        if (!getAxiosMainTabStatus()) {
            console.warn('Axios Interceptor: Request blocked. This is not the main active tab.');
            // Trigger the callback registered by useSingleTabEnforcer
            if (setAxiosMultipleTabsDetectedCallback) {
                setAxiosMultipleTabsDetectedCallback();
            }
            return Promise.reject(new axios.Cancel('Request cancelled: Not the main active tab.'));
        }

        try {
            const user = JSON.parse(localStorage.getItem('user')); // Get user data from localStorage
            const token = user ? user.token : null; // Extract the token

            if (token) {
                // If a token exists, add it to the Authorization header
                config.headers.Authorization = `Bearer ${token}`;
                console.log('Axios Interceptor: Token attached to request headers.');
            } else {
                console.log('Axios Interceptor: No token found in localStorage for this request.');
            }
        } catch (e) {
            console.error('Axios Interceptor Error parsing user from localStorage:', e);
        }
        return config;
    },
    (error) => {
        // Handle request errors
        console.error('Axios Interceptor Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor (optional, but good for handling 401/403 globally)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the error is due to a cancelled request (our own cancellation)
        if (axios.isCancel(error)) {
            console.log('Axios Interceptor: Request was cancelled:', error.message);
            return Promise.reject(error); // Re-throw the cancellation
        }

        // If a 401 or 403 response is received, it might mean the token is expired or invalid
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error('Axios Interceptor: Authentication error (401/403). Token expired or invalid. Logging out...');
            localStorage.removeItem('user'); // Clear invalid user data
            // The App.jsx's onLogout will handle the redirect.
            // window.location.href = '/login'; // You could force redirect here if needed
        }
        console.error('Axios Interceptor Response Error:', error);
        return Promise.reject(error);
    }
);

export default axiosInstance;
