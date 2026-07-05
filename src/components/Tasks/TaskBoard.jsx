import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TaskCard from './TaskCard';

export default function TaskBoard() {
  const { events, updateEvent, openNewTask } = useApp();

  const [columnFilter, setColumnFilter] = useState('all');
  const [dragOverCol, setDragOverCol] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // kanban | list

  const tasks = events.filter(e => e.type === 'task' || e.type === 'activity');

  // Sort: pinned first, then by date
  const sortTasks = (list) => {
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  };

  const pending = sortTasks(tasks.filter(t => !t.status || t.status === 'pending'));
  const inProgress = sortTasks(tasks.filter(t => t.status === 'in-progress'));
  const completed = sortTasks(tasks.filter(t => t.status === 'completed'));

  const columns = [
    { id: 'pending', title: 'Pendientes', count: pending.length, items: pending, color: '#F59E0B' },
    { id: 'in-progress', title: 'En Progreso', count: inProgress.length, items: inProgress, color: '#3B82F6' },
    { id: 'completed', title: 'Completadas', count: completed.length, items: completed, color: '#10B981' }
  ];

  const handleDragOver = (e, colId) => { e.preventDefault(); setDragOverCol(colId); };
  const handleDragLeave = () => { setDragOverCol(null); };
  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== colId) updateEvent(taskId, { status: colId });
  };

  // All tasks for list view
  const allTasks = sortTasks(tasks);

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="tasks-header-left">
          <h2>Gestión de Tareas</h2>
          <button className="add-task-btn" onClick={openNewTask}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Tarea
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View toggle */}
          <div className="view-switcher">
            <button className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')} title="Kanban">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="10" rx="1"/>
              </svg>
            </button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Lista">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Filter pills */}
          <div className="tasks-filters">
            {['all', 'pending', 'in-progress', 'completed'].map(f => (
              <button key={f} className={`filter-btn ${columnFilter === f ? 'active' : ''}`}
                onClick={() => setColumnFilter(f)}>
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'in-progress' ? 'En Progreso' : 'Completadas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="tasks-board">
          {columns
            .filter(col => columnFilter === 'all' || columnFilter === col.id)
            .map(col => (
              <div key={col.id} className="task-column" data-status={col.id}>
                <div className="column-header">
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color, flexShrink: 0 }}></div>
                  <h3>{col.title}</h3>
                  <span className="column-count">{col.count}</span>
                </div>
                <div
                  className={`column-tasks ${dragOverCol === col.id ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                  style={{ minHeight: '100px' }}
                >
                  {col.items.map(t => (<TaskCard key={t.id} task={t} />))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        /* ==================== LIST VIEW ==================== */
        <div className="tasks-list-view">
          <div className="tasks-list-header">
            <div className="list-col list-col-pin"></div>
            <div className="list-col list-col-title">Tarea</div>
            <div className="list-col list-col-status">Estado</div>
            <div className="list-col list-col-priority">Prioridad</div>
            <div className="list-col list-col-date">Fecha</div>
            <div className="list-col list-col-assignees">Asignados</div>
            <div className="list-col list-col-actions"></div>
          </div>
          {(columnFilter === 'all' ? allTasks : allTasks.filter(t => {
            const s = t.status || 'pending';
            return s === columnFilter;
          })).map(t => (
            <TaskListRow key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskListRow({ task }) {
  const { team, updateEvent, deleteEvent, setEventPopup } = useApp();
  const status = task.status || 'pending';
  const statusLabels = { pending: 'Pendiente', 'in-progress': 'En Progreso', completed: 'Completada' };
  const statusColors = { pending: '#F59E0B', 'in-progress': '#3B82F6', completed: '#10B981' };
  const priorityLabels = { high: 'Alta', medium: 'Media', low: 'Baja' };

  return (
    <div className={`tasks-list-row ${task.pinned ? 'pinned-row' : ''}`} onClick={(e) => {
      if (!e.target.closest('button')) setEventPopup({ open: true, eventId: task.id, x: e.clientX, y: e.clientY });
    }}>
      <div className="list-col list-col-pin">
        <button className={`pin-btn ${task.pinned ? 'pinned' : ''}`} onClick={() => updateEvent(task.id, { pinned: !task.pinned })} title={task.pinned ? 'Desfijar' : 'Fijar'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={task.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 17v5M9 3h6l-1 7h4l-6 8h-4l1-7H5l4-8z"/>
          </svg>
        </button>
      </div>
      <div className="list-col list-col-title">
        <span className="list-task-title">{task.title}</span>
        {task.meetLink && (
          <a href={task.meetLink} target="_blank" rel="noopener noreferrer" className="list-meet-badge" onClick={e => e.stopPropagation()}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            Meet
          </a>
        )}
      </div>
      <div className="list-col list-col-status">
        <span className="list-status-badge" style={{ background: statusColors[status] + '20', color: statusColors[status] }}>
          {statusLabels[status]}
        </span>
      </div>
      <div className="list-col list-col-priority">
        <span className={`task-priority ${task.priority || 'medium'}`}>{priorityLabels[task.priority || 'medium']}</span>
      </div>
      <div className="list-col list-col-date" style={{ fontSize: '12px', color: '#64748B' }}>{task.date || '—'}</div>
      <div className="list-col list-col-assignees">
        {(task.assignees || []).slice(0, 4).map(aid => {
          const m = team.find(x => x.id === aid);
          if (!m) return null;
          return m.photo
            ? <img key={aid} src={m.photo} alt={m.avatar} className="task-assignee-circle" title={m.name} style={{ width: 24, height: 24, objectFit: 'cover' }} />
            : <span key={aid} className="task-assignee-circle" style={{ background: m.color }} title={m.name}>{m.avatar}</span>;
        })}
      </div>
      <div className="list-col list-col-actions">
        <button className="task-delete-btn" onClick={() => { if (window.confirm('¿Eliminar?')) deleteEvent(task.id); }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
