// Authentication.js

const users = [
  {
    thumbprint: '5bb5be268adf28236f15a6ceec41b95dd443d4ac',
    username: 'Frank',
  },
  {
    thumbprint: '0h9g8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a',
    username: 'user2',
  },
];

export const authenticate = async (cn,thumbprint) => {
  console.log('thumbprint:', thumbprint); // Add this line to log the value of the ski variable
  const user = users.find((user) => user.thumbprint === thumbprint);

  if (user) {
    const response = await fetch('/api/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username }), // Authenticate using the matched user's username
    });
    const data = await response.json();
    return data.token;
  } else {
    throw new Error('Authentication failed: no matching user account found.');
  }
};


export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};