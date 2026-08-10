// ==========================================
// CONFIGURACION DE FIREBASE
// ==========================================
// Para que la sincronización entre dispositivos funcione:
//
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto nuevo (nombre: "macalacticos" o el que quieras)
// 3. En el panel, ve a "Compilación" > "Realtime Database"
// 4. Crea una base de datos (selecciona la región más cercana)
// 5. En las reglas, pon:
//    {
//      "rules": {
//        ".read": true,
//        ".write": true
//      }
//    }
// 6. Ve a Configuración del proyecto (ícono de engranaje) > General
// 7. Baja hasta "Tus apps" > "Agregar app" > Web (</>)
// 8. Copia los valores del firebaseConfig aquí abajo
// ==========================================

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let app = null;
let db = null;

export function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

export function initFirebase() {
  if (!isFirebaseConfigured()) {
    console.warn(
      '⚠️ Firebase no está configurado. Los cambios solo se guardarán localmente.\n' +
      'Para sincronizar entre dispositivos, configura Firebase en src/config/firebase.js'
    );
    return null;
  }
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log('✅ Firebase conectado — sincronización entre dispositivos activa');
    return db;
  } catch (e) {
    console.error('Error al inicializar Firebase:', e);
    return null;
  }
}

export function getDb() {
  return db;
}

// Escribir datos a Firebase
export async function writeData(path, data) {
  if (!db) return;
  try {
    await set(ref(db, path), data);
  } catch (e) {
    console.error('Error escribiendo a Firebase:', e);
  }
}

// Leer datos una sola vez
export async function readData(path) {
  if (!db) return null;
  try {
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (e) {
    console.error('Error leyendo de Firebase:', e);
    return null;
  }
}

// Escuchar cambios en tiempo real
export function listenData(path, callback) {
  if (!db) return () => {};
  const dataRef = ref(db, path);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  }, (error) => {
    console.error('Error escuchando Firebase:', error);
  });
  return unsubscribe;
}

export { ref, set, onValue };
