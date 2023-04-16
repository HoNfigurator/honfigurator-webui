// RequireAuth.js

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function useCurrentUser(sessionToken, location) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionTokenParam = queryParams.get('sessionToken');
    if (sessionTokenParam) {
      localStorage.setItem('sessionToken', sessionTokenParam);
      sessionToken = sessionTokenParam;
    }

    if (!sessionToken) {
      setLoading(false);
      return;
    }

    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem('sessionToken');
        const response = await fetch('/api-ui/user/current', {
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
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    }
    

    fetchCurrentUser();
  }, [sessionToken, location, setCurrentUser]);

  return { loading, authenticated, currentUser };
}

export function useAuthenticatedState(sessionToken, location) {
  const { authenticated } = useCurrentUser(sessionToken, location);
  return authenticated;
}

function RequireAuth({ component: Component, sessionToken, ...rest }) {
  const location = useLocation();
  const { loading, authenticated, currentUser } = useCurrentUser(sessionToken, location);
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  return <Component currentUser={currentUser} {...rest} />;
}

export default RequireAuth;
