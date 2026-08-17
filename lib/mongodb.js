import { MongoClient } from 'mongodb';

const DB_NAME = 'Camila';
const COLLECTION_NAME = 'CamilaCalendar';

let cachedClient = global._mongoClient;
let cachedDb = global._mongoDb;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno (.env o Vercel)');
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb, collection: cachedDb.collection(COLLECTION_NAME) };
  }

  const client = new MongoClient(uri, {
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
