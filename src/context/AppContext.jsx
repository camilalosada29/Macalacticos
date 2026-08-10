import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_TEAM, DEFAULT_CATEGORIES, AVATAR_COLORS } from '../data/initialData';
import { generateId, formatDate } from '../utils/dateUtils';
import { initFirebase, isFirebaseConfigured, writeData, listenData } from '../config/firebase';

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

  // Ref to track if incoming update is from Firebase (prevent loops)
  const isFirebaseUpdate = useRef(false);
  const firebaseReady = useRef(false);

  // Toast
  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // ==================== FIREBASE REAL-TIME SYNC ====================
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const db = initFirebase();
    if (!db) return;
    firebaseReady.current = true;

    // Escuchar cambios en eventos desde Firebase (otros dispositivos)
    const unsubEvents = listenData('calendar/events', (data) => {
      const firebaseEvents = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
      isFirebaseUpdate.current = true;
      setEvents(firebaseEvents);
      setTimeout(() => { isFirebaseUpdate.current = false; }, 100);
    });

    // Escuchar cambios en equipo desde Firebase
    const unsubTeam = listenData('calendar/team', (data) => {
      if (data) {
        const firebaseTeam = Array.isArray(data) ? data : Object.values(data);
        isFirebaseUpdate.current = true;
        setTeam(firebaseTeam);
        setTimeout(() => { isFirebaseUpdate.current = false; }, 100);
      }
    });

    // Escuchar cambios en categorías desde Firebase
    const unsubCats = listenData('calendar/categories', (data) => {
      if (data) {
        const firebaseCats = Array.isArray(data) ? data : Object.values(data);
        isFirebaseUpdate.current = true;
        setCategories(firebaseCats);
        setTimeout(() => { isFirebaseUpdate.current = false; }, 100);
      }
    });

    return () => {
      if (typeof unsubEvents === 'function') unsubEvents();
      if (typeof unsubTeam === 'function') unsubTeam();
      if (typeof unsubCats === 'function') unsubCats();
    };
  }, []); // Run once on mount

  // Sync local changes TO Firebase
  const syncToFirebase = useCallback((newEvents, newTeam, newCategories) => {
    if (!firebaseReady.current || isFirebaseUpdate.current) return;
    if (newEvents !== undefined) writeData('calendar/events', newEvents);
    if (newTeam !== undefined) writeData('calendar/team', newTeam);
    if (newCategories !== undefined) writeData('calendar/categories', newCategories);
  }, []);

  // BroadcastChannel for same-device cross-tab sync (still useful)
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('ml_calendar_realtime_sync');
      bc.onmessage = (e) => {
        if (e.data && e.data.type === 'sync') {
          const storedEvents = localStorage.getItem('ml_events');
          if (storedEvents) setEvents(JSON.parse(storedEvents));
          const storedTeam = localStorage.getItem('ml_team');
          if (storedTeam) setTeam(JSON.parse(storedTeam));
          const storedCat = localStorage.getItem('ml_categories');
          if (storedCat) setCategories(JSON.parse(storedCat));
        }
      };
    } catch {}
    return () => { if (bc) bc.close(); };
  }, [setEvents, setTeam, setCategories]);

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
      const updated = [...prev, newCat];
      syncToFirebase(undefined, undefined, updated);
      toast('Categoría agregada', 'success');
      return updated;
    });
  }, [setCategories, toast, syncToFirebase]);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => {
      if (prev.length <= 1) {
        toast('Debes mantener al menos una categoría', 'error');
        return prev;
      }
      const updated = prev.filter(c => c.id !== id);
      syncToFirebase(undefined, undefined, updated);
      toast('Categoría eliminada', 'success');
      return updated;
    });
  }, [setCategories, toast, syncToFirebase]);

  // Events
  const addEvent = useCallback((eventData) => {
    const newEvent = { ...eventData, id: generateId() };
    setEvents(prev => {
      const updated = [...prev, newEvent];
      syncToFirebase(updated, undefined, undefined);
      return updated;
    });
    toast('Evento creado', 'success');
    notifyBroadcast();
    return newEvent;
  }, [setEvents, toast, notifyBroadcast, syncToFirebase]);

  const updateEvent = useCallback((id, data) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...data } : e);
      syncToFirebase(updated, undefined, undefined);
      return updated;
    });
    toast('Evento actualizado', 'success');
    notifyBroadcast();
  }, [setEvents, toast, notifyBroadcast, syncToFirebase]);

  const deleteEvent = useCallback((id) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      syncToFirebase(updated, undefined, undefined);
      return updated;
    });
    toast('Evento eliminado', 'success');
    notifyBroadcast();
  }, [setEvents, toast, notifyBroadcast, syncToFirebase]);

  // Team
  const addMember = useCallback((name, role) => {
    const parts = name.split(' ');
    const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const member = { id: Date.now(), name, role: role || 'Miembro', avatar: initials, color, status: 'online', photo: null };
    setTeam(prev => {
      const updated = [...prev, member];
      syncToFirebase(undefined, updated, undefined);
      return updated;
    });
    toast('Miembro agregado', 'success');
    notifyBroadcast();
  }, [setTeam, toast, notifyBroadcast, syncToFirebase]);

  const deleteMember = useCallback((id) => {
    setTeam(prev => {
      const updated = prev.filter(m => m.id !== id);
      syncToFirebase(undefined, updated, undefined);
      return updated;
    });
    if (filterMemberId === id) setFilterMemberId(null);
    toast('Miembro eliminado', 'success');
    notifyBroadcast();
  }, [setTeam, filterMemberId, toast, notifyBroadcast, syncToFirebase]);

  const updateMemberRole = useCallback((id, newRole) => {
    setTeam(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, role: newRole } : m);
      syncToFirebase(undefined, updated, undefined);
      return updated;
    });
    toast('Rol actualizado', 'success');
    notifyBroadcast();
  }, [setTeam, toast, notifyBroadcast, syncToFirebase]);

  const updateMemberPhoto = useCallback((id, photoBase64) => {
    setTeam(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, photo: photoBase64 } : m);
      syncToFirebase(undefined, updated, undefined);
      return updated;
    });
    toast('Foto actualizada', 'success');
    notifyBroadcast();
  }, [setTeam, toast, notifyBroadcast, syncToFirebase]);

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
    firebaseActive: firebaseReady.current,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
