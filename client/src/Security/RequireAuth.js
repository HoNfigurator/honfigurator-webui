// Security/RequireAuth.js

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosInstanceUI } from './axiosRequestFormat';

function useCurrentUser(sessionToken, location) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const debouncedFetchCurrentUser = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const sessionTokenFromQuery = queryParams.get('sessionToken');
  const tokenExpiryFromQuery = queryParams.get('tokenExpiry');

  useEffect(() => {
    if (sessionTokenFromQuery) {
      localStorage.setItem('sessionToken', sessionTokenFromQuery);
    }
    if (tokenExpiryFromQuery) {
      localStorage.setItem('tokenExpiry', tokenExpiryFromQuery);
    }

    const storedSessionToken = localStorage.getItem('sessionToken') || sessionToken;

    if (!storedSessionToken) {
      console.log("no sessionToken, leaving");
      setLoading(false);
      setAuthenticated(false);
      return;
    }
  
    function isTokenExpiring(tokenExpiry) {
      const expiresIn = new Date(tokenExpiry) - new Date();
      const bufferTime = 60000; // 1 minute buffer time
      return expiresIn <= bufferTime;
    }

    async function fetchCurrentUser() {
      try {
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!tokenExpiry) {
          console.log("no expiry token in storage.")
          setAuthenticated(false);
          return;
        }
        
        if (!isTokenExpiring(tokenExpiry)) {
          setAuthenticated(true);
          return;
        }

        
        console.log(`Token is expiring: ${tokenExpiry}`)
    
        const token = localStorage.getItem('sessionToken') || storedSessionToken;

        const response = await axiosInstanceUI.post('/user/refresh', {}, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const data = response.data;
          setCurrentUser(data);
          setAuthenticated(true);
        
          // Update the session token and expiration with the new ones
          localStorage.setItem('sessionToken', data.sessionToken);
          localStorage.setItem('tokenExpiry', data.tokenExpiry);
        } else {
          console.log(response);
          if (response.status === 401) {
            localStorage.removeItem('sessionToken');
            setAuthenticated(false);
            return;
          }
          throw new Error('Error fetching current user');
        }

        // Update the session token and expiration with the new ones
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('tokenExpiry', data.tokenExpiry);
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentUser();

    debouncedFetchCurrentUser.current = setInterval(() => {
      fetchCurrentUser();
    }, 10000);

    return () => clearInterval(debouncedFetchCurrentUser.current);
  }, [sessionToken, location, setCurrentUser, sessionTokenFromQuery, tokenExpiryFromQuery]);

  return { loading, authenticated, currentUser, setAuthenticated };
}

export function useAuthenticatedState(sessionToken, location) {
  const userState = useCurrentUser(sessionToken, location);
  return userState; // Return the entire userState object
}

function RequireAuth({ component: Component, sessionToken, ...rest }) {
  const location = useLocation();
  const { loading, authenticated, currentUser } = useCurrentUser(sessionToken, location);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authenticated) {
      navigate('/login', { replace: true });
    }
  }, [loading, authenticated, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return null;
  }

  return <Component currentUser={currentUser} {...rest} />;
}

export default RequireAuth;