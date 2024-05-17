// Security/RequireAuth.js

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosInstanceUI } from './axiosRequestFormat';
import { clearSessionToken, clearTokenExpiry, getSessionToken, getTokenExpiry, setSessionToken, setTokenExpiry } from './tokenManager';

function useCurrentUser(sessionToken, location) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const debouncedFetchCurrentUser = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const sessionTokenFromQuery = queryParams.get('sessionToken');
  const tokenExpiryFromQuery = queryParams.get('tokenExpiry');

  useEffect(() => {
    // setSessionToken(sessionTokenFromQuery);

    // if (localStorage.getItem('cookieConsent') === 'true') {
      if (sessionTokenFromQuery) {
        // localStorage.setItem('sessionToken', sessionTokenFromQuery);
        setSessionToken(sessionTokenFromQuery);
      }
      if (tokenExpiryFromQuery) {
        setTokenExpiry(tokenExpiryFromQuery);
      }
    // }

    // const storedSessionToken = getSessionToken() || sessionTokenFromQuery;
    // const storedTokenExpiry = getTokenExpiry() || tokenExpiryFromQuery;

    if (!getSessionToken()) {
      console.log("no sessionToken, leaving");
      setLoading(false);
      setAuthenticated(false);
    }

    // setSessionToken(storedSessionToken);
  
    function isTokenExpiring(tokenExpiry) {
      const expiresIn = new Date(tokenExpiry) - new Date();
      const bufferTime = 60000; // 1 minute buffer time
      return expiresIn <= bufferTime;
    }

    async function fetchCurrentUser() {
      try {
        const tokenExpiry = getTokenExpiry();
        if (!tokenExpiry) {
          // console.log("no expiry token in storage.")
          setAuthenticated(false);
          return;
        }
        
        if (!isTokenExpiring(tokenExpiry)) {
          // console.log(`Token ${sessionToken} is not expiring`)
          setAuthenticated(true);
          return;
        }

        
        // console.log(`Token is expiring: ${tokenExpiry}`)
        const token = getSessionToken();

        try {
          const response = await axiosInstanceUI.post('/user/refresh', {}, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.status === 200) {
            const data = response.data;
            setCurrentUser(data);
            // console.log("Obtained new session token. Data:")
            // console.log(data);
            setAuthenticated(true);
          
            // Update the session token and expiration with the new ones
            setSessionToken(data.sessionToken);
            setTokenExpiry(data.tokenExpiry);
          } 
        } catch(error) {
          if (error.response.status === 401) {
            // localStorage.removeItem('sessionToken');
            clearSessionToken();
            // localStorage.removeItem('tokenExpiry')
            clearTokenExpiry();
            setAuthenticated(false);
            // return;
          } else {
            throw new Error('Error fetching current user');
          }
        }

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

export function useAuthenticatedState(sessionToken, location = window.location) {
  const userState = useCurrentUser(sessionToken, location);
  return userState; // Return the entire userState object
}

function RequireAuth({ component: Component, sessionToken, ...rest }) {
  const location = useLocation();
  const { loading, authenticated, currentUser, setAuthenticated } = useCurrentUser(sessionToken, location);
  const navigate = useNavigate();

  useEffect(() => {
  if (!loading && !authenticated) {
    // localStorage.removeItem('sessionToken');
    clearSessionToken();
    // localStorage.removeItem('tokenExpiry');
    clearTokenExpiry();
    setAuthenticated(false);
    console.log(`Logging out. Session token: ${sessionToken}`);
    navigate('/login', { replace: true });
  }
}, [loading, authenticated, navigate, setAuthenticated]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return null;
  }

  return <Component currentUser={currentUser} {...rest} />;
}

export default RequireAuth;