import dbClient from '../utils/db';

const crypto = require('crypto');

const usersController = {};
usersController.postNew = async (req, res) => {
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

export default usersController;
