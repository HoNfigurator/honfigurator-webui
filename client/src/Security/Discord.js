import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function DiscordCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function handleDiscordCallback() {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');

      if (!code) {
        navigate('/login');
        return;
      }

      try {
        // Call your backend to exchange the code for an access token and handle the user data
        await fetch('/api-ui/user/auth/discord/callback?code=' + code);
        navigate('/'); // Redirect to the main page or dashboard
      } catch (error) {
        console.error('Error during Discord OAuth2:', error);
        navigate('/login');
      }
    }

    handleDiscordCallback();
  }, [navigate, location]);

  return <div>Processing Discord login...</div>;
}

export default DiscordCallback;