// LoginForm.js

import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginForm.css';

const { Content } = Layout;

const LoginForm = ({ onAuthenticate }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRedirectToRegister = () => {
    navigate('/register');
  };

  const handleAuthenticate = async () => {
    const sessionTokenParam = new URLSearchParams(location.search).get('sessionToken');
    if (sessionTokenParam) {
      localStorage.setItem('sessionToken', sessionTokenParam);
      navigate('/');
      return;
    }
  
    try {
      const token = await onAuthenticate(formData.username, formData.password);
      localStorage.setItem('sessionToken', token);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  function LoginWithDiscordButton() {
    const clientId = '1096750568388702228';
    const redirectUri = encodeURIComponent('http://localhost:3001/api-ui/user/auth/discord/callback');
    const scope = encodeURIComponent('identify email');
  
    const handleClick = () => {
      window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    };
  
    return <button onClick={handleClick}>Login with Discord</button>;
  }

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content className="login-form-content">
        <form onSubmit={(event) => {
          event.preventDefault();
          handleAuthenticate();
        }} className="login-form">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Log In</h2>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="login-form-input"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="login-form-input"
          />
          <button type="submit" className="login-form-submit-btn">Log In</button>
          <button
            type="button"
            className="login-form-submit-btn"
            onClick={handleRedirectToRegister}
            style={{ display: 'block', margin: '0 auto', marginTop: '1rem' }}
          >
            Register
          </button>
          <LoginWithDiscordButton />
        </form>
      </Content>
    </Layout>
  );
};

export default LoginForm;
