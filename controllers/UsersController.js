import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UserController = {};
UserController.postNew = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
  }
  try {
    const user = await dbClient._client.collection('users').findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
    } else {
      const sha1 = crypto.createHash('sha1');
      sha1.update(password);
      const hashedPassword = sha1.digest('hex');
      const result = await dbClient._client.collection('users').insertOne({ email, password: hashedPassword });
      res.status(201).json({ id: result.insertedId, email });
    }
  } catch (err) {
    res.status(400).json({ error: 'Can not connect to Db' });
  }
};

UserController.getMe = async (req, res) => {
  const { headers } = req;
  console.log(headers);
  const token = headers['x-token'];
  const key = `auth_${token}`;
  console.log(key);
  redisClient.get(key)
    .then(async (value) => {
      if (value) {
        console.log(value);
        const user = await dbClient._client.collection('users').findOne({ _id: ObjectId(value) });
        console.log(user);
        res.status(200).json({ email: user.email, id: user._id });
      }
    })
    .catch(() => {
      res.status(401).json({ error: 'Unauthorized' });
    });
};
export default UserController;
