// axiosRequestFormat.js
import axios from 'axios';
import { getSessionToken, setSessionToken } from './tokenManager';

export const axiosInstanceTest = axios.create({
  baseURL: '/api',
});

export const createAxiosInstanceServer = (selectedServerValue, selectedServerPort) => {
  return axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
      'selected-server': selectedServerValue,
      'selected-port': selectedServerPort,
      Authorization: `Bearer ${getSessionToken()}`,
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
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
