// src/services/axios-instance.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api/', // This is crucial!
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user')); // Get the stored user object
    if (user && user.token) {
      config.headers['Authorization'] = 'Bearer ' + user.token; // Add the JWT to the header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;