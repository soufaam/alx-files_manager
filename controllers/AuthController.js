import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');

const AuthController = {};

AuthController.getConnect = async (req, res) => {
  const { headers } = req;
  console.log(headers);
  const base64Credentials = headers.authorization.split(' ')[1];
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [email, password] = decodedCredentials.split(':');
  if (password) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(password);
    const newHashedPassword = sha1.digest('hex');
    const user = await dbClient._client.collection('users').findOne({ email });
    if (user && user.password === newHashedPassword) {
      const token = uuidv4();
      const key = `auth_${token}`;
      const now = new Date();
      const expiryTime = now.getTime() + (24 * 60 * 60 * 1000);
      console.log(user._id);
      await redisClient.set(key, user._id.toString(), expiryTime);
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

AuthController.getDisconnect = async (req, res) => {
  const { headers } = req;
  console.log(headers);
  const token = headers['x-token'];
  const key = `auth_${token}`;
  redisClient.get(key)
    .then((value) => {
      if (value) {
        console.log(value);
        redisClient.del(key);
        res.status(204).send();
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    })
    .catch(() => {
      res.status(401).json({ error: 'Unauthorized' });
    });
};

export default AuthController;
