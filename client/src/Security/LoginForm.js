import React from 'react';
import { Layout, Alert } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginForm.css';
import discordLogo from '../images/discord-logo.png';
import { useAuthenticatedState } from './RequireAuth';

const { Content } = Layout;

const LoginForm = ({ stateMessage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('sessionToken');
  const { setAuthenticated } = useAuthenticatedState(token, location);

  const LoginWithDiscordButton = () => {
    const clientId = '1096750568388702228';
    const redirectUri = encodeURIComponent('http://localhost:3001/api-ui/user/auth/discord/callback');
    const scope = encodeURIComponent('identify email');
    const sessionToken = localStorage.getItem('sessionToken');

    const handleClick = (event) => {
      event.preventDefault();

      if (sessionToken) {
        // Try to reauthenticate
        fetch('/api-ui/user/reauth', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            const { sessionToken, tokenExpiry } = data;
            if (sessionToken) {
              localStorage.setItem('sessionToken', sessionToken);
              localStorage.setItem('tokenExpiry', tokenExpiry);
              setAuthenticated(true);
              navigate('/');
            } else {
              // Session could not be reauthenticated, redirect to Discord OAuth2
              window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
            }
          })
          .catch((error) => console.error(error));
      } else {
        // No session token found, redirect to Discord OAuth2
        window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
      }
    };
    
    return (
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={(event) => handleClick(event)}
          className="login-form-discord-btn"
          style={{ margin: '0 auto' }}
        >
          <img src={discordLogo} alt="Discord Logo" className="discord-logo" />
          Login with Discord
        </button>
      </div>
    );
    
  }

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content className="login-form-content">
        <form className="login-form">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Log In</h2>
          {stateMessage && <Alert message={stateMessage} type="info" />}
          <LoginWithDiscordButton />
        </form>
      </Content>
    </Layout>
  );  
};

export default LoginForm;
