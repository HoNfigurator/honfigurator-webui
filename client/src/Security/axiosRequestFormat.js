// axiosRequestFormat.js

import axios from 'axios';

export const axiosInstanceTest = axios.create({
  baseURL: '/api',
});

export const createAxiosInstanceServer = (selectedServer) => {
  console.log(selectedServer);
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

export const axiosInstanceServer = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
    },
  });
// export const axiosInstanceServer = axios.create({
//     baseURL: '/api',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer AfInA2tWLcdBM3r2tnBAgqCpM8ZPez`,
//     },
//   });

export const axiosInstanceUI = axios.create({
    baseURL: '/api-ui',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
    },
});