import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toasts } = useApp();

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
