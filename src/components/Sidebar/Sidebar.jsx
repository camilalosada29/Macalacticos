import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MONTHS, DAYS, formatDate, parseDate, sameDay } from '../../utils/dateUtils';

export default function Sidebar({ isOpen, onClose }) {
  const {
    currentView, setCurrentView,
    team, deleteMember, updateMemberRole, updateMemberPhoto,
    filterMemberId, setFilterMemberId,
    events, currentDate, setCurrentDate,
    selectedDate, setSelectedDate,
    categories, setMemberModalOpen, getFilteredEvents,
    addCategory, deleteCategory,
    notificationsEnabled, requestNotifications
  } = useApp();

  const fileInputRef = useRef(null);
  const [uploadMemberId, setUploadMemberId] = useState(null);

  const handlePhotoClick = (e, mId) => {
    e.stopPropagation();
    setUploadMemberId(mId);
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadMemberId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize to small thumbnail to save localStorage space
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 120;
        let w = img.width, h = img.height;
        if (w > h) { h = h * MAX / w; w = MAX; } else { w = w * MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        updateMemberPhoto(uploadMemberId, canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddCategoryPrompt = () => {
    const name = window.prompt('Nombre de la nueva categoría:');
    if (!name || !name.trim()) return;
    const color = window.prompt('Color (hexadecimal o nombre en inglés, ej: #FF5722 o red):', '#FFE600');
    if (color !== null) {
      addCategory(name.trim(), color.trim() || '#FFE600');
    }
  };

  const handleDeleteCategory = (e, catId) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta categoría?')) {
      deleteCategory(catId);
    }
  };

  const handleMemberClick = (mId) => {
    if (filterMemberId === mId) {
      setFilterMemberId(null);
    } else {
      setFilterMemberId(mId);
      setCurrentView('calendar');
    }
  };

  const handleDeleteMember = (e, mId) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este miembro del equipo?')) {
      deleteMember(mId);
    }
  };

  const handleEditRole = (e, member) => {
    e.stopPropagation();
    const newRole = window.prompt(`Editar rol de ${member.name}:`, member.role);
    if (newRole !== null && newRole.trim()) {
      updateMemberRole(member.id, newRole.trim());
    }
  };

  // Mini calendar rendering logic
  const renderMiniCalendarGrid = () => {
    const y = currentDate.getFullYear();
    const mo = currentDate.getMonth();
    const firstDayIndex = new Date(y, mo, 1).getDay();
    const totalDays = new Date(y, mo + 1, 0).getDate();
    const today = new Date();
    const filteredEventsList = getFilteredEvents();

    const daysGrid = [];
    const prevDaysCount = new Date(y, mo, 0).getDate();

    // Previous month overflow days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysGrid.push({
        dayNum: prevDaysCount - i,
        isOtherMonth: true,
        dateStr: null
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateObj = new Date(y, mo, i);
      const dateStr = formatDate(dateObj);
      const isToday = y === today.getFullYear() && mo === today.getMonth() && i === today.getDate();
      const hasEvt = filteredEventsList.some(e => e.date === dateStr);

      daysGrid.push({
        dayNum: i,
        isOtherMonth: false,
        dateStr,
        isToday,
        hasEvt
      });
    }

    // Next month overflow days
    const totalSlots = daysGrid.length;
    const remainingSlots = 7 - (totalSlots % 7);
    if (remainingSlots < 7) {
      for (let i = 1; i <= remainingSlots; i++) {
        daysGrid.push({
          dayNum: i,
          isOtherMonth: true,
          dateStr: null
        });
      }
    }

    return daysGrid;
  };

  const handleMiniPrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleMiniNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleMiniDayClick = (dateStr) => {
    if (!dateStr) return;
    const parsed = parseDate(dateStr);
    setSelectedDate(parsed);
    setCurrentDate(new Date(parsed));
  };

  const miniDays = renderMiniCalendarGrid();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <rect x="2" y="6" width="28" height="22" rx="4" fill="#FFE600"/>
              <rect x="8" y="2" width="3" height="8" rx="1.5" fill="#333"/>
              <rect x="21" y="2" width="3" height="8" rx="1.5" fill="#333"/>
              <circle cx="11" cy="18" r="2" fill="#333"/>
              <circle cx="16" cy="18" r="2" fill="#333"/>
              <circle cx="21" cy="18" r="2" fill="#333"/>
              <circle cx="11" cy="23" r="2" fill="#333"/>
              <circle cx="16" cy="23" r="2" fill="#333"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>Macalacticos</h1>
            <span className="logo-subtitle">Calendar</span>
          </div>
        </div>
        <button className="sidebar-mobile-close" onClick={onClose} aria-label="Cerrar menú">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => setCurrentView('calendar')}
        >
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span className="nav-label">Calendario</span>
        </button>

        <button
          className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
          onClick={() => setCurrentView('tasks')}
        >
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <span className="nav-label">Tareas</span>
        </button>

        <button
          className={`nav-item ${currentView === 'pulse' ? 'active' : ''}`}
          onClick={() => setCurrentView('pulse')}
        >
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </span>
          <span className="nav-label">Pulso del Equipo</span>
        </button>
      </nav>

      {/* Notification Toggle */}
      <div className="sidebar-section">
        <button className={`notif-toggle-btn ${notificationsEnabled ? 'active' : ''}`} onClick={requestNotifications}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span>{notificationsEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}</span>
          {notificationsEnabled && <span className="notif-active-dot"></span>}
        </button>
      </div>

      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Mi Equipo</h3>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setMemberModalOpen(true)}
            style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar
          </button>
        </div>

        <div className="team-list" id="team-list">
          {team.map(m => {
            const isActive = filterMemberId === m.id;
            return (
              <div
                key={m.id}
                className={`team-member ${isActive ? 'active-filter' : ''}`}
                onClick={() => handleMemberClick(m.id)}
                style={{ cursor: 'pointer' }}
              >
                {m.photo
                  ? <img src={m.photo} alt={m.avatar} className="member-avatar-photo" onClick={(e) => handlePhotoClick(e, m.id)} title="Cambiar foto" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  : <span className="member-avatar-circle" style={{ background: m.color || '#999' }} onClick={(e) => handlePhotoClick(e, m.id)} title="Subir foto de perfil">{m.avatar}</span>
                }
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div
                    className="member-role"
                    onClick={(e) => handleEditRole(e, m)}
                    title="Clic para editar rol"
                  >
                    {m.role}
                  </div>
                </div>
                <span className={`member-status ${m.status}`}></span>
                <button
                  className="member-delete-btn"
                  onClick={(e) => handleDeleteMember(e, m.id)}
                  title="Eliminar miembro"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">Calendario</h3>
        <div className="mini-calendar" id="mini-calendar">
          <div className="mini-cal-header">
            <button id="mini-prev" onClick={handleMiniPrev} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <strong>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</strong>
            <button id="mini-next" onClick={handleMiniNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18"/>
              </svg>
            </button>
          </div>
          <div className="mini-cal-grid">
            {DAYS.map(dn => (
              <div key={dn} style={{ fontWeight: 600, color: '#999', fontSize: '10px' }}>
                {dn.substring(0, 2)}
              </div>
            ))}
            {miniDays.map((cell, idx) => (
              <div
                key={idx}
                className={`mini-cal-day ${cell.isOtherMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''} ${cell.hasEvt ? 'has-event' : ''}`}
                onClick={() => handleMiniDayClick(cell.dateStr)}
              >
                {cell.dayNum}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Categorías</h3>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleAddCategoryPrompt}
            style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva
          </button>
        </div>
        <div className="categories-list" id="categories-list">
          {categories.map(c => (
            <div key={c.id} className="category-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="category-dot" style={{ background: c.color }}></span>
                <span>{c.name}</span>
              </div>
              <button
                onClick={(e) => handleDeleteCategory(e, c.id)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%', transition: 'all 0.2s' }}
                title="Eliminar categoría"
                className="category-delete-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
