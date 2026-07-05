import React from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS, formatDate, typeColor } from '../../utils/dateUtils';

export default function MonthView({ searchQuery }) {
  const {
    currentDate,
    getFilteredEvents,
    openNewEvent,
    setEventPopup
  } = useApp();

  const handleCellClick = (e, dateStr) => {
    if (!e.target.closest('.cell-event') && !e.target.closest('.cell-event-more')) {
      openNewEvent({ date: dateStr });
    }
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

  const renderCells = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDayIndex = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const prevDaysCount = new Date(y, m, 0).getDate();
    const today = new Date();
    const filteredEvents = getFilteredEvents();

    const finalEvents = searchQuery
      ? filteredEvents.filter(e =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredEvents;

    const cells = [];

    // Previous month overflow days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dateObj = new Date(y, m - 1, prevDaysCount - i);
      const dateStr = formatDate(dateObj);
      cells.push({
        dayNum: prevDaysCount - i,
        dateStr,
        isOtherMonth: true,
        isToday: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateObj = new Date(y, m, i);
      const dateStr = formatDate(dateObj);
      const isToday = y === today.getFullYear() && m === today.getMonth() && i === today.getDate();
      cells.push({
        dayNum: i,
        dateStr,
        isOtherMonth: false,
        isToday
      });
    }

    // Next month overflow days
    const totalSlots = cells.length;
    const remainingSlots = (7 - (totalSlots % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const dateObj = new Date(y, m + 1, i);
      const dateStr = formatDate(dateObj);
      cells.push({
        dayNum: i,
        dateStr,
        isOtherMonth: true,
        isToday: false
      });
    }

    return cells.map((cell, idx) => {
      const cellEvents = finalEvents.filter(e => e.date === cell.dateStr);
      const displayedEvents = cellEvents.slice(0, 3);
      const moreCount = cellEvents.length - 3;

      return (
        <div
          key={idx}
          className={`calendar-cell ${cell.isOtherMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}`}
          onClick={(e) => handleCellClick(e, cell.dateStr)}
          data-date={cell.dateStr}
        >
          <div className={`cell-date ${cell.isToday ? 'today' : ''}`}>{cell.dayNum}</div>
          <div className="cell-events">
            {displayedEvents.map(e => (
              <div
                key={e.id}
                className={`cell-event ${e.type}`}
                style={{ borderLeft: `3px solid ${typeColor(e.type)}` }}
                onClick={(ev) => handleEventClick(ev, e.id)}
                title={e.title}
              >
                {e.title}
              </div>
            ))}
            {moreCount > 0 && (
              <div className="cell-event-more">+{moreCount} más</div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="calendar-grid" id="calendar-grid">
      <div className="calendar-header-row" id="calendar-header-row">
        {DAYS.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
      </div>
      <div className="calendar-body" id="calendar-body">
        {renderCells()}
      </div>
    </div>
  );
}
