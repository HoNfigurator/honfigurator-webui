// hooks/useFetchUserInfo.js
import { useState, useEffect } from 'react';
import { axiosInstanceUI } from '../Security/axiosRequestFormat'; // Import your axios instance

export const useFetchUserInfo = (shouldFetch) => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstanceUI.get('/user/info');
        setUserInfo(response.data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    if (shouldFetch) {
      fetchUserInfo();
    }
  }, [shouldFetch]);

  return userInfo;
};