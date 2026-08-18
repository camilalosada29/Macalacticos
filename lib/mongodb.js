import { MongoClient } from 'mongodb';

const DB_NAME = 'Camila';
const COLLECTION_NAME = 'CamilaCalendar';

let cachedClient = global._mongoClient || null;
let cachedDb = global._mongoDb || null;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI no está definida. ' +
      'Local: crea un archivo .env con MONGODB_URI=tu_uri. ' +
      'Vercel: agrégala en Settings > Environment Variables.'
    );
  }

  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return { client: cachedClient, db: cachedDb, collection: cachedDb.collection(COLLECTION_NAME) };
    } catch {
      cachedClient = null;
      cachedDb = null;
      global._mongoClient = null;
      global._mongoDb = null;
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
