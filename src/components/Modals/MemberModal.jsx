import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function MemberModal() {
  const { setMemberModalOpen, addMember } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      alert('El nombre es requerido');
      return;
    }
    addMember(name.trim(), role.trim());
    setMemberModalOpen(false);
  };

  return (
    <div className="modal-overlay active" id="member-modal-overlay" onClick={(e) => e.target.id === 'member-modal-overlay' && setMemberModalOpen(false)}>
      <div className="modal member-modal">
        <div className="modal-header">
          <h3>Nuevo Integrante</h3>
          <button className="modal-close" onClick={() => setMemberModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="member-name-input">Nombre Completo</label>
          <input
            type="text"
            id="member-name-input"
            placeholder="Ej: Camila Losada"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="member-role-input">Rol / Cargo</label>
          <input
            type="text"
            id="member-role-input"
            placeholder="Ej: Project Manager"
            value={role}
            onChange={e => setRole(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setMemberModalOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" id="member-save" onClick={handleSave}>
            Agregar miembro
          </button>
        </div>
      </div>
    </div>
  );
}
