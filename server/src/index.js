const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('../routes/userRoutes');
const serverRoutes = require('../routes/serverRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

app.use('/api-ui', userRoutes);
app.use('/api', serverRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
