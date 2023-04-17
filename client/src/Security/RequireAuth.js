// Security/RequireAuth.js

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function useCurrentUser(sessionToken, location) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const debouncedFetchCurrentUser = useRef(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionTokenParam = queryParams.get('sessionToken');
    if (sessionTokenParam) {
      sessionToken = sessionTokenParam;
      localStorage.setItem('sessionToken', sessionToken);
    }

    function isTokenExpiring() {
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      if (!tokenExpiration) return true;

      const expiresIn = new Date(tokenExpiration) - new Date();
      const bufferTime = 60000; // 1 minute buffer time
      return expiresIn <= bufferTime;
    }

    if (!sessionToken) {
      setLoading(false);
      return;
    }

    async function fetchCurrentUser(refreshOnly = false) {
      try {
        if (refreshOnly && !isTokenExpiring()) {
          return;
        }

        const token = localStorage.getItem('sessionToken');
        const response = await fetch('/api-ui/user/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('sessionToken');
            setAuthenticated(false);
            return;
          }
          throw new Error('Error fetching current user');
        }

        const data = await response.json();
        setCurrentUser(data);
        setAuthenticated(true);

        // Update the session token and expiration with the new ones
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('tokenExpiration', data.tokenExpiration);
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentUser();

    debouncedFetchCurrentUser.current = setTimeout(() => {
      fetchCurrentUser(true);
    }, 10000);

    return () => clearTimeout(debouncedFetchCurrentUser.current);
  }, [sessionToken, location, setCurrentUser]);

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
