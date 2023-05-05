// axiosRequestFormat.js
import axios from 'axios';

export const axiosInstanceTest = axios.create({
  baseURL: '/api',
});

export const createAxiosInstanceServer = (selectedServerValue, selectedServerPort) => {
  // console.log(`Selected server is: ${selectedServer}`);
  return axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
      'selected-server': selectedServerValue,
      'selected-port': selectedServerPort,
      Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
    },
    cache: false,
  });
};

export const axiosInstanceUI = axios.create({
  baseURL: '/api-ui',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstanceUI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);