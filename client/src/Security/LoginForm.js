import React, { useState } from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';
import { authenticate } from './Authentication';

const { Content } = Layout;

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRedirectToRegister = () => {
    navigate('/register');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = await authenticate(formData.username, formData.password);
      localStorage.setItem('token', token);
      window.location.href = '/';
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content className="login-form-content">
        <form onSubmit={handleSubmit} className="login-form">
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
        </form>
      </Content>
    </Layout>
  );
};

export default LoginForm;
