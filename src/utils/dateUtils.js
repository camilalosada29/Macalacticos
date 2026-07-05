export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
export const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

export function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function parseDate(s) {
  const p = s.split('-');
  return new Date(p[0], p[1] - 1, p[2]);
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

export function typeColor(t) {
  const colors = {
    meeting: 'rgba(255,230,0,.7)',
    task: 'rgba(40,167,69,.5)',
    activity: 'rgba(0,123,255,.5)',
    reminder: 'rgba(220,53,69,.5)',
    deadline: 'rgba(108,117,125,.5)'
  };
  return colors[t] || 'rgba(255,230,0,.7)';
}

export const TYPE_NAMES = {
  meeting: 'Reunión', task: 'Tarea', activity: 'Actividad',
  reminder: 'Recordatorio', deadline: 'Fecha límite'
};

export const PRIORITY_NAMES = { high: 'Alta', medium: 'Media', low: 'Baja' };
