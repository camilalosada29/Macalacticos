import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_TEAM, DEFAULT_CATEGORIES, AVATAR_COLORS } from '../data/initialData';
import { generateId, formatDate } from '../utils/dateUtils';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [events, setEvents] = useLocalStorage('ml_events', []);
  const [team, setTeam] = useLocalStorage('ml_team', DEFAULT_TEAM);
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

  const [categories, setCategories] = useLocalStorage('ml_categories', DEFAULT_CATEGORIES);

  // Toast
  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // BroadcastChannel for instant cross-tab real-time synchronization
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('ml_calendar_realtime_sync');
      bc.onmessage = (e) => {
        if (e.data && e.data.type === 'sync') {
          // Trigger reload from localStorage
          const storedEvents = localStorage.getItem('ml_events');
          if (storedEvents) setEvents(JSON.parse(storedEvents));
          const storedTeam = localStorage.getItem('ml_team');
          if (storedTeam) setTeam(JSON.parse(storedTeam));
          const storedCat = localStorage.getItem('ml_categories');
          if (storedCat) setCategories(JSON.parse(storedCat));
          toast('⚡ Cambios sincronizados en tiempo real', 'info');
        }
      };
    } catch {
      // BroadcastChannel fallback handled by storage event listener in useLocalStorage
    }
    return () => {
      if (bc) bc.close();
    };
  }, [setEvents, setTeam, setCategories, toast]);

  const notifyBroadcast = useCallback(() => {
    try {
      const bc = new BroadcastChannel('ml_calendar_realtime_sync');
      bc.postMessage({ type: 'sync', timestamp: Date.now() });
      bc.close();
    } catch {}
  }, []);

  // ==================== NOTIFICATIONS ====================
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

  // Check for due tasks/events every 60 seconds
  useEffect(() => {
    if (!notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }

    const interval = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const todayStr = formatDate(now);
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMin = String(now.getMinutes()).padStart(2, '0');
      const nowTime = `${currentHour}:${currentMin}`;

      events.forEach(evt => {
        if (evt.date === todayStr && evt.time) {
          // Notify if event starts within 5 minutes
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
  }, [events, notificationsEnabled, setEvents]);

  // Categories
  const addCategory = useCallback((name, color) => {
    if (!name.trim()) return;
    const id = name.trim().toLowerCase().replace(/\s+/g, '-');
    const newCat = { id, name: name.trim(), color: color || '#FFE600' };

    setCategories(prev => {
      if (prev.some(c => c.id === id)) {
        toast('La categoría ya existe', 'error');
        return prev;
      }
      toast('Categoría agregada', 'success');
      return [...prev, newCat];
    });
  }, [setCategories, toast]);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => {
      if (prev.length <= 1) {
        toast('Debes mantener al menos una categoría', 'error');
        return prev;
      }
      toast('Categoría eliminada', 'success');
      return prev.filter(c => c.id !== id);
    });
  }, [setCategories, toast]);

  // Events
  const addEvent = useCallback((eventData) => {
    const newEvent = { ...eventData, id: generateId() };
    setEvents(prev => [...prev, newEvent]);
    toast('Evento creado', 'success');
    notifyBroadcast();
    return newEvent;
  }, [setEvents, toast, notifyBroadcast]);

  const updateEvent = useCallback((id, data) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    toast('Evento actualizado', 'success');
    notifyBroadcast();
  }, [setEvents, toast, notifyBroadcast]);

  const deleteEvent = useCallback((id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast('Evento eliminado', 'success');
    notifyBroadcast();
  }, [setEvents, toast, notifyBroadcast]);

  // Team
  const addMember = useCallback((name, role) => {
    const parts = name.split(' ');
    const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const member = { id: Date.now(), name, role: role || 'Miembro', avatar: initials, color, status: 'online', photo: null };
    setTeam(prev => [...prev, member]);
    toast('Miembro agregado', 'success');
    notifyBroadcast();
  }, [setTeam, toast, notifyBroadcast]);

  const deleteMember = useCallback((id) => {
    setTeam(prev => prev.filter(m => m.id !== id));
    if (filterMemberId === id) setFilterMemberId(null);
    toast('Miembro eliminado', 'success');
    notifyBroadcast();
  }, [setTeam, filterMemberId, toast, notifyBroadcast]);

  const updateMemberRole = useCallback((id, newRole) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    toast('Rol actualizado', 'success');
    notifyBroadcast();
  }, [setTeam, toast, notifyBroadcast]);

  const updateMemberPhoto = useCallback((id, photoBase64) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, photo: photoBase64 } : m));
    toast('Foto actualizada', 'success');
    notifyBroadcast();
  }, [setTeam, toast, notifyBroadcast]);

  // Filtered events
  const getFilteredEvents = useCallback(() => {
    if (!filterMemberId) return events;
    return events.filter(e => e.assignees && e.assignees.includes(filterMemberId));
  }, [events, filterMemberId]);

  // Open modal helpers
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
