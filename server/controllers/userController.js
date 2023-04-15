// server/src/controllers/userController.js
let users = [];

const verifyUserCredentials = async (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
  
    if (user) {
      // If the user is found, generate a JWT or another type of token.
      // For this example, we'll just return a dummy token.
      const token = 'your-token-here';
      return token;
    } else {
      return null;
    }
  };

const createUser = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newUser = {
    id: users.length + 1,
    username,
    email,
    password,
  };

  users.push(newUser);
  res.status(201).json(newUser);
};

export const authenticateUser = async (req, res) => {
    const { username, password } = req.body;
    try {
      const token = await verifyUserCredentials(username, password);
      if (token) {
        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

module.exports = { createUser, authenticateUser };
