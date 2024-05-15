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
    const uri = `mongodb://${host}:${port}`;
    console.log(uri);
    MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
      if (err) {
        this._client = false;
      } else {
        this._client = client.db(this._dbName);
      }
    });
  }

  isAlive() {
    return !!this._client;
  }

  async nbUsers() {
    return this._client.collection('users').countDocuments();
  }

  async nbFiles() {
    return this._client.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
