import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const appController = {};

appController.getStatus = async (req, res) => {
  try {
    console.log(` here ${redisClient}`);
    const isRedisAlive = redisClient.isAlive();
    const isDbAlive = await dbClient.isAlive();
    res.status(200).json({ redis: isRedisAlive, db: isDbAlive });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
appController.getStats = async (req, res) => {
  try {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    res.status(200).json({ users: nbUsers, files: nbFiles });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default appController;
