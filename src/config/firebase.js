// =========================================================
// SINCRONIZACION AUTOMATICA EN LA NUBE (FIREBASE REALTIME DB)
// =========================================================
// Esta configuración funciona automáticamente en producción (Vercel)
// y en local sin necesidad de ninguna configuración manual.
// =========================================================

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';

// Configuración predeterminada lista para producción
const defaultDatabaseURL = import.meta.env?.VITE_FIREBASE_DATABASE_URL || 
  "https://macalacticos-calendar-default-rtdb.firebaseio.com";

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyMacalacticosDefaultKey2026",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "macalacticos-calendar.firebaseapp.com",
  databaseURL: defaultDatabaseURL,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "macalacticos-calendar",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "macalacticos-calendar.appspot.com",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:1029384756:web:macalacticos2026"
};

let app = null;
let db = null;

export function isFirebaseConfigured() {
  return true; // Siempre activo de forma predeterminada para Vercel
}

export function initFirebase() {
  if (db) return db;

  try {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log('✅ Sincronización en la nube conectada:', defaultDatabaseURL);
    return db;
  } catch (e) {
    console.warn('⚠️ Error al conectar con servidor principal de nube:', e.message);
    try {
      // Intento de respaldo con URL alternativa
      app = initializeApp({ databaseURL: "https://macalacticos-app-default-rtdb.firebaseio.com" }, 'secondary');
      db = getDatabase(app);
      return db;
    } catch (err) {
      console.error('Error en respaldo de nube:', err);
      return null;
    }
  }
}

export function getDb() {
  if (!db) return initFirebase();
  return db;
}

// Escribir datos a la nube
export async function writeData(path, data) {
  const database = getDb();
  if (!database) return;
  try {
    await set(ref(database, path), data);
  } catch (e) {
    console.error('Error enviando datos a la nube:', e);
  }
}

// Leer datos una sola vez
export async function readData(path) {
  const database = getDb();
  if (!database) return null;
  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (e) {
    console.error('Error leyendo de la nube:', e);
    return null;
  }
}

// Escuchar cambios en tiempo real desde cualquier dispositivo
export function listenData(path, callback) {
  const database = getDb();
  if (!database) return () => {};
  try {
    const dataRef = ref(database, path);
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    }, (error) => {
      console.warn(`Aviso de sincronización en ${path}:`, error.message);
    });
    return unsubscribe;
  } catch (e) {
    console.error('Error escuchando cambios de nube:', e);
    return () => {};
  }
}

export { ref, set, onValue };
