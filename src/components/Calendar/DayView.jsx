import React from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_FULL, MONTHS, formatDate, sameDay, typeColor } from '../../utils/dateUtils';

export default function DayView() {
  const {
    currentDate,
    getFilteredEvents,
    openNewEvent,
    setEventPopup
  } = useApp();

  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00
  const dateStr = formatDate(currentDate);
  const isToday = sameDay(currentDate, new Date());

  const handleCellClick = (hour) => {
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
    <div className="day-view" id="day-view">
      <div className="day-time-grid" id="day-time-grid">
        <div className="time-header-row">
          <div className="time-header-cell"></div>
          <div
            className="time-header-cell"
            style={isToday ? { background: '#fff9c4', fontWeight: 700 } : {}}
          >
            {DAYS_FULL[currentDate.getDay()]} {currentDate.getDate()} {MONTHS[currentDate.getMonth()]}
          </div>
        </div>

        {hours.map(h => {
          const cellEvents = filteredEvents.filter(e => e.date === dateStr && e.time && parseInt(e.time) === h);

          return (
            <div key={h} className="time-row">
              <div className="time-label">{String(h).padStart(2, '0')}:00</div>
              <div
                className="time-cell"
                onClick={() => handleCellClick(h)}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
