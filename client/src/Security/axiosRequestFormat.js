import axios from 'axios';

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