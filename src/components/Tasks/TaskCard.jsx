import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PRIORITY_NAMES } from '../../utils/dateUtils';

export default function TaskCard({ task }) {
  const { team, updateEvent, deleteEvent, setEventPopup } = useApp();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; setIsDragging(true); };
  const handleDragEnd = () => { setIsDragging(false); };

  const handleCardClick = (e) => {
    if (e.target.closest('.task-actions') || e.target.closest('button')) return;
    setEventPopup({ open: true, eventId: task.id, x: e.clientX, y: e.clientY });
  };

  const handleStatusChange = (newStatus) => { updateEvent(task.id, { status: newStatus }); };
  const handleProgressNote = () => {
    const note = window.prompt('Agregar nota de progreso:', task.progressNote || '');
    if (note !== null) updateEvent(task.id, { progressNote: note.trim() });
  };
  const handleDelete = () => { if (window.confirm('¿Eliminar esta tarea?')) deleteEvent(task.id); };
  const handlePin = () => { updateEvent(task.id, { pinned: !task.pinned }); };

  const currentStatus = task.status || 'pending';

  return (
    <div className={`task-card ${isDragging ? 'dragging' : ''} ${task.pinned ? 'pinned-card' : ''}`}
      draggable="true" onDragStart={handleDragStart} onDragEnd={handleDragEnd}
      onClick={handleCardClick} data-id={task.id}>

      <div className="task-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h4>{task.title}</h4>
          <button className={`pin-btn ${task.pinned ? 'pinned' : ''}`} onClick={handlePin} title={task.pinned ? 'Desfijar' : 'Fijar tarea'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={task.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 17v5M9 3h6l-1 7h4l-6 8h-4l1-7H5l4-8z"/>
            </svg>
          </button>
        </div>
        <p>{task.description || 'Sin descripción'}</p>

        {task.meetLink && (
          <a href={task.meetLink} target="_blank" rel="noopener noreferrer" className="task-meet-link" onClick={e => e.stopPropagation()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Google Meet
          </a>
        )}

        {task.progressNote && (
          <div className="task-progress-note">
            <strong>Progreso:</strong> {task.progressNote}
          </div>
        )}

        <div className="task-card-meta">
          <span className={`task-priority ${task.priority || 'medium'}`}>
            {PRIORITY_NAMES[task.priority || 'medium']}
          </span>
          <div className="task-assignees">
            {(task.assignees || []).map(assigneeId => {
              const member = team.find(m => m.id === assigneeId);
              if (!member) return null;
              return member.photo
                ? <img key={assigneeId} src={member.photo} alt={member.avatar} className="task-assignee-circle" title={member.name} style={{ width: 24, height: 24, objectFit: 'cover' }} />
                : <span key={assigneeId} className="task-assignee-circle" style={{ background: member.color || '#999' }} title={member.name}>{member.avatar}</span>;
            })}
          </div>
        </div>

        {task.date && (
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{task.date}</div>
        )}
      </div>

      <div className="task-actions">
        {currentStatus === 'pending' && (
          <button className="task-status-btn btn-move-progress" onClick={() => handleStatusChange('in-progress')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            Iniciar
          </button>
        )}
        {currentStatus === 'in-progress' && (
          <>
            <button className="task-progress-btn" onClick={handleProgressNote}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Nota
            </button>
            <button className="task-status-btn btn-move-done" onClick={() => handleStatusChange('completed')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Completar
            </button>
          </>
        )}
        {currentStatus === 'completed' && (
          <button className="task-status-btn btn-move-reopen" onClick={() => handleStatusChange('pending')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Reabrir
          </button>
        )}
        <button className="task-delete-btn" onClick={handleDelete} title="Eliminar tarea">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
