import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';

export default function EventModal() {
  const {
    editingEvent,
    eventModalDefaults,
    setEventModalOpen,
    team,
    addEvent,
    updateEvent,
    deleteEvent,
    categories
  } = useApp();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('meeting');
  const [priority, setPriority] = useState('medium');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('work');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  
  // Links
  const [links, setLinks] = useState([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  // Google Meet
  const [meetLink, setMeetLink] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setType(editingEvent.type || 'meeting');
      setPriority(editingEvent.priority || 'medium');
      setDate(editingEvent.date || '');
      setEndDate(editingEvent.endDate || editingEvent.date || '');
      setTime(editingEvent.time || '09:00');
      setEndTime(editingEvent.endTime || '10:00');
      setDescription(editingEvent.description || '');
      setCategory(editingEvent.category || 'work');
      setSelectedAssignees(editingEvent.assignees || []);
      setLinks(editingEvent.links || []);
      setMeetLink(editingEvent.meetLink || '');
    } else {
      const todayStr = formatDate(new Date());
      setTitle('');
      setType(eventModalDefaults.type || 'meeting');
      setPriority(eventModalDefaults.priority || 'medium');
      setDate(eventModalDefaults.date || todayStr);
      setEndDate(eventModalDefaults.date || todayStr);
      setTime(eventModalDefaults.time || '09:00');
      if (eventModalDefaults.time) {
        const h = parseInt(eventModalDefaults.time.split(':')[0]);
        setEndTime(String(h + 1).padStart(2, '0') + ':00');
      } else {
        setEndTime('10:00');
      }
      setDescription('');
      setCategory('work');
      setSelectedAssignees([]);
      setLinks([]);
      setMeetLink('');
    }
  }, [editingEvent, eventModalDefaults]);

  const handleToggleAssignee = (mId) => {
    setSelectedAssignees(prev =>
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    );
  };

  const handleAddLink = () => {
    let url = linkUrl.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    setLinks(prev => [...prev, { url, label: linkLabel.trim() || '' }]);
    setLinkUrl('');
    setLinkLabel('');
  };

  const handleRemoveLink = (idx) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateMeet = () => {
    window.open('https://meet.google.com/new', '_blank');
  };

  const handleSave = () => {
    if (!title.trim()) { alert('El título es requerido'); return; }
    const payload = {
      title: title.trim(), type, priority, date, endDate, time, endTime,
      description: description.trim(), category,
      assignees: selectedAssignees, links, meetLink: meetLink.trim(),
      status: editingEvent ? editingEvent.status : 'pending',
      progressNote: editingEvent ? editingEvent.progressNote : '',
      pinned: editingEvent ? (editingEvent.pinned || false) : false,
    };
    if (editingEvent) { updateEvent(editingEvent.id, payload); }
    else { addEvent(payload); }
    setEventModalOpen(false);
  };

  const handleDelete = () => {
    if (editingEvent && window.confirm('¿Eliminar este evento?')) {
      deleteEvent(editingEvent.id);
      setEventModalOpen(false);
    }
  };

  return (
    <div className="modal-overlay active" id="modal-overlay" onClick={(e) => e.target.id === 'modal-overlay' && setEventModalOpen(false)}>
      <div className="modal">
        <div className="modal-header">
          <h3 id="modal-title">{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          <button className="modal-close" onClick={() => setEventModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="event-title-input">Título del evento</label>
          <input type="text" id="event-title-input" placeholder="Reunión de alineación, entrega de diseño..."
            value={title} onChange={e => setTitle(e.target.value)} autoComplete="off" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="event-type-select">Tipo</label>
            <select id="event-type-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="meeting">Reunión</option>
              <option value="task">Tarea</option>
              <option value="activity">Actividad</option>
              <option value="reminder">Recordatorio</option>
              <option value="deadline">Fecha límite</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="event-priority-select">Prioridad</label>
            <select id="event-priority-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">● Baja</option>
              <option value="medium">● Media</option>
              <option value="high">● Alta</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="event-date-input">Fecha inicio</label>
            <input type="date" id="event-date-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="event-end-date-input">Fecha fin</label>
            <input type="date" id="event-end-date-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="event-time-input">Hora inicio</label>
            <input type="time" id="event-time-input" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="event-end-time-input">Hora fin</label>
            <input type="time" id="event-end-time-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="event-description-input">Descripción</label>
          <textarea id="event-description-input" rows="3" placeholder="Detalles adicionales del evento..."
            value={description} onChange={e => setDescription(e.target.value)}></textarea>
        </div>

        {/* Google Meet Integration */}
        <div className="form-group">
          <label>Google Meet</label>
          <div className="meet-section">
            <div className="meet-input-row">
              <input type="url" placeholder="Pegar enlace de Google Meet..." value={meetLink}
                onChange={e => setMeetLink(e.target.value)} />
              <button type="button" className="meet-create-btn" onClick={handleCreateMeet} title="Crear nueva reunión de Google Meet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Crear Meet
              </button>
            </div>
            {meetLink && (
              <a href={meetLink} target="_blank" rel="noopener noreferrer" className="meet-link-preview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Unirse a la reunión
              </a>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="form-group">
          <label>Enlaces y recursos</label>
          <div className="links-container" id="links-container">
            {links.length === 0 ? (
              <span className="no-links">Sin enlaces</span>
            ) : (
              links.map((link, idx) => (
                <div key={idx} className="link-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>{link.label || link.url}</a>
                  <button className="link-remove" onClick={() => handleRemoveLink(idx)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="link-input-row">
            <input type="url" placeholder="https://..." value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddLink()} />
            <input type="text" placeholder="Etiqueta (opcional)" value={linkLabel}
              onChange={e => setLinkLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddLink()} />
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddLink}>Agregar</button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="event-category-select">Categoría</label>
          <select id="event-category-select" value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>

        <div className="form-group">
          <label>Asignar integrantes</label>
          <div className="assignee-selector" id="assignee-selector">
            {team.map(m => {
              const isSelected = selectedAssignees.includes(m.id);
              return (
                <div key={m.id} className={`assignee-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleAssignee(m.id)}>
                  {m.photo
                    ? <img src={m.photo} alt={m.avatar} className="assignee-chip-photo" />
                    : <span className="assignee-chip-avatar" style={{ background: m.color || '#999' }}>{m.avatar}</span>
                  }
                  {m.name}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-actions">
          {editingEvent && (
            <button className="btn btn-danger" id="modal-delete" onClick={handleDelete}>Eliminar</button>
          )}
          <button className="btn btn-secondary" onClick={() => setEventModalOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" id="modal-save" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
