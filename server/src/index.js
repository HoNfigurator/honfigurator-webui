// server/src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('../routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use('/api-ui/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
