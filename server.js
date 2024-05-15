import express from 'express';
import endpoints from './routes';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', endpoints);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
