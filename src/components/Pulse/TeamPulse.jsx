import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, typeColor } from '../../utils/dateUtils';

export default function TeamPulse() {
  const { team, events } = useApp();

  const todayStr = formatDate(new Date());

  const renderTimeline = () => {
    return team.map(m => {
      // Find today's events for this member
      const memberEvents = events.filter(e =>
        e.date === todayStr &&
        e.assignees &&
        e.assignees.includes(m.id)
      );

      return (
        <div key={m.id} className="timeline-row">
          {m.photo ? (
            <img
              src={m.photo}
              alt={m.avatar}
              className="timeline-avatar-circle"
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span className="timeline-avatar-circle" style={{ background: m.color || '#999' }}>
              {m.avatar}
            </span>
          )}
          <span className="timeline-member-name">{m.name}</span>
          <div className="timeline-bar-container">
            {memberEvents.map(e => {
              const h = e.time ? parseInt(e.time) : 9;
              const eh = e.endTime ? parseInt(e.endTime) : h + 1;
              const left = ((h - 7) / 15 * 100);
              const width = ((eh - h) / 15 * 100);
              return (
                <div
                  key={e.id}
                  className="timeline-block"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 5)}%`,
                    background: typeColor(e.type)
                  }}
                  title={e.title}
                >
                  {e.title}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };



  return (
    <div className="pulse-container">
      <div className="pulse-header">
        <h2>Pulso del Equipo</h2>
        <p className="pulse-subtitle">Estado en tiempo real de la carga de trabajo y disponibilidad</p>
      </div>

      <div className="pulse-grid" id="pulse-grid">
        {team.map(m => {
          // Calculate workload based on real assigned task status
          const memberEvents = events.filter(e => e.assignees && e.assignees.includes(m.id));
          const todayEvents = memberEvents.filter(e => e.date === todayStr);

          const pending = memberEvents.filter(e => !e.status || e.status === 'pending').length;
          const inProgress = memberEvents.filter(e => e.status === 'in-progress').length;
          const completed = memberEvents.filter(e => e.status === 'completed').length;

          const workload = memberEvents.length > 0
            ? Math.round(((pending + inProgress) / memberEvents.length) * 100)
            : 0;

          const statusMap = {
            online: 'Disponible',
            busy: 'Ocupado/a',
            offline: 'Desconectado/a'
          };
          const statusClass = m.status === 'online' ? 'available' : m.status === 'busy' ? 'busy' : 'offline';

          return (
            <div key={m.id} className="pulse-card">
              <div className="pulse-card-header">
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt={m.avatar}
                    className="pulse-avatar-circle"
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span className="pulse-avatar-circle" style={{ background: m.color || '#999' }}>
                    {m.avatar}
                  </span>
                )}
                <div>
                  <div className="pulse-name">{m.name}</div>
                  <div className="pulse-role">{m.role}</div>
                </div>
                <span className={`pulse-status-badge ${statusClass}`}>{statusMap[m.status] || m.status}</span>
              </div>

              <div className="pulse-workload">
                <div className="workload-label">
                  <span>Carga activa</span>
                  <span>{workload}%</span>
                </div>
                <div className="workload-bar">
                  <div className="workload-fill" style={{ width: `${workload}%` }}></div>
                </div>
              </div>

              <div className="pulse-task-summary">
                <span className="pulse-stat pending">{pending} pendientes</span>
                <span className="pulse-stat progress">{inProgress} en progreso</span>
                <span className="pulse-stat done">{completed} completadas</span>
              </div>

              <div className="pulse-tasks-today">
                {todayEvents.length} eventos hoy | {memberEvents.length} total asignados
              </div>
            </div>
          );
        })}
      </div>

      <div className="pulse-timeline">
        <h3>Línea de Tiempo Diaria</h3>
        <div className="timeline-grid" id="timeline-grid">
          {renderTimeline()}
        </div>
      </div>


    </div>
  );
}
