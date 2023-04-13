// Authentication.js

export const authenticate = async (email, password) => {
  const response = await fetch('/api/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return data.token;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};
