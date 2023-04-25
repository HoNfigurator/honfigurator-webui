// hooks/useAxiosInstanceServer.js
import { useContext } from 'react';
import axios from 'axios';
import { SelectedServerValueContext } from '../App';

const useAxiosInstanceServer = () => {
  const selectedServer = useContext(SelectedServerValueContext);

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

export default useAxiosInstanceServer;
