import React, { useState } from 'react';
import { Layout, Tooltip } from 'antd';
import './LoginForm.css';
const { KEYUTIL, X509 } = require('jsrsasign');

const { Content } = Layout;

const Register = () => {
  const [username, setUsername] = useState('');
  const [inputError, setInputError] = useState('');

  const generateScript = (username, pemCert) => {
    const currentUrl = window.location.href;
    const scriptContent = `
      $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromCertFile("data:text/plain;base64,${btoa(pemCert)}")
      $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("CurrentUser\\My", "LocalMachine")
      $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
      $store.Add($cert)
      $store.Close()
      `;
    const scriptBlob = new Blob([scriptContent], { type: 'application/x-powershell-script' });
    const scriptUrl = URL.createObjectURL(scriptBlob);
    const a = document.createElement('a');
  };

  const generateCertificate = (username) => {
    // Generate a new key pair
    const keyPair = KEYUTIL.generateKeypair('RSA', 2048);

    // Create a new X.509 certificate
    const cert = new X509();

    // Set the subject name and public key
    cert.setSubjectRFC2253(`CN=${username}`);
    cert.setPublicKey(keyPair.pubKeyObj);

    // Set the validity period
    const now = new Date();
    const end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    cert.setNotBefore(now);
    cert.setNotAfter(end);

    // Sign the certificate with the private key
    cert.sign(keyPair.prvKeyObj, 'sha256');

    // Convert the certificate to PEM format
    const pemCert = cert.getPEMString();

    // Get the certificate's SHA-1 fingerprint
    const sha1Thumbprint = cert.getFingerprint('sha1').replace(/:/g, '').toLowerCase();

    // Get the certificate's SHA-256 fingerprint
    const sha256Thumbprint = cert.getFingerprint('sha256').replace(/:/g, '').toLowerCase();

    // Return the PEM-encoded certificate and thumbprint
    return { pemCert, sha1Thumbprint, sha256Thumbprint };
  };

  const handleGenerateCertificate = () => {
    const { pemCert, sha256Thumbprint } = generateCertificate(username);
    localStorage.setItem('certificate', pemCert);
    localStorage.setItem('thumbprint', sha256Thumbprint);
  };

  const handleRegister = async () => {
    const thumbprint = localStorage.getItem('thumbprint');
    const username = localStorage.getItem('username');
    if (thumbprint && username) {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, thumbprint })
      });
      if (response.ok) {
        // Redirect to login page
        window.location.href = '/login';
      } else {
        throw new Error('Failed to register user');
      }
    }
  };

    return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Content className="login-form-content">
        <form className="login-form">
            
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Register</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Enter your username and click "Generate Certificate" to create a new client certificate.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Tooltip title={inputError} visible={!!inputError} color="#f5222d">
                <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                    setUsername(value);
                    setInputError(value === e.target.value ? '' : 'Special characters and spaces are not allowed.');
                }}
                style={{
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '0.25rem',
                    width: '200px',
                    textAlign: 'center',
                }}
                />
            </Tooltip>
            </div>
            <button type="button" className="login-form-submit-btn" onClick={handleGenerateCertificate} style={{ display: 'block', margin: '0 auto' }}>
            Generate Certificate
            </button>
        </form>
        </Content>
    </Layout>
    );
  
};

export default Register;