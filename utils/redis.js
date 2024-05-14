import redis from 'redis';

class RedisClient {
  constructor() {
    this._client = redis.createClient();
    this._client.on('error', (error) => {
      console.log(error);
    });
  }

  isAlive() {
    try {
      return this._client.ping();
    } catch (error) {
      return false;
    }
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this._client.get(key, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this._client.set(key, value, 'EX', duration);
      resolve(value);
      this._client.on('error', (error) => {
        reject(error);
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      resolve(this._client.del(key));
      this._client.on('error', (error) => {
        reject(error);
      });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
