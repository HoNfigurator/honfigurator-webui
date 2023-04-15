// Authentication.js

export const authenticate = async (username, password) => {
  const response = await fetch('/api-ui/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  return data.token;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};
