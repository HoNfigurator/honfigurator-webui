// RequireAuth.js

import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth = (WrappedComponent) => {
  const WithAuth = (props) => {
    console.log('WithAuth rendered');
    const token = localStorage.getItem('token');
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return <WrappedComponent {...props} />;
  };
  return WithAuth;
};

export default RequireAuth;
