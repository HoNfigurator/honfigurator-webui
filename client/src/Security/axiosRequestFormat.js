// axiosRequestFormat.js
import axios from 'axios';

export const axiosInstanceTest = axios.create({
  baseURL: '/api',
});

export const createAxiosInstanceServer = (selectedServer) => {
  console.log(`Selected server is: ${selectedServer}`);
  return axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
      'selected-server': selectedServer,
      Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
    },
    cache: false,
  });
};

export const axiosInstanceUI = axios.create({
    baseURL: '/api-ui',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
    },
});