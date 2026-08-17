// =========================================================
// MIGRACION A MONGODB ATLAS REALIZADA
// =========================================================
// La persistencia de datos ahora se realiza exclusivamente
// a través de Node.js API REST conectada a MongoDB Atlas
// (Base de Datos: Camila, Colección: CamilaCalendar).
// =========================================================

export function isFirebaseConfigured() {
  return false;
}

export function initFirebase() {
  return null;
}

export function writeData() {
  return Promise.resolve();
}

export function readData() {
  return Promise.resolve(null);
}

export function listenData() {
  return () => {};
}
