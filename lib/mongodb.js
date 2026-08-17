import { MongoClient } from 'mongodb';

const DEFAULT_URI = "mongodb+srv://camilalosada29_db_user:pLl5v7hBbGpkOR47@cluster0.9gtunbm.mongodb.net/?appName=Cluster0";
const DB_NAME = 'Camila';
const COLLECTION_NAME = 'CamilaCalendar';

let cachedClient = global._mongoClient || null;
let cachedDb = global._mongoDb || null;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return { client: cachedClient, db: cachedDb, collection: cachedDb.collection(COLLECTION_NAME) };
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db(DB_NAME);

  global._mongoClient = client;
  global._mongoDb = db;

  cachedClient = client;
  cachedDb = db;

  return {
    client,
    db,
    collection: db.collection(COLLECTION_NAME)
  };
}
