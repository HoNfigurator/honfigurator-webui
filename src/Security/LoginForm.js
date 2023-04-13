import React, { useState } from 'react';
import { authenticate } from './Authentication';
import { Layout } from 'antd';
import './LoginForm.css';

const { Content } = Layout;

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = await authenticate(email, password);
      localStorage.setItem('token', token);
      window.location.href = '/';
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content className="login-form-content">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Login</h2>
          <div className="login-form-item">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="login-form-item">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <button type="submit" className="login-form-submit-btn">Log In</button>
        </form>
      </Content>
    </Layout>
  );
};

export default LoginForm;
