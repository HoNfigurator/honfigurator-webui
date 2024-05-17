// CookieConsent.js
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';

const CookieConsent = ({ onAccept }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setVisible(false);
    onAccept(); // Initialize RUM or other analytics tools here
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'false');
    setVisible(false);
  };

  return (
    <Modal
      title="We use cookies"
      visible={visible}
      footer={[
        <Button key="decline" onClick={handleDecline}>
          Decline
        </Button>,
        <Button key="accept" type="primary" onClick={handleAccept}>
          Accept
        </Button>,
      ]}
    >
      <p>
        We use cookies to enhance your experience on our website. By clicking "Accept", you consent to the use of cookies.
      </p>
      <p>
      We also use Real User Monitoring (RUM) to collect information about user interactions with our website to improve performance and user experience. This data is retained for 30 days and does not include personal information. See our <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> for more information.
      </p>
    </Modal>
  );
};

export default CookieConsent;
