import React, { useState } from 'react';
import { toast } from 'react-toastify';

const ProfileEdit = ({ user, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    roles: user?.roles || ''
  });
  const [isNewUser, setIsNewUser] = useState(!user?.id); // Si no tiene ID, es un usuario nuevo

  const handleSave = async () => {
    // Lógica simplificada sin avatar
    toast.success(isNewUser ? 'Usuario creado correctamente' : 'Perfil actualizado correctamente');
    onClose();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#000000',
            margin: 0
          }}>
            Editar Perfil de {user?.name || 'Miembro'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666666'
            }}
          >
            ×
          </button>
        </div>


        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#E9E8E6',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading || !selectedFile}
            style={{
              backgroundColor: selectedFile ? '#143568' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (isUploading || !selectedFile) ? 'not-allowed' : 'pointer',
              opacity: (isUploading || !selectedFile) ? 0.6 : 1
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;