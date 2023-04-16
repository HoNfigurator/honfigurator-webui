// server/src/index.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('../routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use('/api-ui', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
