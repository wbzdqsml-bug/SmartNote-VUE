import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL,
  timeout: 10000
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  }
);

export default client;
