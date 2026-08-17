import { MongoClient } from 'mongodb';

// Configuración de MongoDB Atlas
const DEFAULT_URI = "mongodb+srv://camilalosada29_db_user:pLl5v7hBbGpkOR47@cluster0.9gtunbm.mongodb.net/?appName=Cluster0";
const DB_NAME = 'Camila';
const COLLECTION_NAME = 'CamilaCalendar';

let cachedClient = global._mongoClient || null;
let cachedDb = global._mongoDb || null;

async function connectToDatabase() {
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

const DEFAULT_TEAM = [
  { id: 1, name: 'Camila Losada', role: 'Project Manager', avatar: 'CL', color: '#E91E63', status: 'online' },
  { id: 2, name: 'Angie Tatiana', role: 'Desarrolladora', avatar: 'AT', color: '#9C27B0', status: 'online' },
  { id: 3, name: 'Brayan Garavito', role: 'Desarrollador', avatar: 'BG', color: '#3F51B5', status: 'busy' },
  { id: 4, name: 'Diego Ulloa', role: 'Desarrollador', avatar: 'DU', color: '#00BCD4', status: 'online' },
  { id: 5, name: 'Johan Colmenares', role: 'QA Tester', avatar: 'JC', color: '#4CAF50', status: 'online' },
  { id: 6, name: 'Juan Soler', role: 'Backend Dev', avatar: 'JS', color: '#FF9800', status: 'online' },
  { id: 7, name: 'Juan Guerrero', role: 'Frontend Dev', avatar: 'JG', color: '#795548', status: 'busy' },
  { id: 8, name: 'Maria Diaz', role: 'Diseñadora', avatar: 'MD', color: '#F44336', status: 'online' },
  { id: 9, name: 'Maria Mendez', role: 'Analista', avatar: 'MM', color: '#607D8B', status: 'online' },
  { id: 10, name: 'Thomas Ferreo', role: 'DevOps', avatar: 'TF', color: '#FF5722', status: 'online' }
];

const DEFAULT_CATEGORIES = [
  { id: 'work', name: 'Trabajo', color: '#FFE600' },
  { id: 'personal', name: 'Personal', color: '#007bff' },
  { id: 'meeting', name: 'Reuniones', color: '#28a745' },
  { id: 'project', name: 'Proyecto', color: '#6f42c1' },
  { id: 'social', name: 'Social', color: '#e83e8c' }
];

function generateId() {
  return Date.now() + Math.random().toString(36).substring(2, 7);
}

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getInitialEvents() {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth();
  const sample = [
    { title: 'Standup diario', type: 'meeting', priority: 'medium', time: '09:00', endTime: '09:30', description: 'Reunión diaria del equipo', assignees: [1, 2, 3, 4], category: 'meeting', dayOffset: 0 },
    { title: 'Review de Sprint', type: 'meeting', priority: 'high', time: '14:00', endTime: '15:30', description: 'Revisión del sprint actual', assignees: [1, 2], category: 'work', dayOffset: 2 },
    { title: 'Diseño de UI', type: 'task', priority: 'high', time: '10:00', endTime: '12:00', description: 'Crear mockups de la nueva interfaz', assignees: [3], category: 'project', dayOffset: 1 },
    { title: 'Testing E2E', type: 'task', priority: 'medium', time: '11:00', endTime: '13:00', description: 'Ejecutar pruebas end to end', assignees: [4], category: 'work', dayOffset: 3 },
    { title: 'Demo al cliente', type: 'meeting', priority: 'high', time: '16:00', endTime: '17:00', description: 'Presentar avances al cliente', assignees: [1, 2, 3], category: 'meeting', dayOffset: 5 },
    { title: 'Refactoring backend', type: 'task', priority: 'medium', time: '09:00', endTime: '12:00', description: 'Optimizar consultas de base de datos', assignees: [2], category: 'project', dayOffset: 4 },
    { title: 'Integración de Equipo', type: 'activity', priority: 'low', time: '18:00', endTime: '20:00', description: 'Actividad de integración del equipo', assignees: [1, 2, 3, 4], category: 'social', dayOffset: 7 },
    { title: 'Entrega fase 1', type: 'deadline', priority: 'high', time: '23:59', endTime: '23:59', description: 'Fecha límite para entrega de fase 1', assignees: [1, 2, 3, 4], category: 'work', dayOffset: 10 },
    { title: 'Planning Sprint', type: 'meeting', priority: 'medium', time: '10:00', endTime: '12:00', description: 'Planificación del próximo sprint', assignees: [1, 2, 3, 4], category: 'meeting', dayOffset: -1 },
    { title: 'Code review', type: 'task', priority: 'medium', time: '15:00', endTime: '16:00', description: 'Revisión de código PR #42', assignees: [2, 4], category: 'work', dayOffset: 0 }
  ];

  return sample.map(s => {
    const d = new Date(y, m, today.getDate() + s.dayOffset);
    return {
      id: generateId(),
      title: s.title,
      type: s.type,
      priority: s.priority,
      date: formatDate(d),
      endDate: formatDate(d),
      time: s.time,
      endTime: s.endTime,
      description: s.description,
      category: s.category,
      assignees: s.assignees,
      status: s.dayOffset < 0 ? 'completed' : 'pending'
    };
  });
}

function normalizeId(id) {
  if (id === null || id === undefined) return id;
  if (typeof id === 'number') return id;
  if (/^\d+$/.test(id)) return parseInt(id, 10);
  return String(id);
}

export default async function handler(req, res) {
  // Cabeceras CORS completas para Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { collection } = await connectToDatabase();

    // ==================== GET: CONSULTAR TODO ====================
    if (req.method === 'GET') {
      const docs = await collection.find({}).toArray();

      let teamDocs = docs.filter(d => d.entityType === 'team' || (d.role && d.name));
      let categoryDocs = docs.filter(d => d.entityType === 'category' || (d.name && d.color && !d.role && !d.date));
      let eventDocs = docs.filter(d => d.entityType === 'event' || (d.title && (d.date || d.type)));

      // Si la colección está vacía en MongoDB Atlas, sembrar datos iniciales
      if (docs.length === 0) {
        const initialTeam = DEFAULT_TEAM.map(m => ({ ...m, entityType: 'team' }));
        const initialCats = DEFAULT_CATEGORIES.map(c => ({ ...c, entityType: 'category' }));
        const initialEvts = getInitialEvents().map(e => ({ ...e, entityType: 'event' }));

        const seedItems = [...initialTeam, ...initialCats, ...initialEvts];
        await collection.insertMany(seedItems);

        teamDocs = initialTeam;
        categoryDocs = initialCats;
        eventDocs = initialEvts;
      }

      // Mapear los documentos para retornar arreglos limpios a React
      const team = teamDocs.map(({ _id, entityType, ...rest }) => rest);
      const categories = categoryDocs.map(({ _id, entityType, ...rest }) => rest);
      const events = eventDocs.map(({ _id, entityType, ...rest }) => rest);

      return res.status(200).json({
        success: true,
        data: { events, team, categories }
      });
    }

    // Parsear body por si viene como cadena JSON en Vercel
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    // ==================== POST: CREAR DOCUMENTO ====================
    if (req.method === 'POST') {
      const { itemType, itemData } = body;

      if (!itemType || !itemData) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos (itemType, itemData)' });
      }

      const newItem = {
        ...itemData,
        id: itemData.id !== undefined ? itemData.id : (itemType === 'team' ? Date.now() : generateId()),
        entityType: itemType,
        createdAt: new Date().toISOString()
      };

      await collection.insertOne(newItem);
      const { _id, entityType, ...clientItem } = newItem;

      return res.status(201).json({
        success: true,
        item: clientItem
      });
    }

    // ==================== PUT / PATCH: ACTUALIZAR DOCUMENTO ====================
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { itemType, id, data } = body;

      if (!itemType || id === undefined || !data) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos (itemType, id, data)' });
      }

      const normId = normalizeId(id);
      const numId = Number(id);

      const orConditions = [{ id: normId }, { id: String(id) }];
      if (!isNaN(numId)) {
        orConditions.push({ id: numId });
      }

      const filter = {
        $or: [
          { entityType: itemType, $or: orConditions },
          { entityType: { $exists: false }, $or: orConditions }
        ]
      };

      const updateDoc = {
        $set: {
          ...data,
          entityType: itemType,
          updatedAt: new Date().toISOString()
        }
      };

      const result = await collection.updateOne(filter, updateDoc);

      return res.status(200).json({
        success: true,
        modifiedCount: result.modifiedCount
      });
    }

    // ==================== DELETE: ELIMINAR DOCUMENTO ====================
    if (req.method === 'DELETE') {
      const id = req.query?.id || body?.id;
      const itemType = req.query?.itemType || body?.itemType;

      if (!id || !itemType) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos (id, itemType)' });
      }

      const normId = normalizeId(id);
      const numId = Number(id);

      const orConditions = [{ id: normId }, { id: String(id) }];
      if (!isNaN(numId)) {
        orConditions.push({ id: numId });
      }

      const filter = {
        $or: [
          { entityType: itemType, $or: orConditions },
          { entityType: { $exists: false }, $or: orConditions }
        ]
      };

      const result = await collection.deleteOne(filter);

      return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount
      });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API /api/calendar:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      details: 'Error de conexión con MongoDB Atlas en Vercel. Verifica el acceso de IP 0.0.0.0/0 en MongoDB Atlas Console -> Network Access.'
    });
  }
}
