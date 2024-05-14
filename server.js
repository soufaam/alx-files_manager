const express = require('express');
const endpoints = require('./routes');

const app = express();
const port = process.env.PORT || 5000;

app.use('/', endpoints);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
