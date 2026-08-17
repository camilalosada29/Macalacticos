import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DEFAULT_TEAM, DEFAULT_CATEGORIES, AVATAR_COLORS } from '../data/initialData';
import { generateId, formatDate } from '../utils/dateUtils';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState('calendar');
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMemberId, setFilterMemberId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventModalDefaults, setEventModalDefaults] = useState({});
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [eventPopup, setEventPopup] = useState({ open: false, eventId: null, x: 0, y: 0 });

  // Toast notification helper
  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ==================== Cargar datos desde MongoDB Atlas ====================
  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calendar');
      const result = await res.json();

      if (result.success && result.data) {
        if (result.data.events) setEvents(result.data.events);
        if (result.data.team && result.data.team.length > 0) setTeam(result.data.team);
        if (result.data.categories && result.data.categories.length > 0) setCategories(result.data.categories);
      } else {
        console.error('Error al cargar datos desde MongoDB Atlas:', result.error);
        toast('Error al consultar MongoDB Atlas', 'error');
      }
    } catch (err) {
      console.error('Error de conexión a la API:', err);
      toast('No se pudo conectar a la API de MongoDB', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // ==================== NOTIFICACIONES ====================
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const requestNotifications = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          setNotificationsEnabled(true);
          toast('Notificaciones activadas', 'success');
        } else {
          toast('Permiso de notificaciones denegado', 'error');
        }
      });
    }
  }, [toast]);

  // Check for due tasks/events
  useEffect(() => {
    if (!notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }

    const interval = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const todayStr = formatDate(now);

      events.forEach(evt => {
        if (evt.date === todayStr && evt.time) {
          const [eH, eM] = evt.time.split(':').map(Number);
          const evtMinutes = eH * 60 + eM;
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const diff = evtMinutes - nowMinutes;
          if (diff >= 0 && diff <= 5 && !evt._notified) {
            new Notification(`Macalacticos Calendar`, {
              body: `${evt.title} comienza ${diff === 0 ? 'ahora' : `en ${diff} min`}`,
              icon: '/favicon.svg'
            });
            setEvents(prev => prev.map(e => e.id === evt.id ? { ...e, _notified: true } : e));
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [events, notificationsEnabled]);

  // ==================== CATEGORIAS (MongoDB Atlas) ====================
  const addCategory = useCallback(async (name, color) => {
    if (!name.trim()) return;
    const id = name.trim().toLowerCase().replace(/\s+/g, '-');
    const catData = { id, name: name.trim(), color: color || '#FFE600' };

    if (categories.some(c => c.id === id)) {
      toast('La categoría ya existe', 'error');
      return;
    }

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'category', itemData: catData })
      });
      const result = await res.json();
      if (result.success && result.item) {
        setCategories(prev => [...prev, result.item]);
        toast('Categoría guardada en MongoDB Atlas', 'success');
      } else {
        toast('Error al guardar categoría en MongoDB', 'error');
      }
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      toast('Error de red al guardar categoría', 'error');
    }
  }, [categories, toast]);

  const deleteCategory = useCallback(async (id) => {
    if (categories.length <= 1) {
      toast('Debes mantener al menos una categoría', 'error');
      return;
    }

    const previousCategories = [...categories];
    setCategories(prev => prev.filter(c => c.id !== id));

    try {
      const res = await fetch(`/api/calendar?id=${encodeURIComponent(id)}&itemType=category`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        toast('Categoría eliminada de MongoDB Atlas', 'success');
      } else {
        toast('Error al eliminar categoría en MongoDB', 'error');
        setCategories(previousCategories);
      }
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      toast('Error de red al eliminar categoría', 'error');
      setCategories(previousCategories);
    }
  }, [categories, toast]);

  // ==================== EVENTOS (MongoDB Atlas) ====================
  const addEvent = useCallback(async (eventData) => {
    const newEventData = { ...eventData, id: generateId() };

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'event', itemData: newEventData })
      });
      const result = await res.json();
      if (result.success && result.item) {
        setEvents(prev => [...prev, result.item]);
        toast('Evento creado en MongoDB Atlas', 'success');
        return result.item;
      } else {
        toast('Error al guardar evento en MongoDB', 'error');
      }
    } catch (err) {
      console.error('Error al crear evento:', err);
      toast('Error de red al crear evento', 'error');
    }
  }, [toast]);

  const updateEvent = useCallback(async (id, data) => {
    const previousEvents = [...events];
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));

    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'event', id, data })
      });
      const result = await res.json();
      if (result.success) {
        toast('Evento actualizado en MongoDB Atlas', 'success');
      } else {
        toast('Error al actualizar evento en MongoDB', 'error');
        setEvents(previousEvents);
      }
    } catch (err) {
      console.error('Error al actualizar evento:', err);
      toast('Error de red al actualizar evento', 'error');
      setEvents(previousEvents);
    }
  }, [events, toast]);

  const deleteEvent = useCallback(async (id) => {
    const previousEvents = [...events];
    setEvents(prev => prev.filter(e => e.id !== id));

    try {
      const res = await fetch(`/api/calendar?id=${encodeURIComponent(id)}&itemType=event`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        toast('Evento eliminado de MongoDB Atlas', 'success');
      } else {
        toast('Error al eliminar evento en MongoDB', 'error');
        setEvents(previousEvents);
      }
    } catch (err) {
      console.error('Error al eliminar evento:', err);
      toast('Error de red al eliminar evento', 'error');
      setEvents(previousEvents);
    }
  }, [events, toast]);

  // ==================== EQUIPO (MongoDB Atlas) ====================
  const addMember = useCallback(async (name, role) => {
    const parts = name.split(' ');
    const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const memberData = { id: Date.now(), name, role: role || 'Miembro', avatar: initials, color, status: 'online', photo: null };

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'team', itemData: memberData })
      });
      const result = await res.json();
      if (result.success && result.item) {
        setTeam(prev => [...prev, result.item]);
        toast('Miembro agregado a MongoDB Atlas', 'success');
      } else {
        toast('Error al guardar miembro en MongoDB', 'error');
      }
    } catch (err) {
      console.error('Error al agregar miembro:', err);
      toast('Error de red al agregar miembro', 'error');
    }
  }, [toast]);

  const deleteMember = useCallback(async (id) => {
    const previousTeam = [...team];
    setTeam(prev => prev.filter(m => m.id !== id));
    if (filterMemberId === id) setFilterMemberId(null);

    try {
      const res = await fetch(`/api/calendar?id=${encodeURIComponent(id)}&itemType=team`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        toast('Miembro eliminado de MongoDB Atlas', 'success');
      } else {
        toast('Error al eliminar miembro en MongoDB', 'error');
        setTeam(previousTeam);
      }
    } catch (err) {
      console.error('Error al eliminar miembro:', err);
      toast('Error de red al eliminar miembro', 'error');
      setTeam(previousTeam);
    }
  }, [team, filterMemberId, toast]);

  const updateMemberRole = useCallback(async (id, newRole) => {
    const previousTeam = [...team];
    setTeam(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));

    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'team', id, data: { role: newRole } })
      });
      const result = await res.json();
      if (result.success) {
        toast('Rol actualizado en MongoDB Atlas', 'success');
      } else {
        toast('Error al actualizar rol en MongoDB', 'error');
        setTeam(previousTeam);
      }
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      toast('Error de red al actualizar rol', 'error');
      setTeam(previousTeam);
    }
  }, [team, toast]);

  const updateMemberPhoto = useCallback(async (id, photoBase64) => {
    const previousTeam = [...team];
    setTeam(prev => prev.map(m => m.id === id ? { ...m, photo: photoBase64 } : m));

    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'team', id, data: { photo: photoBase64 } })
      });
      const result = await res.json();
      if (result.success) {
        toast('Foto actualizada en MongoDB Atlas', 'success');
      } else {
        toast('Error al actualizar foto en MongoDB', 'error');
        setTeam(previousTeam);
      }
    } catch (err) {
      console.error('Error al actualizar foto:', err);
      toast('Error de red al actualizar foto', 'error');
      setTeam(previousTeam);
    }
  }, [team, toast]);

  // Eventos filtrados
  const getFilteredEvents = useCallback(() => {
    if (!filterMemberId) return events;
    return events.filter(e => e.assignees && e.assignees.includes(filterMemberId));
  }, [events, filterMemberId]);

  // Ayudantes de modales
  const openNewEvent = useCallback((defaults = {}) => {
    setEditingEvent(null);
    setEventModalDefaults(defaults);
    setEventModalOpen(true);
  }, []);

  const openEditEvent = useCallback((id) => {
    const evt = events.find(e => e.id === id);
    if (evt) {
      setEditingEvent(evt);
      setEventModalOpen(true);
    }
  }, [events]);

  const openNewTask = useCallback(() => {
    setEditingEvent(null);
    setEventModalDefaults({ type: 'task' });
    setEventModalOpen(true);
  }, []);

  const value = {
    events, setEvents, team, setTeam,
    currentView, setCurrentView,
    calendarView, setCalendarView,
    currentDate, setCurrentDate,
    selectedDate, setSelectedDate,
    filterMemberId, setFilterMemberId,
    toasts, toast,
    loading, fetchCalendarData,
    eventModalOpen, setEventModalOpen,
    editingEvent, setEditingEvent,
    eventModalDefaults, setEventModalDefaults,
    memberModalOpen, setMemberModalOpen,
    eventPopup, setEventPopup,
    categories,
    addCategory,
    deleteCategory,
    addEvent, updateEvent, deleteEvent,
    addMember, deleteMember, updateMemberRole, updateMemberPhoto,
    getFilteredEvents,
    openNewEvent, openEditEvent, openNewTask,
    notificationsEnabled, requestNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
