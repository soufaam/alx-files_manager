const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    let host = 'localhost';
    let port = '27017';
    this._dbName = 'files_manager';
    if (process.env.DB_HOST !== undefined) {
      host = process.env.DB_HOST;
    }
    if (process.env.DB_PORT !== undefined) {
      port = process.env.DB_PORT;
    }
    if (process.env.DB_DATABASE !== undefined) {
      this._dbName = process.env.DB_DATABASE;
    }
    const uri = `mongodb://${host}:${port}/${this._dbName}`;
    console.log(uri);
    this._client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  isAlive() {
    try {
      this._client.connect();
      return true;
    } catch (error) {
      return false;
    }
  }

  async nbUsers() {
    try {
      await this._client.connect();
      const db = this._client.db();
      const collection = db.collection('users');
      const count = await collection.countDocuments();
      return count;
    } catch (error) {
      console.error(error);
      return -1;
    } finally {
      await this._client.close();
    }
  }

  async nbFiles() {
    try {
      await this._client.connect();
      const db = this._client.db();
      const collection = db.collection('files');
      const count = await collection.countDocuments();
      return count;
    } catch (error) {
      console.error(error);
      return -1;
    } finally {
      await this._client.close();
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
