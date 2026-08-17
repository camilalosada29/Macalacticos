import { MongoClient } from 'mongodb';
import dns from 'dns';

// Solamente aplicar DNS estático en desarrollo local Windows si no estamos en Vercel
if (process.platform === 'win32' && !process.env.VERCEL && !process.env.AWS_REGION) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch {
    // Ignorar si el entorno local no lo permite
  }
}

const DEFAULT_URI = "mongodb+srv://camilalosada29_db_user:pLl5v7hBbGpkOR47@cluster0.9gtunbm.mongodb.net/?appName=Cluster0";
const DB_NAME = 'Camila';
const COLLECTION_NAME = 'CamilaCalendar';

let cachedClient = global._mongoClient;
let cachedDb = global._mongoDb;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb, collection: cachedDb.collection(COLLECTION_NAME) };
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000,
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
