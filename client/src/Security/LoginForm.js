// LoginForm.js

import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';
import { authenticate } from './Authentication';

const { Content } = Layout;

const LoginForm = () => {
  const [certificateDetails, setCertificateDetails] = useState({ cn: '', thumbprint: '' });
  const navigate = useNavigate();

  const handleRedirectToRegister = () => {
    navigate('/register');
  };

  useEffect(() => {
    const getCertificateDetails = async () => {
      const response = await fetch('/login');
      const thumbprint = response.headers.get('X-SSL-Client-Thumbprint');
      const dn = response.headers.get('X-SSL-Client-DN');
      if (dn) {
        const dnParts = dn.split(',');
        const cn = dnParts.find(part => part.startsWith('CN=')).split('=')[1];
        console.log(cn);
        console.log(thumbprint);
        setCertificateDetails({ cn, thumbprint });
      }
    };
    getCertificateDetails();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!certificateDetails.cn) {
      handleRedirectToRegister();
      return;
    }
    try {
      const token = await authenticate(certificateDetails.cn, certificateDetails.thumbprint);
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
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Request Access</h2>
          {certificateDetails.cn ? (
            <div>
              <p style={{ textAlign: 'center' }}>Click "Log In" to authenticate using your client certificate.</p>
              <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Selected Certificate: {certificateDetails.cn}</p>
              <button type="submit" className="login-form-submit-btn">Log In</button>
            </div>
          ) : (
            <div>
              <p style={{ textAlign: 'center' }}>You don't have a certificate associated with your account. Please visit the Register page to create a certificate.</p>
              <button type="button" className="login-form-submit-btn" onClick={handleRedirectToRegister} style={{ display: 'block', margin: '0 auto' }}>
                Register
              </button>
            </div>
          )}
        </form>
      </Content>
    </Layout>
  );
};

export default LoginForm;
