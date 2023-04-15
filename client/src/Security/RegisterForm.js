import React, { useState } from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

const { Content } = Layout;

const RegisterForm = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api-ui/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.status === 201) {
        alert('User account successfully created');
        navigate('/login');
      } else {
        alert('Error creating user account');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating user account');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content className="login-form-content">
        <form onSubmit={handleSubmit} className="login-form">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Register</h2>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="login-form-input"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
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
          <button type="submit" className="login-form-submit-btn">Register</button>
        </form>
      </Content>
    </Layout>
  );
};

export default RegisterForm;