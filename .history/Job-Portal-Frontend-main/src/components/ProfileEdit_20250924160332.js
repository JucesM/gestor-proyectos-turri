import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:3000/api';
console.log('Using API_BASE_URL:', API_BASE_URL);

const ProfileEdit = ({ user, onUpdate, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    roles: user?.roles || []
  });
  const [isNewUser, setIsNewUser] = useState(!user?.id); // Si no tiene ID, es un usuario nuevo
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB');
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen para el avatar');
      return;
    }

    setIsUploading(true);

    try {
      const token = sessionStorage.getItem('authToken');
      console.log('Token from sessionStorage:', token ? token.substring(0, 20) + '...' : 'Not found');
      console.log('Full token length:', token ? token.length : 0);

      if (!token) {
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
        // Redirigir al login
        window.location.href = '/';
        return;
      }

      // Verificar que el token no haya expirado
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        if (payload.exp < currentTime) {
          console.log('Token expired, redirecting to login');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userData');
          toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
          window.location.href = '/';
          return;
        }
      } catch (error) {
        console.log('Invalid token format, redirecting to login');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        toast.error('Sesión inválida. Por favor inicia sesión nuevamente.');
        window.location.href = '/';
        return;
      }

      // Los datos del usuario ya están disponibles, no necesitamos crear el usuario por separado
      console.log('User data already available:', user);

      // Ahora subir el avatar (usuario ya existe después de la sincronización)
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', selectedFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el avatar');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Avatar uploaded successfully:', uploadResult);

      toast.success(isNewUser ? 'Usuario creado correctamente' : 'Avatar actualizado correctamente');
      onUpdate && onUpdate(uploadResult.user);

      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setIsUploading(false);
    }
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
            Editar Avatar de {user?.name || 'Miembro'}
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

        {/* Avatar Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#E9E8E6',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '4px solid #E9E8E6'
          }}>
            {preview ? (
              <img
                src={preview}
                alt="Avatar preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <span style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#143568'
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: '#F2B233',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Seleccionar Imagen
            </button>
          </div>

          <p style={{
            fontSize: '12px',
            color: '#666666',
            margin: '0 0 24px 0'
          }}>
            Formatos permitidos: JPEG, PNG, GIF, WebP (máx. 5MB)
          </p>
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
            {isUploading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;