import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TYPE_NAMES } from '../../utils/dateUtils';

export default function EventPopup() {
  const {
    eventPopup,
    setEventPopup,
    events,
    team,
    openEditEvent,
    deleteEvent
  } = useApp();

  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setEventPopup(prev => ({ ...prev, open: false }));
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setEventPopup]);

  const evt = events.find(e => e.id === eventPopup.eventId);
  if (!evt) return null;

  const handleEdit = () => {
    openEditEvent(evt.id);
    setEventPopup(prev => ({ ...prev, open: false }));
  };

  const handleDelete = () => {
    if (window.confirm('¿Eliminar este evento?')) {
      deleteEvent(evt.id);
      setEventPopup(prev => ({ ...prev, open: false }));
    }
  };

  const x = eventPopup.x || window.innerWidth / 2;
  const y = eventPopup.y || window.innerHeight / 2;

  const style = eventPopup.x
    ? {
        position: 'absolute',
        left: `${Math.min(x, window.innerWidth - 300)}px`,
        top: `${Math.min(y, window.innerHeight - 250)}px`,
        zIndex: 1000
      }
    : {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      };

  return (
    <div className="event-popup" ref={popupRef} style={style} id="event-popup">
      <button className="popup-close" onClick={() => setEventPopup(prev => ({ ...prev, open: false }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div className="popup-type" id="popup-type">{TYPE_NAMES[evt.type] || evt.type}</div>
      <h3 className="popup-title" id="popup-title">{evt.title}</h3>
      <div className="popup-meta">
        <span className="popup-date" id="popup-date">{evt.date}</span>
        <span className="popup-time" id="popup-time">
          {evt.time || 'Todo el día'}{evt.endTime ? ` - ${evt.endTime}` : ''}
        </span>
      </div>
      <p className="popup-description" id="popup-description">{evt.description || 'Sin descripción'}</p>
      
      <div className="popup-assignees" id="popup-assignees">
        {(evt.assignees || []).map(assigneeId => {
          const member = team.find(m => m.id === assigneeId);
          if (!member) return null;
          return member.photo ? (
            <img
              key={assigneeId}
              src={member.photo}
              alt={member.avatar}
              className="popup-assignee-circle"
              title={member.name}
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span
              key={assigneeId}
              className="popup-assignee-circle"
              style={{ background: member.color || '#999' }}
              title={member.name}
            >
              {member.avatar}
            </span>
          );
        })}
      </div>

      <div className="popup-links" id="popup-links">
        {evt.meetLink && (
          <div style={{ marginBottom: '8px' }}>
            <div className="popup-links-title">Google Meet:</div>
            <a
              href={evt.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-link-item meet-popup-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#FFE600', textDecoration: 'none', fontWeight: '500' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              Unirse a Google Meet
            </a>
          </div>
        )}
        {evt.links && evt.links.length > 0 && (
          <>
            <div className="popup-links-title">Enlaces:</div>
            {evt.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="popup-link-item"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                {link.label || link.url}
              </a>
            ))}
          </>
        )}
      </div>

      <div className="popup-actions">
        <button className="btn btn-sm btn-secondary" id="popup-edit" onClick={handleEdit}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button className="btn btn-sm btn-danger" id="popup-delete" onClick={handleDelete}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  );
}
