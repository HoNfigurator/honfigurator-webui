// LoginForm.js

import React, { useState, useEffect } from 'react';
import { authenticate } from './Authentication';
import { Layout } from 'antd';
import { KJUR, KEYUTIL } from 'jsrsasign';
import './LoginForm.css';

const { Content } = Layout;

const LoginForm = () => {
  const [certificateDetails, setCertificateDetails] = useState({ cn: '', thumbprint: '' });
  const [csr, setCsr] = useState('');
  const [token, setToken] = useState('');

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

  const generateCSR = async () => {
    console.log('Generating CSR...');
    const keyPair = KEYUTIL.generateKeypair('RSA', 2048);
    const csr = new KJUR.asn1.csr.CertificationRequest({
      name: [{ type: 'CN', value: 'example.com' }],
      sbjpubkey: keyPair.pubKeyObj,
      sigalg: 'SHA256withRSA',
      sbjprvkey: keyPair.prvKeyObj,
    });
    const csrPEM = csr.getPEM();
    console.log('CSR generated:', csrPEM);
    setCsr(csrPEM);
    return csrPEM;
  };
  
  const handleGenerateCSR = async () => {
    await generateCSR();
  };
  
  const handleRequestCertificate = async () => {
    const csrBase64 = btoa(csr);
    const response = await fetch(`/sign?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pkcs10' },
      body: csrBase64,
    });
    if (response.ok) {
      const data = await response.json();
      alert(`Certificate request submitted successfully. Your certificate serial number is ${data.serialNumber}.`);
    } else {
      const error = await response.json();
      alert(`Error submitting certificate request: ${error.message}`);
    }
  };
  
  

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = await authenticate(certificateDetails.cn, certificateDetails.thumbprint);
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
          {certificateDetails.cn ? (
            <div>
              <p>Click "Log In" to authenticate using your client certificate.</p>
              <p>Selected Certificate: {certificateDetails.cn}</p>
              <button type="submit" className="login-form-submit-btn">Log In</button>
            </div>
          ) : (
            <div>
              {csr ? (
                <div>
                  <p>Enter your one-time token and click "Submit" to request a certificate.</p>
                  <p>CSR:</p>
                  <p>{csr}</p>
                  <input type="text" placeholder="One-time token" value={token} onChange={(e) => setToken(e.target.value)} />
                  <button type="button" className="login-form-submit-btn" onClick={handleRequestCertificate}>
                    Submit
                  </button>
                </div>
              ) : (
                <div>
                  <p>Click "Request Certificate" to generate a CSR.</p>
                  <button type="button" className="login-form-submit-btn" onClick={handleGenerateCSR}>
                    Request Certificate
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </Content>
    </Layout>
  );
  
};

export default LoginForm;