import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar/Sidebar';
import MonthView from './components/Calendar/MonthView';
import WeekView from './components/Calendar/WeekView';
import DayView from './components/Calendar/DayView';
import TaskBoard from './components/Tasks/TaskBoard';
import TeamPulse from './components/Pulse/TeamPulse';
import EventModal from './components/Modals/EventModal';
import MemberModal from './components/Modals/MemberModal';
import EventPopup from './components/Modals/EventPopup';
import Toast from './components/shared/Toast';
import { MONTHS } from './utils/dateUtils';
import './App.css';

function AppContent() {
  const {
    currentView, calendarView, setCalendarView,
    currentDate, setCurrentDate,
    filterMemberId, setFilterMemberId, team,
    openNewEvent, eventModalOpen, memberModalOpen, eventPopup
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (calendarView === 'month') d.setMonth(d.getMonth() - 1);
      else if (calendarView === 'week') d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (calendarView === 'month') d.setMonth(d.getMonth() + 1);
      else if (calendarView === 'week') d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const filterMember = filterMemberId ? team.find(m => m.id === filterMemberId) : null;

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <main className="main-content" id="main-content">
        <header className="topbar" id="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" id="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span></span><span></span><span></span>
            </button>
            <div className="current-date-display" id="current-date-display">
              <h2 id="month-year-title">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                {filterMember && ` — ${filterMember.name}`}
              </h2>
              <span className="today-badge" id="today-badge" onClick={() => setCurrentDate(new Date())}>Hoy</span>
            </div>
          </div>

          <div className="topbar-center">
            {currentView === 'calendar' && (
              <div className="view-switcher" id="view-switcher">
                {['month', 'week', 'day'].map(v => (
                  <button
                    key={v}
                    className={`view-btn ${calendarView === v ? 'active' : ''}`}
                    onClick={() => setCalendarView(v)}
                  >
                    {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-right">
            <div className="nav-arrows">
              <button className="arrow-btn" id="prev-btn" onClick={handlePrev} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button className="arrow-btn" id="next-btn" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 6 15 12 9 18"/>
                </svg>
              </button>
            </div>
            
            <button className="add-event-btn" id="add-event-btn" onClick={() => openNewEvent()}>
              <span className="btn-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </span>
              <span className="btn-text">Nuevo Evento</span>
            </button>

            <div className="search-box" id="search-box">
              <span className="search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar eventos..."
                id="search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {filterMemberId && (
          <div className="filter-indicator" id="filter-indicator" style={{ display: 'flex' }}>
            Filtrando: <strong>{filterMember?.name}</strong>
            <button className="clear-filter-btn" onClick={() => setFilterMemberId(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Quitar filtro
            </button>
          </div>
        )}

        {currentView === 'calendar' && (
          <section className="view-panel active" id="view-calendar">
            {calendarView === 'month' && <MonthView searchQuery={searchQuery} />}
            {calendarView === 'week' && <WeekView />}
            {calendarView === 'day' && <DayView />}
          </section>
        )}

        {currentView === 'tasks' && (
          <section className="view-panel active" id="view-tasks">
            <TaskBoard />
          </section>
        )}

        {currentView === 'pulse' && (
          <section className="view-panel active" id="view-pulse">
            <TeamPulse />
          </section>
        )}
      </main>

      {eventModalOpen && <EventModal />}
      {memberModalOpen && <MemberModal />}
      {eventPopup.open && <EventPopup />}
      <Toast />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
