import React from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS, formatDate, sameDay, typeColor } from '../../utils/dateUtils';

export default function WeekView() {
  const {
    currentDate,
    getFilteredEvents,
    openNewEvent,
    setEventPopup
  } = useApp();

  const getWeekDays = () => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay();
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

  const handleCellClick = (dateStr, hour) => {
    const formattedHour = String(hour).padStart(2, '0') + ':00';
    openNewEvent({ date: dateStr, time: formattedHour });
  };

  const handleEventClick = (e, eventId) => {
    e.stopPropagation();
    setEventPopup({
      open: true,
      eventId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="week-view" id="week-view">
      <div className="week-time-grid" id="week-time-grid">
        <div className="time-header-row">
          <div className="time-header-cell"></div>
          {weekDays.map((wd, i) => {
            const isToday = sameDay(wd, new Date());
            return (
              <div
                key={i}
                className="time-header-cell"
                style={isToday ? { background: '#fff9c4', fontWeight: 700 } : {}}
              >
                {DAYS[i]} {wd.getDate()}
              </div>
            );
          })}
        </div>

        {hours.map(h => (
          <div key={h} className="time-row">
            <div className="time-label">{String(h).padStart(2, '0')}:00</div>
            {weekDays.map((wd, i) => {
              const dateStr = formatDate(wd);
              const cellEvents = filteredEvents.filter(e => e.date === dateStr && e.time && parseInt(e.time) === h);

              return (
                <div
                  key={i}
                  className="time-cell"
                  onClick={() => handleCellClick(dateStr, h)}
                >
                  {cellEvents.map(e => (
                    <div
                      key={e.id}
                      className="time-event"
                      style={{ background: typeColor(e.type), top: 0, height: '46px' }}
                      onClick={(ev) => handleEventClick(ev, e.id)}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
